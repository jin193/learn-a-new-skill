from datetime import datetime
from pathlib import Path

from utils.file_store import read_json, write_json

def handle(data, ctx):
    stage = data.get("stage")

    if not stage:
        return {"ok": False, "error": "Missing stage in request"}

    record = {
        "value": stage,
        "saved_at": datetime.utcnow().isoformat() + "Z",
    }

    save_path = Path(ctx.get("root_dir")) / "storage" / "stage.json"
    write_json(save_path, record)
    return {"ok": True}
