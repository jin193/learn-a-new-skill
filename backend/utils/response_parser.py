import json

def parse_json_or_text(text):
    try:
        return {"type": "json", "value": json.loads(text)}
    except json.JSONDecodeError:
        return {"type": "text", "value": text}
