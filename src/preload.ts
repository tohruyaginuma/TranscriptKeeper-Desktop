// See the Electron documentation for details on how to use preload scripts:
// https://www.electronjs.org/docs/latest/tutorial/process-model#preload-scripts
import { contextBridge, ipcRenderer } from "electron";

contextBridge.exposeInMainWorld("electronAPI", {
  enableLoopbackAudio: () => {
    return ipcRenderer.invoke('enable-loopback-audio');
  },
  disableLoopbackAudio: () => {
    return ipcRenderer.invoke('disable-loopback-audio');
  },
  saveAudioFile: (arrayBuffer: ArrayBuffer, defaultFileName: string) => {
    return ipcRenderer.invoke("audio:save", { arrayBuffer, defaultFileName });
  },
  createTranscript: (
    filePath: string,
    requestUrl: string,
    language: string,
    idToken?: string
  ) => {
    return ipcRenderer.invoke("transcript:create", {
      filePath,
      requestUrl,
      language,
      idToken,
    });
  },
  uploadAudioFile: (filePath: string, uploadUrl: string, idToken?: string) => {
    return ipcRenderer.invoke("audio:upload", { filePath, uploadUrl, idToken });
  },
});
