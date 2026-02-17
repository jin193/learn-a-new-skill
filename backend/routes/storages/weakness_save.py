import json
from datetime import datetime
from pathlib import Path

from utils.file_store import read_json, write_json

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
    questions = json.dumps(data.get("questions", []), ensure_ascii=True, indent=2)
    answers = json.dumps(data.get("answers", []), ensure_ascii=True, indent=2)
    weaknesses = data.get("weaknesses")

    if not questions or not answers or not isinstance(weaknesses, (dict, list)):
        return {"ok": False, "error": "Missing questions, answers or weaknesses in request"}

    current = _load_current_context(ctx.get("root_dir"))
    skill = current.get("skill", "")
    topic = current.get("topic", "")
    context = current.get("context", "")

    if not skill or not topic or not isinstance(context, (dict, list)):
        return {"ok": False, "error": "Missing skill, topic or context in storage"}

    context = json.dumps(context, ensure_ascii=True, indent=2)

    record = {
        "value": {
            "skill": skill,
            "topic": topic,
            "context": context,
            "questions": questions,
            "answers": answers,
            "weaknesses": weaknesses,
        },
        "saved_at": datetime.utcnow().isoformat() + "Z",
    }

    save_path = Path(ctx["root_dir"]) / "storage" / "weakness.json"

    existing = read_json(save_path, default=[])
    existing.append(record)

    write_json(save_path, existing)

    return {"ok": True}
