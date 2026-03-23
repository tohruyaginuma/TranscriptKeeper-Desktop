export type FirebaseRendererConfig = {
  apiKey: string
  authDomain: string
  projectId: string
  storageBucket: string
  messagingSenderId: string
  appId: string
  measurementId?: string
}

export type AppRuntimeConfig = {
  firebase: FirebaseRendererConfig
  apiRoot: string
  webRoot: string
}

export const DEFAULT_API_ROOT = 'http://localhost:8787'
export const DEFAULT_WEB_ROOT = 'http://localhost:3000'

export const EMPTY_FIREBASE_CONFIG: FirebaseRendererConfig = {
  apiKey: '',
  authDomain: '',
  projectId: '',
  storageBucket: '',
  messagingSenderId: '',
  appId: '',
  measurementId: undefined,
}

export const DEFAULT_RUNTIME_CONFIG: AppRuntimeConfig = {
  firebase: EMPTY_FIREBASE_CONFIG,
  apiRoot: DEFAULT_API_ROOT,
  webRoot: DEFAULT_WEB_ROOT,
}
