from pathlib import Path

from utils.file_store import read_json

def handle(data, ctx):
    context_path = Path(ctx.get("root_dir")) / "storage" / "context.json"
    record = read_json(context_path, default={})
    context = record.get("value") if isinstance(record, dict) else None
    return {"ok": bool(context), "data": context}
