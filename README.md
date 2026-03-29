
## Running the code

Run `npm i` from the project root to install the frontend dependencies.

Run `npm run dev` from the project root to start the Vite site.

Set `VITE_DEMO_MODE=true` in `.env.local` if you want the frontend to use seeded demo data without calling the backend.

The frontend expects the FastAPI backend at `http://127.0.0.1:8000` unless `VITE_API_URL` is set in `.env.local`.

The Vite app now lives in `frontend/`, but the root scripts still proxy to it so the local workflow stays the same.

## Supabase auth setup

This project uses Supabase Auth for login and stores lightweight account details in session metadata. If you also want a visible table in the Supabase dashboard, run [`supabase/schema.sql`](supabase/schema.sql) in the Supabase SQL Editor to create `public.profiles` and backfill existing users.

For local auth to work cleanly:

1. In Supabase, set the site URL to `http://localhost:5173`.
2. Add `http://localhost:5173/auth/callback` to your redirect URLs.
3. If you deploy the frontend, add the deployed `/auth/callback` URL there too.
4. In `Authentication -> Providers -> Google`, enable Google and paste your Google OAuth client ID and secret.

After that:

- `Authentication -> Users` shows signed-in accounts.
- `Table Editor -> profiles` shows the profile rows created by the SQL script.
- OAuth, magic links, and email confirmations all return through `/auth/callback` before routing the user into `/dashboard` or `/profile`.

## Running the backend locally

1. Create a Python virtual environment.
2. Install the backend requirements with `pip install -r backend/requirements.txt`.
3. Optional: copy `backend/.env.example` to `backend/.env` and fill in any API keys you want to use.
4. Start the backend from the project root with `npm run backend`.

You can also run it directly with:

`python backend/run.py`

The API will start on `http://127.0.0.1:8000` by default and exposes:

- `GET /health`
- `POST /api/generate`
- `POST /api/what-if`
- `GET /api/dashboard`
- `GET /api/sessions`

If `npm run backend` does not work, check these common issues:

1. Python is not installed or not available on your `PATH`.
2. Your virtual environment was created with a Python path that no longer exists.
3. The backend dependencies were not installed into the active environment.

## Deploying the backend to Render

This repo now includes a root `render.yaml` blueprint for the FastAPI backend.

Render service settings:

1. Create a new Blueprint service from this repository.
2. Render will use `backend/` as the service root.
3. Build command: `pip install -r requirements.txt`
4. Start command: `uvicorn run:app --host 0.0.0.0 --port $PORT`
5. Health check path: `/health`
6. The included blueprint uses the paid `starter` plan because the backend stores SQLite data on a persistent disk.

Environment variables to set in Render:

- `CORS_ORIGINS`: your frontend origin, for example `https://your-frontend-domain.com`
- `GROQ_API_KEY`: required for live Groq text generation
- `HF_TOKEN`: required for live Hugging Face image and vision generation

Persistence notes:

- The blueprint mounts a persistent disk at `/var/data`.
- `SQLITE_DB_PATH` is set to `/var/data/metrics.db` so sessions and metrics survive restarts.
- If you deploy without a disk, Render's filesystem is ephemeral and SQLite data will be lost on redeploy/restart.
