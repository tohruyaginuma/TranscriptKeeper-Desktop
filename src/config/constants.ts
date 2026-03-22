export const FIREBASE_CONFIG = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY ?? '',
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN ?? '',
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID ?? '',
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET ?? '',
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID ?? '',
  appId: import.meta.env.VITE_FIREBASE_APP_ID ?? '',
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID ?? undefined,
}

export const API_ROOT = (import.meta.env.VITE_API_ROOT ?? 'http://localhost:8787')
  .replace(/\/+$/, '')

export const WEB_ROOT = (import.meta.env.VITE_WEB_ROOT ?? 'http://localhost:3000')
  .replace(/\/+$/, '')
