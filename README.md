# Transcript Keeper Desktop

A macOS desktop app that records microphone and system audio simultaneously, uploads them to a backend API, and generates transcripts.

## Features

- Simultaneous recording of microphone and system audio (loopback), mixed into a single track
- Converts recordings to FLAC format and saves them locally
- Uploads audio to a backend API to request transcription
- Google account authentication via Firebase Auth
- Recording state visualizer

## Requirements

- macOS (arm64)
- Node.js 20+

> macOS only — uses the built-in `afconvert` command for audio conversion.

## Setup

```bash
npm install
```

### Environment Variables

Create a `.env.local` file in the project root. For production builds, `.env.production` overrides `.env.local`. Only `VITE_`-prefixed variables are bundled into the DMG. Non-`VITE_` values such as tokens are intentionally excluded from the packaged app.

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

## Development

```bash
npm run start
```

## Build

```bash
# Generate DMG (output to out/make/)
npm run make:dmg
```

## Release

Pushing a `v*` tag triggers GitHub Actions to build an arm64 DMG and publish it to a GitHub Release.

```bash
git tag v1.0.0
git push origin v1.0.0
```

Tags containing `-` (e.g. `v1.0.1-rc1`) are published as prereleases.

### GitHub Repository Variables

To build via GitHub Actions, register all `VITE_*` variables above under **Settings > Variables > Actions** in the repository.

## Installation (Unsigned DMG)

The DMG is unsigned, so macOS may block the app on first launch.

**Option 1:** Right-click the app in Finder → Open

**Option 2:** Run the following in Terminal:

```bash
xattr -dr com.apple.quarantine "/Applications/Transcript Keeper.app"
```

## Tech Stack

| Category | Technology |
|---|---|
| Runtime | Electron 40 |
| UI | React 19 + TypeScript |
| Build | Vite 5 + Electron Forge 7 |
| Styling | Tailwind CSS v4 + Radix UI |
| Auth | Firebase Auth (Google Sign-In) |
| System Audio | electron-audio-loopback |
| Audio Conversion | macOS `afconvert` (WAV → FLAC) |

## Architecture

```
Main Process (src/main.ts)
  ├── IPC handlers (audio saving, API calls, permission management)
  ├── electron-audio-loopback (system audio loopback)
  └── Local HTTP server (serves renderer in production builds)

Preload (src/preload.ts)
  └── Bridges Main ↔ Renderer via window.electronAPI

Renderer (src/app.tsx)
  ├── Firebase Auth (Google Sign-In)
  ├── Web Audio API (mixed recording of mic + system audio)
  └── Transcript request to backend API
```

In production builds, the main process starts a local HTTP server to serve the renderer, since Firebase Auth popups do not work over the `file://` protocol.
