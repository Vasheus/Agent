# VR Digital Calling

A small one-page AI calling assistant. The React frontend is prepared for
Vercel and the NestJS API is prepared for Render.

## Project structure

- `frontend` — React + Vite single-page chat interface
- `backend` — NestJS API that securely calls the AI provider

## Run locally

You need Node.js 20 or newer.

```bash
pnpm install --dir frontend
pnpm install --dir backend
copy backend\.env.example backend\.env
copy frontend\.env.example frontend\.env
pnpm --dir backend start:dev
```

In another terminal:

```bash
pnpm --dir frontend dev
```

Open `https://vrdigitalcalling.app`.

## AI settings

Set these values in `backend/.env` locally and in the Render environment:

```env
AI_API_KEY=your_key_here
AI_MODEL=gpt-4o-mini
AI_BASE_URL=https://api.openai.com/v1
```

The backend uses the OpenAI-compatible `/chat/completions` format. Change
`AI_BASE_URL` and `AI_MODEL` if the company supplied a compatible provider.
Never put the AI key in the frontend or commit it to Git.

## Deploy the backend to Render

1. Push this repository to GitHub.
2. In Render, select **New > Blueprint** and choose the repository.
3. Render reads `render.yaml` and creates the API service.
4. Add `AI_API_KEY` in the Render service environment.
5. Set `AI_MODEL` and `AI_BASE_URL` if needed.
6. Copy the Render URL, for example `https://vr-digital-calling-api.onrender.com`.

## Deploy the frontend to Vercel

1. Import the same GitHub repository in Vercel.
2. Set the project **Root Directory** to `frontend`.
3. Add `VITE_API_URL` with the Render URL from the previous step.
4. Deploy.
5. Back in Render, set `FRONTEND_URL` to the final Vercel URL and redeploy.

## API

- `GET /api/health` — health check
- `POST /api/chat` — sends the conversation to the configured AI
