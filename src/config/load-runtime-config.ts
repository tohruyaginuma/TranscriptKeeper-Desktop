import fs from 'node:fs'
import path from 'node:path'
import {
  DEFAULT_RUNTIME_CONFIG,
  type AppRuntimeConfig,
} from './runtime-config'

const RUNTIME_ENV_FILE_NAME = 'runtime-config.env'

function stripWrappingQuotes(value: string) {
  if (
    (value.startsWith('"') && value.endsWith('"')) ||
    (value.startsWith("'") && value.endsWith("'"))
  ) {
    return value.slice(1, -1)
  }

  return value
}

function parseEnvFile(contents: string) {
  const env: Record<string, string> = {}

  for (const line of contents.split(/\r?\n/)) {
    const trimmedLine = line.trim()

    if (!trimmedLine || trimmedLine.startsWith('#')) {
      continue
    }

    const normalizedLine = trimmedLine.startsWith('export ')
      ? trimmedLine.slice(7).trim()
      : trimmedLine
    const separatorIndex = normalizedLine.indexOf('=')

    if (separatorIndex === -1) {
      continue
    }

    const key = normalizedLine.slice(0, separatorIndex).trim()
    const value = normalizedLine.slice(separatorIndex + 1).trim()

    if (!key) {
      continue
    }

    env[key] = stripWrappingQuotes(value)
  }

  return env
}

function readEnvFileIfExists(filePath: string) {
  try {
    return parseEnvFile(fs.readFileSync(filePath, 'utf8'))
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
      return {}
    }

    throw error
  }
}

function getLocalEnvFileNames() {
  const mode = process.env.NODE_ENV === 'development' ? 'development' : 'production'

  return ['.env', '.env.local', `.env.${mode}`, `.env.${mode}.local`]
}

function getEnvSearchDirectories() {
  const directories = [
    process.cwd(),
    path.resolve(__dirname, '..', '..'),
  ]

  return directories.filter(
    (directory, index) => directories.indexOf(directory) === index
  )
}

function loadPublicEnv() {
  const env = {
    ...readEnvFileIfExists(path.join(process.resourcesPath, RUNTIME_ENV_FILE_NAME)),
  }

  for (const directory of getEnvSearchDirectories()) {
    for (const fileName of getLocalEnvFileNames()) {
      Object.assign(env, readEnvFileIfExists(path.join(directory, fileName)))
    }
  }

  return env
}

function trimTrailingSlash(value: string) {
  return value.replace(/\/+$/, '')
}

export function loadRuntimeConfig(): AppRuntimeConfig {
  const publicEnv = loadPublicEnv()
  const readValue = (key: string, fallback = '') =>
    publicEnv[key] ?? process.env[key] ?? fallback

  return {
    firebase: {
      apiKey: readValue('VITE_FIREBASE_API_KEY'),
      authDomain: readValue('VITE_FIREBASE_AUTH_DOMAIN'),
      projectId: readValue('VITE_FIREBASE_PROJECT_ID'),
      storageBucket: readValue('VITE_FIREBASE_STORAGE_BUCKET'),
      messagingSenderId: readValue('VITE_FIREBASE_MESSAGING_SENDER_ID'),
      appId: readValue('VITE_FIREBASE_APP_ID'),
      measurementId: readValue('VITE_FIREBASE_MEASUREMENT_ID') || undefined,
    },
    apiRoot: trimTrailingSlash(
      readValue('VITE_API_ROOT', DEFAULT_RUNTIME_CONFIG.apiRoot)
    ),
    webRoot: trimTrailingSlash(
      readValue('VITE_WEB_ROOT', DEFAULT_RUNTIME_CONFIG.webRoot)
    ),
  }
}
