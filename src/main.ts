import { app, BrowserWindow, ipcMain, dialog, shell } from "electron";
import path from "node:path";
import started from "electron-squirrel-startup";
import fs from "fs/promises";
import { initMain } from 'electron-audio-loopback'
import os from "node:os";
import { execFile } from "node:child_process";
import { promisify } from "node:util";

if (process.platform === 'darwin') {
  // Electron 40 on macOS 15 can return a silent desktop audio stream when the
  // newer CoreAudio Tap path is selected, so prefer the older permission flow.
  app.commandLine.appendSwitch(
    'disable-features',
    'MacCatapLoopbackAudioForScreenShare'
  )
}

initMain()
const execFileAsync = promisify(execFile)

function shouldAllowInternalPopup(url: string) {
  if (url === 'about:blank') {
    return true
  }

  try {
    const parsedUrl = new URL(url)
    const hostname = parsedUrl.hostname.toLowerCase()

    if (parsedUrl.pathname.startsWith('/__/auth/')) {
      return true
    }

    return (
      hostname === 'accounts.google.com' ||
      hostname === 'apis.google.com' ||
      hostname.endsWith('.firebaseapp.com') ||
      hostname.endsWith('.web.app')
    )
  } catch {
    return false
  }
}


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
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false,
    },
  });

  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    if (shouldAllowInternalPopup(url)) {
      return {
        action: 'allow',
        overrideBrowserWindowOptions: {
          width: 520,
          height: 640,
          autoHideMenuBar: true,
          webPreferences: {
            nodeIntegration: false,
            contextIsolation: true,
            sandbox: true,
          },
        },
      }
    }

    void shell.openExternal(url)
    return { action: 'deny' }
  })

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
  ipcMain.handle(
    'audio:save',
    async (_event, args: { arrayBuffer: ArrayBuffer; defaultFileName: string }) => {
      const { arrayBuffer, defaultFileName } = args

      // const result = await dialog.showSaveDialog({
      //   title: 'Save recording',
      //   defaultPath: defaultFileName,
      //   filters: [
      //     { name: 'WebM Audio', extensions: ['webm'] },
      //     { name: 'All Files', extensions: ['*'] },
      //   ],
      // })

      // if (result.canceled || !result.filePath) {
      //   return { canceled: true as const }
      // }

      const tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'tk-audio-'))
      const wavPath = path.join(tempDir, 'recording.wav')
      const flacPath = path.join(tempDir, 'recording.flac')

      // const buffer = Buffer.from(arrayBuffer)
      // await fs.writeFile(result.filePath, buffer)

      try {
        const wavBuffer = Buffer.from(arrayBuffer)
        await fs.writeFile(wavPath, wavBuffer)
        await fs.writeFile(flacPath, wavBuffer)

        await execFileAsync('afconvert', [
          wavPath,
          '-f',
          'flac',
          '-d',
          'flac',
          '-o',
          flacPath,
        ])

        const result = await dialog.showSaveDialog({
          title: 'Save recording',
          defaultPath: defaultFileName,
          filters: [
            { name: 'FLAC Audio', extensions: ['flac'] },
            { name: 'All Files', extensions: ['*'] },
          ],
        })

        if (result.canceled || !result.filePath) {
          return { canceled: true as const }
        }

        const flacBuffer = await fs.readFile(flacPath)
        await fs.writeFile(result.filePath, flacBuffer)

        return {
          canceled: false as const,
          filePath: result.filePath,
        }
      } finally {
        await fs.rm(tempDir, { recursive: true, force: true })
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
        idToken?: string
      }
    ) => {
      const { filePath, uploadUrl, idToken } = args

      const fileBuffer = await fs.readFile(filePath)
      const fileName = path.basename(filePath)

      const formData = new FormData()
      const mimeType = fileName.toLowerCase().endsWith('.flac') ? 'audio/flac' : 'application/octet-stream'
      const blob = new Blob([new Uint8Array(fileBuffer)], { type: mimeType })
      formData.append('file', blob, fileName)

      const headers = new Headers()
      if (idToken) {
        headers.set('Authorization', `Bearer ${idToken}`)
      }

      const response = await fetch(uploadUrl, {
        method: 'POST',
        headers,
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

  ipcMain.handle(
    'transcript:create',
    async (
      _event,
      args: {
        filePath: string
        requestUrl: string
        language: string
        idToken?: string
      }
    ) => {
      const { filePath, requestUrl, language, idToken } = args

      const fileBuffer = await fs.readFile(filePath)
      const fileName = path.basename(filePath)

      const formData = new FormData()
      const blob = new Blob([new Uint8Array(fileBuffer)], { type: 'audio/flac' })
      formData.append('language', language)
      formData.append('audio', blob, fileName)

      const headers = new Headers()
      if (idToken) {
        headers.set('Authorization', `Bearer ${idToken}`)
      }

      const response = await fetch(requestUrl, {
        method: 'POST',
        headers,
        body: formData,
      })

      const text = await response.text()

      if (!response.ok) {
        throw new Error(`Transcript upload failed: ${response.status} ${text}`)
      }

      return JSON.parse(text) as { transcript_id: string }
    }
  )
}

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.

app.whenReady().then(() => {
  recordVoiceHandle()
  createWindow()

  app.on("activate", () => {
    // On OS X it's common to re-create a window in the app when the
    // dock icon is clicked and there are no other windows open.
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
})
// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
  }
});

// In this file you can include the rest of your app's specific main process
// code. You can also put them in separate files and import them here.
