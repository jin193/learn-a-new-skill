from datetime import datetime
from pathlib import Path

from utils.file_store import read_json, write_json

def _load_template(storage_dir):
    template_path = storage_dir / "preview_template.html"
    if template_path.exists():
        return template_path.read_text(encoding="utf-8")
    return ""


def _wrap_html(template, html_content, title):
    content = html_content.strip()
    wrapped = template.replace("{{title}}", title).replace("{{content}}", content)
    return wrapped


def handle(data, ctx):
    context = data.get("context")
    aspect_index = context.get("aspect_index", 1)
    topic_index = context.get("topic_index", 1)
    html_content = data.get("html", "")

    if not isinstance(context, (dict, list)) or not html_content:
        return {"ok": False, "error": "Missing context or html_content in request"}

    record = {
        "value": context,
        "saved_at": datetime.utcnow().isoformat() + "Z",
    }

    save_path = Path(ctx.get("root_dir")) / "storage" /  "context.json"
    write_json(save_path, record)

    html_dir = Path(ctx.get("root_dir")) / "html"
    preview_dir = Path(ctx.get("root_dir")) / "storage" / "preview"
    preview_dir.mkdir(parents=True, exist_ok=True)

    template = _load_template(html_dir)
    title = f"预习： {aspect_index}.{topic_index} - 知径"
    wrapped_html = _wrap_html(template, html_content, title)

    preview_path = preview_dir / f"{aspect_index}.{topic_index}.html"
    preview_path.write_text(wrapped_html, encoding="utf-8")

    return {"ok": True}
