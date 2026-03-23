import {
  DEFAULT_RUNTIME_CONFIG,
  type FirebaseRendererConfig,
} from '@/config/runtime-config'

function trimTrailingSlash(value: string) {
  return value.replace(/\/+$/, '')
}

const electronRuntimeConfig =
  typeof window === 'undefined' ? undefined : window.electronAPI?.runtimeConfig

function readFirebaseValue(
  key: keyof FirebaseRendererConfig,
  envKey: keyof ImportMetaEnv
) {
  return (
    electronRuntimeConfig?.firebase[key] ||
    import.meta.env[envKey] ||
    DEFAULT_RUNTIME_CONFIG.firebase[key] ||
    ''
  )
}

export const FIREBASE_CONFIG: FirebaseRendererConfig = {
  apiKey: readFirebaseValue('apiKey', 'VITE_FIREBASE_API_KEY'),
  authDomain: readFirebaseValue('authDomain', 'VITE_FIREBASE_AUTH_DOMAIN'),
  projectId: readFirebaseValue('projectId', 'VITE_FIREBASE_PROJECT_ID'),
  storageBucket: readFirebaseValue('storageBucket', 'VITE_FIREBASE_STORAGE_BUCKET'),
  messagingSenderId: readFirebaseValue(
    'messagingSenderId',
    'VITE_FIREBASE_MESSAGING_SENDER_ID'
  ),
  appId: readFirebaseValue('appId', 'VITE_FIREBASE_APP_ID'),
  measurementId:
    electronRuntimeConfig?.firebase.measurementId ||
    import.meta.env.VITE_FIREBASE_MEASUREMENT_ID ||
    DEFAULT_RUNTIME_CONFIG.firebase.measurementId,
}

export const API_ROOT = trimTrailingSlash(
  electronRuntimeConfig?.apiRoot ||
    import.meta.env.VITE_API_ROOT ||
    DEFAULT_RUNTIME_CONFIG.apiRoot
)

export const WEB_ROOT = trimTrailingSlash(
  electronRuntimeConfig?.webRoot ||
    import.meta.env.VITE_WEB_ROOT ||
    DEFAULT_RUNTIME_CONFIG.webRoot
)
