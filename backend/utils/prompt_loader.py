from pathlib import Path

def load_prompt(root_dir, name):
    prompt_path = Path(root_dir) / "prompts" / f"{name}.txt"
    return prompt_path.read_text(encoding="utf-8")


def render_prompt(template, variables):
    rendered = template
    for key, value in variables.items():
        rendered = rendered.replace("{{" + key + "}}", str(value))
    return rendered
