from datetime import datetime
from pathlib import Path

from utils.file_store import read_json, write_json

def handle(data, ctx):
    skill = str(data.get("skill", "")).strip()
    aspect_index = data.get("aspect_index")
    topic_index = data.get("topic_index")
    process_index = data.get("process_index")

    if not skill or not isinstance(aspect_index, int) or not isinstance(topic_index, int) or not isinstance(process_index, int):
        return {"ok": False, "error": "Missing skill, aspect_index, topic_index, or process_index in request"}


    record = {
        "value": {
            "skill": skill,
            "aspect_index": aspect_index,
            "topic_index": topic_index,
            "process_index": process_index,
        },
        "updated_at": datetime.utcnow().isoformat() + "Z",
    }
    save_path = Path(ctx.get("root_dir")) / "storage" / "progress.json"
    write_json(save_path, record)

    return {"ok": True}
