import { app, BrowserWindow, session, ipcMain, dialog } from "electron";
import path from "node:path";
import started from "electron-squirrel-startup";
import fs from "fs/promises";

// Handle creating/removing shortcuts on Windows when installing/uninstalling.
if (started) {
  app.quit();
}

const createWindow = () => {
  // Create the browser window.
  const mainWindow = new BrowserWindow({
    width: 400,
    height: 700,
    resizable: true,
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
    },
  });

  // and load the index.html of the app.
  if (MAIN_WINDOW_VITE_DEV_SERVER_URL) {
    mainWindow.loadURL(MAIN_WINDOW_VITE_DEV_SERVER_URL);
  } else {
    mainWindow.loadFile(
      path.join(__dirname, `../renderer/${MAIN_WINDOW_VITE_NAME}/index.html`),
    );
  }

  // Open the DevTools.
  mainWindow.webContents.openDevTools();
};

const recordVoiceHandle = () => {
  session.defaultSession.setDisplayMediaRequestHandler(null)
  ipcMain.handle(
    'audio:save',
    async (_event, args: { arrayBuffer: ArrayBuffer; defaultFileName: string }) => {
      const { arrayBuffer, defaultFileName } = args

      const result = await dialog.showSaveDialog({
        title: 'Save recording',
        defaultPath: defaultFileName,
        filters: [
          { name: 'WebM Audio', extensions: ['webm'] },
          { name: 'All Files', extensions: ['*'] },
        ],
      })

      if (result.canceled || !result.filePath) {
        return { canceled: true as const }
      }

      const buffer = Buffer.from(arrayBuffer)
      await fs.writeFile(result.filePath, buffer)

      return {
        canceled: false as const,
        filePath: result.filePath,
      }
    }
  )

  ipcMain.handle(
    'audio:upload',
    async (
      _event,
      args: {
        filePath: string
        uploadUrl: string
      }
    ) => {
      const { filePath, uploadUrl } = args

      const fileBuffer = await fs.readFile(filePath)
      const fileName = path.basename(filePath)

      const formData = new FormData()
      const blob = new Blob([new Uint8Array(fileBuffer)], { type: 'audio/webm' })
      formData.append('file', blob, fileName)

      const response = await fetch(uploadUrl, {
        method: 'POST',
        body: formData,
      })

      const text = await response.text()

      if (!response.ok) {
        throw new Error(`Upload failed: ${response.status} ${text}`)
      }

      return {
        ok: true as const,
        status: response.status,
        body: text,
      }
    }
  )
}

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.on("ready", createWindow);
app.whenReady().then(recordVoiceHandle)
// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
  }
});

app.on("activate", () => {
  // On OS X it's common to re-create a window in the app when the
  // dock icon is clicked and there are no other windows open.
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});

// In this file you can include the rest of your app's specific main process
// code. You can also put them in separate files and import them here.
