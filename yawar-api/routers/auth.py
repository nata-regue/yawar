from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from services.supabase_client import get_client

router = APIRouter(prefix="/auth", tags=["auth"])


class LoginRequest(BaseModel):
    email: str
    password: str


@router.post("/login")
def login(body: LoginRequest):
    try:
        response = get_client().auth.sign_in_with_password({
            "email": body.email,
            "password": body.password,
        })
        return {"access_token": response.session.access_token}
    except Exception as e:
        raise HTTPException(status_code=401, detail="Invalid credentials")
