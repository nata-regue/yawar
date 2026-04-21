# yawar-api

FastAPI backend for Yawar document management. Handles file uploads to Cloudflare R2 and metadata storage in Supabase.

## Stack
- **FastAPI** — Python web framework
- **Cloudflare R2** — file storage (S3-compatible)
- **Supabase** — PostgreSQL database + auth

## Local setup

```bash
cd yawar-api
python -m venv .venv
source .venv/bin/activate  # Windows: .venv\Scripts\activate
pip install -r requirements.txt
cp .env.example .env       # fill in real values
uvicorn main:app --reload
```

Health check: `curl http://localhost:8000/health`

## Environment variables

Copy `.env.example` to `.env` and fill in:

| Variable | Where to find it |
|---|---|
| `SUPABASE_URL` | Supabase dashboard → Settings → API → Project URL |
| `SUPABASE_SERVICE_KEY` | Supabase dashboard → Settings → API → `service_role` key |
| `SUPABASE_JWT_SECRET` | Supabase dashboard → Settings → API → JWT Secret |
| `R2_ACCOUNT_ID` | Cloudflare dashboard → R2 → Account ID (top right) |
| `R2_ACCESS_KEY_ID` | Cloudflare → R2 → Manage API tokens → token Access Key ID |
| `R2_SECRET_ACCESS_KEY` | Same token creation page (only shown once) |
| `R2_BUCKET_NAME` | Name of your R2 bucket (e.g. `yawar-docs`) |
| `R2_PUBLIC_BASE_URL` | Cloudflare → R2 → bucket → Settings → Public URL |

## Endpoints

| Method | Path | Auth | Description |
|---|---|---|---|
| GET | `/health` | No | Health check |
| GET | `/documents` | No | List all documents |
| POST | `/documents` | Bearer token | Upload file + metadata |
| DELETE | `/documents/{id}` | Bearer token | Delete document + file |
| POST | `/auth/login` | No | Get access token |

## Deploy to Render

1. New Web Service → connect `yawar` GitHub repo
2. **Root Directory:** `yawar-api`
3. Runtime: Python 3
4. Build command: `pip install -r requirements.txt`
5. Start command: `uvicorn main:app --host 0.0.0.0 --port $PORT`
6. Add all env vars from `.env.example` with real values

## Supabase schema

```sql
create table documents (
  id            uuid primary key default gen_random_uuid(),
  title         text not null,
  description   text,
  file_url      text not null,
  file_name     text not null,
  file_type     text not null,
  thumbnail_url text,
  created_at    timestamptz default now()
);

alter table documents enable row level security;
create policy "Public read"  on documents for select using (true);
create policy "Auth insert"  on documents for insert with check (auth.role() = 'authenticated');
create policy "Auth delete"  on documents for delete using (auth.role() = 'authenticated');
```
