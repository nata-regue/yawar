from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from routers import documents, auth

app = FastAPI(title="Yawar API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(documents.router)
app.include_router(auth.router)


@app.get("/health")
def health():
    return {"status": "ok"}
