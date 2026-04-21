import uuid
from fastapi import APIRouter, UploadFile, File, Form, Depends, HTTPException
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from typing import Optional, List
from models import DocumentOut
from services import r2, supabase_client
from jose import jwt, JWTError
import os

router = APIRouter(prefix="/documents", tags=["documents"])
bearer = HTTPBearer()


def verify_token(credentials: HTTPAuthorizationCredentials = Depends(bearer)):
    token = credentials.credentials
    try:
        jwt.decode(
            token,
            os.environ["SUPABASE_JWT_SECRET"],
            algorithms=["HS256"],
            options={"verify_aud": False},
        )
    except JWTError:
        raise HTTPException(status_code=401, detail="Invalid token")
    return token


@router.get("", response_model=List[DocumentOut])
def get_documents():
    return supabase_client.list_documents()


@router.post("", response_model=DocumentOut)
def create_document(
    title: str = Form(...),
    description: Optional[str] = Form(None),
    file: UploadFile = File(...),
    thumbnail: Optional[UploadFile] = File(None),
    _token: str = Depends(verify_token),
):
    file_key = f"docs/{uuid.uuid4()}_{file.filename}"
    file_url = r2.upload_file(file_key, file.file.read(), file.content_type)

    thumbnail_url = None
    if thumbnail:
        thumb_key = f"thumbs/{uuid.uuid4()}_{thumbnail.filename}"
        thumbnail_url = r2.upload_file(thumb_key, thumbnail.file.read(), thumbnail.content_type)

    doc = supabase_client.insert_document({
        "title": title,
        "description": description,
        "file_url": file_key,
        "file_name": file.filename,
        "file_type": file.content_type,
        "thumbnail_url": thumb_key if thumbnail else None,
    })
    doc["file_url"] = file_url
    if thumbnail_url:
        doc["thumbnail_url"] = thumbnail_url
    return doc


@router.delete("/{doc_id}")
def delete_document(doc_id: str, _token: str = Depends(verify_token)):
    docs = supabase_client.get_client().table("documents").select("file_url,thumbnail_url").eq("id", doc_id).execute().data
    if not docs:
        raise HTTPException(status_code=404, detail="Document not found")
    doc = docs[0]
    r2.delete_file(doc["file_url"])
    if doc.get("thumbnail_url"):
        r2.delete_file(doc["thumbnail_url"])
    supabase_client.delete_document(doc_id)
    return {"deleted": doc_id}
