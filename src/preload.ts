// See the Electron documentation for details on how to use preload scripts:
// https://www.electronjs.org/docs/latest/tutorial/process-model#preload-scripts
import { ContextBridge, contextBridge } from "electron";

contextBridge.exposeInMainWorld("recorderAPI", {
  ping: () => "pong",
});
