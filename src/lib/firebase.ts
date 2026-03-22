import { getApp, getApps, initializeApp } from 'firebase/app'
import { GoogleAuthProvider, getAuth } from 'firebase/auth'

type FirebaseRendererConfig = {
  apiKey: string
  authDomain: string
  projectId: string
  storageBucket: string
  messagingSenderId: string
  appId: string
  measurementId?: string
}

const requiredConfigKeys: Array<keyof FirebaseRendererConfig> = [
  'apiKey',
  'authDomain',
  'projectId',
  'storageBucket',
  'messagingSenderId',
  'appId',
]

function readFirebaseConfig(): FirebaseRendererConfig {
  const config: FirebaseRendererConfig = window.electronAPI.getFirebaseConfig()
  const missingKeys = requiredConfigKeys.filter((key) => !config[key])

  if (missingKeys.length > 0) {
    throw new Error(
      `Firebase config is incomplete. Missing: ${missingKeys.join(', ')}`
    )
  }

  return config
}

function getFirebaseApp() {
  if (getApps().length > 0) {
    return getApp()
  }

  return initializeApp(readFirebaseConfig())
}

export function getFirebaseAuth() {
  return getAuth(getFirebaseApp())
}

export function createGoogleProvider() {
  const provider = new GoogleAuthProvider()
  provider.setCustomParameters({
    prompt: 'select_account',
  })
  return provider
}
