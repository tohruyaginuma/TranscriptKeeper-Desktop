import { DEFAULT_RUNTIME_CONFIG } from '@/config/runtime-config'

function trimTrailingSlash(value: string) {
  return value.replace(/\/+$/, '')
}

const runtimeConfig =
  typeof window === 'undefined'
    ? DEFAULT_RUNTIME_CONFIG
    : window.electronAPI?.runtimeConfig ?? DEFAULT_RUNTIME_CONFIG

export const FIREBASE_CONFIG = runtimeConfig.firebase

export const API_ROOT = trimTrailingSlash(
  runtimeConfig.apiRoot || DEFAULT_RUNTIME_CONFIG.apiRoot
)

export const WEB_ROOT = trimTrailingSlash(
  runtimeConfig.webRoot || DEFAULT_RUNTIME_CONFIG.webRoot
)
