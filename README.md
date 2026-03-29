
## Running the code

Run `npm i` from the project root to install the frontend dependencies.

Run `npm run dev` from the project root to start the Vite site.

Set `VITE_DEMO_MODE=true` in `.env.local` if you want the frontend to use seeded demo data without calling the backend.

The frontend expects the FastAPI backend at `http://127.0.0.1:8000` unless `VITE_API_URL` is set in `.env.local`.

The Vite app now lives in `frontend/`, but the root scripts still proxy to it so the local workflow stays the same.

## Supabase auth setup

This project uses Supabase Auth for login and Supabase Postgres for persisted profile and app-session history. Run [`supabase/schema.sql`](supabase/schema.sql) in the Supabase SQL Editor to create `public.profiles`, `public.app_sessions`, and the RPC helpers the frontend uses for dashboard/session history.

For local auth to work cleanly:

1. In Supabase, set the site URL to `http://localhost:5173`.
2. Add `http://localhost:5173/auth/callback` to your redirect URLs.
3. If you deploy the frontend, add the deployed `/auth/callback` URL there too.
4. In Google Cloud, open your OAuth 2.0 client and add your Supabase callback URL to `Authorized redirect URIs`.
   For this project, that is `https://culmogqueuddchdmetyt.supabase.co/auth/v1/callback`.
5. In `Authentication -> Providers -> Google`, enable Google and paste your Google OAuth client ID and secret.

Important:

- Supabase `Redirect URLs` should contain your app routes such as `http://localhost:5173/auth/callback` or your deployed frontend callback route.
- Google `Authorized redirect URIs` should contain the Supabase Auth callback URL, not your frontend callback route.
- `redirectTo` in `signInWithOAuth()` tells Supabase where to send the browser after Auth finishes. It does not replace the Google callback URI.

After that:

- `Authentication -> Users` shows signed-in accounts.
- `Table Editor -> profiles` shows the profile rows created by the SQL script.
- `Table Editor -> app_sessions` shows stored composer and what-if history for each scoped visitor.
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
- `POST /api/analyze`

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
6. A persistent disk is no longer required for app session history because that data lives in Supabase.

Environment variables to set in Render:

- `CORS_ORIGINS`: your frontend origin, for example `https://your-frontend-domain.com`
- `GROQ_API_KEY`: required for live Groq text generation
- `HF_TOKEN`: required for live Hugging Face image and vision generation
