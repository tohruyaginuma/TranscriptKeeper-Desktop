export {};

type FirebaseWebConfig = {
  apiKey: string
  authDomain: string
  projectId: string
  storageBucket: string
  messagingSenderId: string
  appId: string
  measurementId?: string
}

type SaveAudioResult =
  | { canceled: true }
  | { canceled: false; filePath: string }

declare global {
  interface Window {
    electronAPI: {
      getFirebaseConfig: () => FirebaseWebConfig
      enableLoopbackAudio: () => Promise<void>
      disableLoopbackAudio: () => Promise<void>
      saveAudioFile: (
        arrayBuffer: ArrayBuffer,
        defaultFileName: string
      ) => Promise<SaveAudioResult>
      uploadAudioFile: (
        filePath: string,
        uploadUrl: string,
        idToken?: string
      ) => Promise<{
        ok: true
        status: number
        body: string
      }>
    };
  }
}
