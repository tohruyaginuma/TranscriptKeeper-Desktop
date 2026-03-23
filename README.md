# Transcript Keeper - Desktop

## Environment variables

- Development can continue to use `.env.local`.
- Production builds read `.env.production` and let it override `.env.local`.
- DMG builds bundle only `VITE_` variables into the app as `runtime-config.env`.
- Non-`VITE_` values such as tokens are intentionally excluded from the packaged app.

Example:

```env
VITE_API_ROOT=https://api.example.com
VITE_WEB_ROOT=https://app.example.com
VITE_FIREBASE_API_KEY=your-firebase-api-key
VITE_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your-project-id
VITE_FIREBASE_STORAGE_BUCKET=your-project.firebasestorage.app
VITE_FIREBASE_MESSAGING_SENDER_ID=your-messaging-sender-id
VITE_FIREBASE_APP_ID=your-app-id
VITE_FIREBASE_MEASUREMENT_ID=your-measurement-id
```

## Build DMG

```bash
npm install
npm run make:dmg
```

Artifacts are created under `out/make`.

## GitHub Release

- Pushing a tag like `v1.0.1` triggers GitHub Actions to build an arm64 DMG.
- The workflow creates or updates the GitHub Release for that tag and uploads the DMG.
- Tags that include `-`, such as `v1.0.1-rc1`, are published as prereleases.
