import type { AppRuntimeConfig } from '@/config/runtime-config'

export {};

type SaveAudioResult =
  | { canceled: true }
  | { canceled: false; filePath: string }

type CreateTranscriptResult = {
  transcript_id: string
}

declare global {
  interface Window {
    electronAPI: {
      runtimeConfig: AppRuntimeConfig
      enableLoopbackAudio: () => Promise<void>
      disableLoopbackAudio: () => Promise<void>
      saveAudioFile: (
        arrayBuffer: ArrayBuffer,
        defaultFileName: string
      ) => Promise<SaveAudioResult>
      createTranscript: (
        filePath: string,
        requestUrl: string,
        language: string,
        idToken?: string
      ) => Promise<CreateTranscriptResult>
      uploadAudioFile: (
        filePath: string,
        uploadUrl: string,
        idToken?: string
      ) => Promise<{
        ok: true
        status: number
        body: string
      }>
    }
  }
}
