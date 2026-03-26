# Chat App

Full-stack chat app with:

- FastAPI backend in `backend/`
- Expo mobile app in `mobile/`
- PostgreSQL persistence
- email/password auth
- avatars
- friend requests and friend-only messaging

## Local development

Backend:

```bash
cd /Users/atif/Desktop/chat-app
source .venv/bin/activate
pip install -r backend/requirements.txt
uvicorn app.main:app --app-dir backend --host 0.0.0.0 --port 8000 --reload
```

Mobile:

```bash
cd /Users/atif/Desktop/chat-app/mobile
npm install
npm start -c
```

## Deployment

Deployment prep files included in this repo:

- Render backend blueprint: `render.yaml`
- backend env template: `backend/.env.example`
- mobile env template: `mobile/.env.example`
- Expo build config: `mobile/eas.json`
- deployment runbook: `DEPLOYMENT.md`

Suggested rollout:

1. Deploy backend and Postgres on Render.
2. Set the real backend URL in `mobile/.env`.
3. Build iOS/Android with EAS.
4. Test preview builds.
5. Ship production builds.
