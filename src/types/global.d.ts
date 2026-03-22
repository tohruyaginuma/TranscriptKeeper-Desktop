export {};

declare global {
  interface Window {
    electronAPI: {
      saveAudioFile: (
        arrayBuffer: ArrayBuffer,
        defaultFileName: string
      ) => Promise<
        | { canceled: true }
        | { canceled: false; filePath: string }
      >
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
