from pydantic import BaseModel
from typing import Optional
from datetime import datetime


class DocumentOut(BaseModel):
    id: str
    title: str
    description: Optional[str]
    file_url: str
    file_name: str
    file_type: str
    thumbnail_url: Optional[str]
    created_at: datetime
