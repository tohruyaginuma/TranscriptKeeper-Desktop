import { API_ROOT } from '@/config/constants'

type JsonValue = Record<string, unknown>

type CreateNoteResponse = {
  note_id: string
}

type AuthSyncResponse = Record<string, unknown>

function buildApiUrl(pathname: string) {
  const normalizedPath = pathname.startsWith('/') ? pathname : `/${pathname}`
  return `${API_ROOT}${normalizedPath}`
}

async function postJson<TResponse>(
  pathname: string,
  idToken: string,
  body?: JsonValue
): Promise<TResponse> {
  if (!API_ROOT) {
    throw new Error('API_ROOT is not configured')
  }

  const response = await fetch(buildApiUrl(pathname), {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${idToken}`,
      'Content-Type': 'application/json',
    },
    body: body ? JSON.stringify(body) : undefined,
  })

  const text = await response.text()

  if (!response.ok) {
    throw new Error(`API request failed: ${response.status} ${text}`)
  }

  if (!text) {
    return {} as TResponse
  }

  return JSON.parse(text) as TResponse
}

export async function syncAuthWithApi(idToken: string) {
  return postJson<AuthSyncResponse>('/v1/auth', idToken)
}

export async function createNote(idToken: string, title: string) {
  return postJson<CreateNoteResponse>('/v1/notes', idToken, { title })
}

export function buildTranscriptUrl(noteId: string) {
  return buildApiUrl(`/v1/notes/${noteId}/transcripts`)
}
