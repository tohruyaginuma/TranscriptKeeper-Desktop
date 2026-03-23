import { app, BrowserWindow, ipcMain, dialog, shell, systemPreferences } from "electron";
import { createServer, type Server } from "node:http";
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
let rendererServer: Server | null = null

const RENDERER_MIME_TYPES: Record<string, string> = {
  '.css': 'text/css; charset=utf-8',
  '.html': 'text/html; charset=utf-8',
  '.ico': 'image/x-icon',
  '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8',
  '.png': 'image/png',
  '.svg': 'image/svg+xml',
  '.txt': 'text/plain; charset=utf-8',
  '.wasm': 'application/wasm',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
}

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

function buildApiUrl(apiRoot: string, pathname: string) {
  const normalizedRoot = apiRoot.replace(/\/+$/, '')
  const normalizedPath = pathname.startsWith('/') ? pathname : `/${pathname}`
  return `${normalizedRoot}${normalizedPath}`
}

async function requestMicrophoneAccessOnLaunch() {
  if (process.platform !== 'darwin') {
    return
  }

  const currentStatus = systemPreferences.getMediaAccessStatus('microphone')

  if (currentStatus !== 'not-determined') {
    return
  }

  await systemPreferences.askForMediaAccess('microphone')
}


// Handle creating/removing shortcuts on Windows when installing/uninstalling.
if (started) {
  app.quit();
}

function getRendererDistPath() {
  return path.join(__dirname, `../renderer/${MAIN_WINDOW_VITE_NAME}`)
}

async function startPackagedRendererServer() {
  if (rendererServer) {
    const address = rendererServer.address()

    if (address && typeof address !== 'string') {
      return `http://localhost:${address.port}`
    }
  }

  const rendererRoot = getRendererDistPath()

  rendererServer = createServer(async (request, response) => {
    const requestUrl = new URL(request.url ?? '/', 'http://localhost')
    const requestedPath = decodeURIComponent(requestUrl.pathname)
    const safePath = requestedPath === '/' ? '/index.html' : requestedPath
    const resolvedPath = path.resolve(
      rendererRoot,
      `.${safePath}`
    )
    const normalizedRoot = path.resolve(rendererRoot)
    const isInsideRendererRoot =
      resolvedPath === normalizedRoot || resolvedPath.startsWith(`${normalizedRoot}${path.sep}`)

    if (!isInsideRendererRoot) {
      response.writeHead(403)
      response.end('Forbidden')
      return
    }

    let filePath = resolvedPath

    try {
      const stats = await fs.stat(filePath)
      if (stats.isDirectory()) {
        filePath = path.join(filePath, 'index.html')
      }
    } catch {
      filePath = path.join(rendererRoot, 'index.html')
    }

    try {
      const fileContents = await fs.readFile(filePath)
      const extension = path.extname(filePath).toLowerCase()

      response.writeHead(200, {
        'Content-Type':
          RENDERER_MIME_TYPES[extension] ?? 'application/octet-stream',
        'Cache-Control': 'no-store',
      })
      response.end(fileContents)
    } catch {
      response.writeHead(404)
      response.end('Not found')
    }
  })

  return await new Promise<string>((resolve, reject) => {
    rendererServer?.once('error', reject)
    rendererServer?.listen(0, '127.0.0.1', () => {
      const address = rendererServer?.address()
      if (!address || typeof address === 'string') {
        reject(new Error('Failed to determine renderer server address'))
        return
      }

      resolve(`http://localhost:${address.port}`)
    })
  })
}

const createWindow = async () => {
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
    await mainWindow.loadURL(MAIN_WINDOW_VITE_DEV_SERVER_URL);
  } else {
    const packagedRendererUrl = await startPackagedRendererServer()
    await mainWindow.loadURL(packagedRendererUrl)
  }

  if (MAIN_WINDOW_VITE_DEV_SERVER_URL) {
    mainWindow.webContents.openDevTools()
  }
};

const recordVoiceHandle = () => {
  ipcMain.handle('permissions:get-microphone-status', () => {
    if (process.platform !== 'darwin') {
      return 'granted'
    }

    return systemPreferences.getMediaAccessStatus('microphone')
  })

  ipcMain.handle('permissions:request-microphone-access', async () => {
    if (process.platform !== 'darwin') {
      return true
    }

    const currentStatus = systemPreferences.getMediaAccessStatus('microphone')

    if (currentStatus === 'granted') {
      return true
    }

    if (currentStatus === 'denied' || currentStatus === 'restricted') {
      return false
    }

    return systemPreferences.askForMediaAccess('microphone')
  })

  ipcMain.handle(
    'api:post-json',
    async (
      _event,
      args: {
        apiRoot: string
        pathname: string
        idToken: string
        body?: Record<string, unknown>
      }
    ) => {
      const { apiRoot, pathname, idToken, body } = args
      const response = await fetch(buildApiUrl(apiRoot, pathname), {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${idToken}`,
          'Content-Type': 'application/json',
        },
        body: body ? JSON.stringify(body) : undefined,
      })

      const text = await response.text()

      if (!response.ok) {
        throw new Error(`API request failed: ${response.status} ${text}`)
      }

      return text
    }
  )

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
  void createWindow().then(() => {
    void requestMicrophoneAccessOnLaunch()
  })

  app.on("activate", () => {
    // On OS X it's common to re-create a window in the app when the
    // dock icon is clicked and there are no other windows open.
    if (BrowserWindow.getAllWindows().length === 0) {
      void createWindow().then(() => {
        void requestMicrophoneAccessOnLaunch()
      });
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

app.on('before-quit', () => {
  rendererServer?.close()
  rendererServer = null
})

// In this file you can include the rest of your app's specific main process
// code. You can also put them in separate files and import them here.
