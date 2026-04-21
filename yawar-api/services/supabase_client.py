import os
from supabase import create_client, Client

_client: Client = None


def get_client() -> Client:
    global _client
    if _client is None:
        _client = create_client(
            os.environ["SUPABASE_URL"],
            os.environ["SUPABASE_SERVICE_KEY"],
        )
    return _client


def list_documents():
    return get_client().table("documents").select("*").order("created_at", desc=True).execute().data


def insert_document(data: dict):
    return get_client().table("documents").insert(data).execute().data[0]


def delete_document(doc_id: str):
    return get_client().table("documents").delete().eq("id", doc_id).execute().data
