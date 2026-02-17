from utils.ai_client import call_ai
from utils.prompt_loader import load_prompt, render_prompt
from utils.response_parser import parse_json_or_text


def handle(data, ctx):
    skill = data.get("skill", "")
    if not skill:
        return {"ok": False, "error": "Missing skill in request"}

    template = load_prompt(ctx.get("root_dir"), "outline")
    prompt = render_prompt(
        template, 
        {
            "skill": skill,
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
