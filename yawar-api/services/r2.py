import boto3
import os
from botocore.config import Config

_client = None


def get_client():
    global _client
    if _client is None:
        _client = boto3.client(
            "s3",
            endpoint_url=f"https://{os.environ['R2_ACCOUNT_ID']}.r2.cloudflarestorage.com",
            aws_access_key_id=os.environ["R2_ACCESS_KEY_ID"],
            aws_secret_access_key=os.environ["R2_SECRET_ACCESS_KEY"],
            config=Config(signature_version="s3v4"),
            region_name="auto",
        )
    return _client


BUCKET = lambda: os.environ["R2_BUCKET_NAME"]


def upload_file(key: str, data: bytes, content_type: str) -> str:
    get_client().put_object(
        Bucket=BUCKET(),
        Key=key,
        Body=data,
        ContentType=content_type,
    )
    return f"{os.environ['R2_PUBLIC_BASE_URL']}/{key}"


def delete_file(key: str):
    get_client().delete_object(Bucket=BUCKET(), Key=key)
