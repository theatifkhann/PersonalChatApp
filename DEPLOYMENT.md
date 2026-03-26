# Deployment Guide

## Backend

This repo includes a Render Blueprint at `render.yaml`.

Backend service settings:

- Build command: `pip install -r backend/requirements.txt`
- Start command: `uvicorn app.main:app --app-dir backend --host 0.0.0.0 --port $PORT`
- Health check: `/health`

Before syncing the Blueprint, update `CORS_ALLOW_ORIGINS` in `render.yaml` to match your deployed web app origin if you plan to use the web build in a browser.

## Mobile

The mobile app supports deployed API URLs through Expo public env vars.

Create `mobile/.env` from `mobile/.env.example`:

```env
EXPO_PUBLIC_API_URL=https://chat-app-api.onrender.com
EXPO_PUBLIC_WS_URL=wss://chat-app-api.onrender.com
```

If `EXPO_PUBLIC_WS_URL` is omitted, the app derives it from `EXPO_PUBLIC_API_URL`.

For local development, the app still falls back to the manual backend-host field.

## Expo Builds

`mobile/eas.json` is included with:

- `preview` for internal builds
- `production` for store builds

Typical commands:

```bash
cd mobile
npx eas login
npx eas build --platform ios --profile preview
npx eas build --platform ios --profile production
```

## Suggested rollout

1. Deploy the backend and database on Render.
2. Confirm `https://chat-app-api.onrender.com/health` returns OK.
3. Set `EXPO_PUBLIC_API_URL` and `EXPO_PUBLIC_WS_URL`.
4. Build a preview app with EAS and test against the public backend.
5. When stable, produce the store build and submit it.
