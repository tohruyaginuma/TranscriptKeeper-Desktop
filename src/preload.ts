// See the Electron documentation for details on how to use preload scripts:
// https://www.electronjs.org/docs/latest/tutorial/process-model#preload-scripts
import { ContextBridge, contextBridge, ipcRenderer } from "electron";

contextBridge.exposeInMainWorld("electronAPI", {
  ping: () => "pong",
  saveAudioFile: (arrayBuffer: ArrayBuffer, defaultFileName: string) => {
    return ipcRenderer.invoke("audio:save", arrayBuffer, defaultFileName);
  },
  uploadAudioFile: (filePath: string, uploadUrl: string) => {
    return ipcRenderer.invoke("audio:upload", filePath, uploadUrl);
  },
});
