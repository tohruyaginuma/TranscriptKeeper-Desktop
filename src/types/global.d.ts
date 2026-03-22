export {};
type SaveAudioResult =
  | { canceled: true }
  | { canceled: false; filePath: string }

declare global {
  interface Window {
    electronAPI: {
      saveAudioFile: (
        arrayBuffer: ArrayBuffer,
        defaultFileName: string
      ) => Promise<SaveAudioResult>
      uploadAudioFile: (
        filePath: string,
        uploadUrl: string
      ) => Promise<{
        ok: true
        status: number
        body: string
      }>
    };
  }
}
