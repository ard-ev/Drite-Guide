from pathlib import Path

from fastapi import HTTPException, UploadFile, status

from app.core.config import settings
from app.utils.files import build_relative_upload_path, generate_unique_filename


ALLOWED_IMAGE_TYPES = {"image/jpeg", "image/png", "image/webp", "image/svg+xml"}


class LocalFileService:
    async def save_upload(self, file: UploadFile, folder: str) -> str:
        if file.content_type not in ALLOWED_IMAGE_TYPES:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Unsupported file type.")

        content = await file.read()
        if len(content) > settings.MAX_UPLOAD_SIZE_BYTES:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="File exceeds size limit.")

        filename = generate_unique_filename(file.filename or "upload.bin")
        relative_path = build_relative_upload_path(folder, filename)
        absolute_path = Path(settings.UPLOAD_DIR).parent / relative_path
        absolute_path.parent.mkdir(parents=True, exist_ok=True)
        absolute_path.write_bytes(content)
        await file.close()
        return relative_path


file_service = LocalFileService()

