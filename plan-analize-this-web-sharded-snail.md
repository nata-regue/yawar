# Implementation Plan: Document Resources Feature (Yawar NGO)

## Context
Yawar needs an admin-facing document management system (upload PDFs + metadata + optional thumbnail)
and a public `/recursos` page where visitors can browse and download those documents.
Stack: Astro SSG frontend (existing) + new Python FastAPI repo + Cloudflare R2 (files) + Supabase (DB + auth).
All services use free tiers. No existing accounts. Python API lives in a **separate repo** (`yawar-api`).
Every step must be documented in the relevant README.md.

---

## Execution order — one step at a time

### STEP 1 — Cloudflare account + R2 bucket (no code, ~20 min)
**Do this first** — you need the R2 credentials before writing any API code.

Actions:
1. Create free account at cloudflare.com
2. Enable R2 (requires credit card for identity verification, never charged on free tier)
3. Create bucket named `yawar-docs`
4. Create an R2 API token with Object Read & Write permissions
5. Note down: `account_id`, `access_key_id`, `secret_access_key`, `bucket_name`

Document in `yawar-api/README.md`: what each env var is and where to find it in the Cloudflare dashboard.

---

### STEP 2 — Supabase project + schema + auth (no code, ~30 min)
**Do this second** — you need the DB URL and service key before writing the API.

Actions:
1. Create free account at supabase.com
2. Create project named `yawar` (choose a region close to Bolivia — US East or similar)
3. Create the `documents` table via the Supabase SQL editor:

```sql
create table documents (
  id          uuid primary key default gen_random_uuid(),
  title       text not null,
  description text,
  file_url    text not null,       -- R2 object key (not full URL)
  file_name   text not null,       -- original filename
  file_type   text not null,       -- e.g. "application/pdf"
  thumbnail_url text,              -- R2 object key for thumbnail (optional)
  created_at  timestamptz default now()
);

-- Allow public read (for the /recursos page)
alter table documents enable row level security;
create policy "Public read" on documents for select using (true);
create policy "Auth insert" on documents for insert with check (auth.role() = 'authenticated');
create policy "Auth delete" on documents for delete using (auth.role() = 'authenticated');
```

4. Go to Authentication → create one admin user (email + password)
5. Note down: `SUPABASE_URL`, `SUPABASE_SERVICE_KEY` (Settings → API)

Document in `yawar-api/README.md`: schema, where to find keys, how to add/remove admin users.

---

### STEP 3 — Create `yawar-api`  (FastAPI, ~3-4 hours)
**Subfolder inside the existing `yawar` repo** (`yawar-api/` already exists and is populated). Structure:

```
yawar-api/
├── main.py               # FastAPI app entry point
├── routers/
│   ├── documents.py      # GET /documents, POST /documents, DELETE /documents/{id}
│   └── auth.py           # POST /auth/login  (proxies Supabase auth)
├── services/
│   ├── r2.py             # upload_file(), delete_file(), get_presigned_url()
│   └── supabase.py       # insert_document(), list_documents(), delete_document()
├── models.py             # Pydantic schemas
├── requirements.txt
├── Dockerfile
├── .env.example          # template with all required vars (no real values)
├── .env                  # real values — gitignored, never commit
└── README.md             # full setup + deployment instructions
```

**Status: ✅ Complete** — all files created, API deployed at `https://yawar-api-vf.onrender.com`

**Key endpoints:**
| Method | Path | Auth required | Purpose |
|--------|------|--------------|---------|
| GET | `/documents` | No | List all documents (public) |
| POST | `/documents` | Yes (Bearer token) | Upload file + register metadata |
| DELETE | `/documents/{id}` | Yes | Remove document + file from R2 |
| GET | `/health` | No | Render health check |

**`.env.example`** (document every variable in README):
```
SUPABASE_URL=
SUPABASE_SERVICE_KEY=
R2_ACCOUNT_ID=
R2_ACCESS_KEY_ID=
R2_SECRET_ACCESS_KEY=
R2_BUCKET_NAME=yawar-docs
R2_PUBLIC_BASE_URL=    # public bucket URL from Cloudflare dashboard
```

**Python dependencies (`requirements.txt`):**
```
fastapi
uvicorn
python-multipart       # file uploads
boto3                  # R2 is S3-compatible
supabase               # supabase-py client
python-jose            # JWT validation
pydantic
python-dotenv
```

---

### STEP 4 — Deploy `yawar-api` to Render.com (~30 min)
1. Create free account at render.com
2. New Web Service → connect GitHub repo `yawar` (the monorepo)
3. Settings:
   - **Root Directory:** `yawar-api`
   - Runtime: Python 3
   - Build command: `pip install -r requirements.txt`
   - Start command: `uvicorn main:app --host 0.0.0.0 --port $PORT`
4. Add all env vars from `.env.example` with real values (Render → Environment tab)
5. Deployed URL: `https://yawar-api-vf.onrender.com`

**Status: ✅ Complete** — service live at `https://yawar-api-vf.onrender.com`

**Note on free tier cold starts:** Render free services sleep after 15 min idle. Admin uploads will have a ~30s wait on first request. Acceptable for infrequent admin use.

---

### STEP 5 — Admin UI in Astro (`/admin` page, ~3-4 hours)
**Back in the `yawar` frontend repo.**

- Add `@astrojs/react` integration: `pnpm astro add react`
- Create `src/pages/admin/index.astro` — protected route
- Create `src/components/admin/DocumentUploadForm.tsx` — React form:
  - Fields: title (required), description (optional), file upload (required), thumbnail (optional)
  - On submit: POST to `yawar-api.onrender.com/documents` with Bearer token
  - Shows upload progress, success/error feedback
- Auth: Supabase JS client login form — stores token in `localStorage`
- Guard: redirect to login if no token

**New env var in Astro** (`.env`):
```
PUBLIC_API_URL=https://yawar-api.onrender.com
PUBLIC_SUPABASE_URL=https://qbbkxpdknykblknkuvms.supabase.co
PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFiYmt4cGRrbnlrYmxrbmt1dm1zIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzY3OTAyMDYsImV4cCI6MjA5MjM2NjIwNn0.yqMpQh7Coehx-f8wI906pfo0wCdr-8qPI62tRe36vyM
```

---

### STEP 6 — Public `/recursos` page in Astro (~2 hours)
- `src/pages/recursos/index.astro` already exists (currently empty/placeholder)
- At build time, fetch `GET /documents` from the API
- Display document cards: thumbnail (or default icon), title, description, download button
- Download button links directly to R2 pre-signed URL (no bandwidth cost)
- Add to navigation (`src/utils/navigation.ts`)

---

## Critical files to create/modify

| File | Repo | Action |
|------|------|--------|
| `yawar-api/main.py` | yawar-api (new) | Create |
| `yawar-api/routers/documents.py` | yawar-api (new) | Create |
| `yawar-api/services/r2.py` | yawar-api (new) | Create |
| `yawar-api/services/supabase.py` | yawar-api (new) | Create |
| `yawar-api/README.md` | yawar-api (new) | Create — full setup docs |
| `src/pages/admin/index.astro` | yawar | Create |
| `src/components/admin/DocumentUploadForm.tsx` | yawar | Create |
| `src/pages/recursos/index.astro` | yawar | Modify (currently exists, empty) |
| `src/utils/navigation.ts` | yawar | Modify — add /recursos link |
| `README.md` | yawar | Modify — add API URL env var docs |

---

## Verification per step

- Step 1: Cloudflare dashboard shows `yawar-docs` bucket exists
- Step 2: Supabase table editor shows `documents` table; test insert via SQL editor
- Step 3: `uvicorn main:app --reload` runs locally; `curl localhost:8000/health` returns 200
- Step 4: `curl https://yawar-api.onrender.com/health` returns 200
- Step 5: Admin login works; upload a test PDF; appears in Supabase table + R2 bucket
- Step 6: `/recursos` page shows uploaded document with working download link
