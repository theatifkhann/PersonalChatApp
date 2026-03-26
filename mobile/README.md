# Chat App Mobile

This Expo app connects to the FastAPI backend in `../backend`.

## Environment

For production or preview builds, create `mobile/.env` from `mobile/.env.example` and set:

```bash
EXPO_PUBLIC_API_URL=https://chat-app-api.onrender.com
EXPO_PUBLIC_WS_URL=wss://chat-app-api.onrender.com
```

If those values are missing, the app falls back to the local backend-host field for development.

## Run

1. Install dependencies:

   ```bash
   npm install
   ```

2. Start the Expo dev server:

   ```bash
   npm start
   ```

3. Open the app in:
   - iOS Simulator with `i`
   - Android emulator with `a`
   - Expo Go on a physical device by scanning the QR code

## Backend

Start the backend from the repository root:

```bash
uvicorn app.main:app --app-dir backend --host 0.0.0.0 --port 8000
```

## Build

Preview and production build profiles are defined in `eas.json`.

```bash
npx eas build --platform ios --profile preview
npx eas build --platform ios --profile production
```
