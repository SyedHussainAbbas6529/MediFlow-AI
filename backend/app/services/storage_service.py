import os
import shutil
import uuid
from typing import Tuple
from app.core.config import settings

class StorageService:
    def __init__(self):
        self.upload_dir = settings.STORAGE_LOCAL_DIR
        os.makedirs(self.upload_dir, exist_ok=True)
    
    async def save_file(self, filename: str, content: bytes) -> Tuple[str, int]:
        unique_name = f"{uuid.uuid4()}_{filename}"
        file_path = os.path.join(self.upload_dir, unique_name)
        with open(file_path, "wb") as f:
            f.write(content)
        return file_path, len(content)
    
    def get_file_path(self, relative_path: str) -> str:
        return os.path.join(self.upload_dir, relative_path)

storage_service = StorageService()
