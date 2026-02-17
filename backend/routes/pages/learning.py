import json
from pathlib import Path

from utils.ai_client import call_ai
from utils.file_store import read_json
from utils.prompt_loader import load_prompt, render_prompt
from utils.response_parser import parse_json_or_text

def _load_current_context(root_dir):
    storage_dir = Path(root_dir) / "storage"
    context_path = storage_dir / "context.json"
    context_payload = read_json(context_path, default={})
    value = context_payload.get("value") or context_payload
    return {
        "skill": value.get("skill", ""),
        "topic": value.get("topic", ""),
        "context": value.get("context", ""),
    }

def handle(data, ctx):
    current = _load_current_context(ctx.get("root_dir"))
    skill = current.get("skill", "")
    topic = current.get("topic", "")
    context = current.get("context", "")

    if not skill or not topic or not isinstance(context, (dict, list)):
        return {"ok": False, "error": "Missing skill, topic or context in storage"}

    context = json.dumps(context, ensure_ascii=True, indent=2)

    template = load_prompt(ctx.get("root_dir"), "learning")
    prompt = render_prompt(
        template,
        {
            "skill": skill,
            "topic": topic,
            "context": context,
        },
    )
    
    response = call_ai(prompt)
    parsed = parse_json_or_text(response.get("content", ""))

    if parsed.get("type") == "text":
        return {"ok": False, "error": "format error", "content": parsed.get("value", "")}

    return {
        "ok": response.get("ok", False),
        "result": parsed.get("value", {}),
    }
