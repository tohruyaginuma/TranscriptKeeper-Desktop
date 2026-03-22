// See the Electron documentation for details on how to use preload scripts:
// https://www.electronjs.org/docs/latest/tutorial/process-model#preload-scripts
import { contextBridge, ipcRenderer } from "electron";

contextBridge.exposeInMainWorld("electronAPI", {
  getFirebaseConfig: () => {
    return {
      apiKey: process.env.VITE_FIREBASE_API_KEY ?? '',
      authDomain: process.env.VITE_FIREBASE_AUTH_DOMAIN ?? '',
      projectId: process.env.VITE_FIREBASE_PROJECT_ID ?? '',
      storageBucket: process.env.VITE_FIREBASE_STORAGE_BUCKET ?? '',
      messagingSenderId: process.env.VITE_FIREBASE_MESSAGING_SENDER_ID ?? '',
      appId: process.env.VITE_FIREBASE_APP_ID ?? '',
      measurementId: process.env.VITE_FIREBASE_MEASUREMENT_ID ?? undefined,
    };
  },
  enableLoopbackAudio: () => {
    return ipcRenderer.invoke('enable-loopback-audio');
  },
  disableLoopbackAudio: () => {
    return ipcRenderer.invoke('disable-loopback-audio');
  },
  saveAudioFile: (arrayBuffer: ArrayBuffer, defaultFileName: string) => {
    return ipcRenderer.invoke("audio:save", { arrayBuffer, defaultFileName });
  },
  uploadAudioFile: (filePath: string, uploadUrl: string, idToken?: string) => {
    return ipcRenderer.invoke("audio:upload", { filePath, uploadUrl, idToken });
  },
});
