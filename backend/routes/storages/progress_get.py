from pathlib import Path

from utils.file_store import read_json

def handle(data, ctx):
    progress_path = Path(ctx.get("root_dir")) / "storage" / "progress.json"
    record = read_json(progress_path, default={})
    progress = record.get("value") if isinstance(record, dict) else None
    return {"ok": bool(progress), "data": progress}
