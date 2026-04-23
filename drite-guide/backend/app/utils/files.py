import os
import uuid
from pathlib import Path


def generate_unique_filename(original_name: str) -> str:
    suffix = Path(original_name).suffix.lower()
    return f"{uuid.uuid4()}{suffix}"


def build_relative_upload_path(folder: str, filename: str) -> str:
    return os.path.join("uploads", folder, filename).replace("\\", "/")

