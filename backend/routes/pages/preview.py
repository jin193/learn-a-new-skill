from pathlib import Path

from utils.ai_client import call_ai
from utils.file_store import read_json
from utils.prompt_loader import load_prompt, render_prompt
from utils.response_parser import parse_json_or_text

def _load_current_stage(root_dir):
    storage_dir = Path(root_dir) / "storage"
    context_path = storage_dir / "stage.json"
    value = read_json(context_path, default={}).get("value")
    return {
        "skill": value.get("skill"),
        "stages": value.get("stages"),
    }

def _load_current_progress(root_dir):
    storage_dir = Path(root_dir) / "storage"
    context_path = storage_dir / "progress.json"
    value = read_json(context_path, default={}).get("value")
    return {
        "aspect_index": value.get("aspect_index"),
        "topic_index": value.get("topic_index"),
    }

def handle(data, ctx):
    current = _load_current_stage(ctx.get("root_dir"))
    skill = current.get("skill", "")
    stages = current.get("stages", "")

    current = _load_current_progress(ctx.get("root_dir"))
    aspect_index = current.get("aspect_index", 1)
    topic_index = current.get("topic_index", 1)

    aspect = stages[aspect_index - 1].get("title", "")
    topic = stages[aspect_index - 1].get("topics")[topic_index - 1]

    if not aspect or not topic:
        return {"ok": False, "error": "Missing aspect or topic in storage"}

    template = load_prompt(ctx.get("root_dir"), "preview")
    prompt = render_prompt(
        template,
        {
            "skill": skill,
            "stage": aspect,
            "topic": topic,
        },
    )

    response = call_ai(prompt)
    parsed = parse_json_or_text(response.get("content", ""))

    if parsed.get("type") == "text":
        return {"ok": False, "error": "format error", "content": parsed.get("value", "")}

    return {
        "ok": response["ok"],
        "result": {
            "context": parsed.get("value", {}),
            "skill": skill,
            "stage": aspect,
            "topic": topic,
            "aspect_index": aspect_index,
            "topic_index": topic_index,
        },
    }
