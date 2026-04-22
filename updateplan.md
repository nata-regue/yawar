# Plan: Update Document Resources Plan — Monorepo Approach

## Context
The original plan put `yawar-api` in a separate GitHub repo. The user prefers to keep everything in the existing `yawar` repo as a subfolder. `yawar-api/` already exists inside the repo. Render supports deploying from a subdirectory, so this works cleanly: Vercel deploys the Astro root, Render deploys `yawar-api/`.

## Change: Update plan-analize-this-web-sharded-snail.md

### Step 3 — change from "new separate GitHub repo" to subfolder
- Replace: `**New separate GitHub repo.**`
- With: `**Subfolder inside the existing `yawar` repo.**`
- The `yawar-api/` directory already exists — just populate it.
- Remove any mention of creating a new GitHub repo.

### Step 4 — Render deploy from subfolder
Add one setting to the Render Web Service configuration:
- **Root Directory:** `yawar-api`

This tells Render to treat `yawar-api/` as the project root. Build and start commands remain the same.

### Critical files table — update repo column
All `yawar-api` files are now listed under the `yawar` repo (not a separate repo):

| File | Repo | Action |
|------|------|--------|
| `yawar-api/main.py` | yawar | Create |
| `yawar-api/routers/documents.py` | yawar | Create |
| `yawar-api/services/r2.py` | yawar | Create |
| `yawar-api/services/supabase.py` | yawar | Create |
| `yawar-api/requirements.txt` | yawar | Create |
| `yawar-api/Dockerfile` | yawar | Create |
| `yawar-api/.env.example` | yawar | Create |
| `yawar-api/README.md` | yawar | Modify (file exists) |
| `src/pages/admin/index.astro` | yawar | Create |
| `src/components/admin/DocumentUploadForm.tsx` | yawar | Create |
| `src/pages/recursos/index.astro` | yawar | Modify |
| `src/utils/navigation.ts` | yawar | Modify |
| `README.md` | yawar | Modify |

### .gitignore — add Python artifacts
Add to `yawar/.gitignore`:
```
yawar-api/__pycache__/
yawar-api/.venv/
yawar-api/*.egg-info/
yawar-api/.env
```

## Verification
- Step 3: `cd yawar-api && uvicorn main:app --reload` runs locally
- Step 4: In Render dashboard, Root Directory set to `yawar-api`; `curl https://yawar-api.onrender.com/health` returns 200
- Vercel deploys Astro root unaffected — `yawar-api/` is ignored by Vercel
