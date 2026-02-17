from pathlib import Path

from utils.file_store import read_json

def handle(data, ctx):
    stage_path = Path(ctx.get("root_dir")) / "storage" / "stage.json"
    record = read_json(stage_path, default={})
    stage = record.get("value") if isinstance(record, dict) else None
    return {"ok": bool(stage), "data": stage}
