import os
import requests


def call_ai(prompt, system_prompt=None):
    api_key = os.getenv("AI_API_KEY")
    base_url = os.getenv("AI_BASE_URL", "https://api.deepseek.com")
    model = os.getenv("AI_MODEL", "deepseek-chat")

    if not api_key:
        return {
            "ok": False,
            "content": "please set AI_API_KEY in environment variables",
        }

    url = base_url.rstrip("/") + "/chat/completions"
    headers = {
        "Authorization": f"Bearer {api_key}",
        "Content-Type": "application/json",
    }

    messages = []
    if system_prompt:
        messages.append({"role": "system", "content": system_prompt})
    messages.append({"role": "user", "content": prompt})

    payload = {
        "model": model,
        "messages": messages,
        "temperature": 0.4,
        "response_format": {
            "type": "json_object" # https://api-docs.deepseek.com/guides/json_mode
        }
    }

    response = requests.post(url, headers=headers, json=payload, timeout=60)
    response.raise_for_status()
    data = response.json()

    content = data.get("choices", [{}])[0].get("message", {}).get("content", "")
    return {"ok": True, "content": content}
