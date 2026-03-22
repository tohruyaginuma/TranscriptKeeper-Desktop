import { useCallback, useRef, useState } from 'react'
import { Status } from '@/types/types'

type CaptureResources = {
  micStream: MediaStream
  screenStream: MediaStream
  audioContext: AudioContext
  nodes: AudioNode[]
}

function cleanupCapture(resources: CaptureResources | null) {
  if (!resources) {
    return
  }

  resources.nodes.forEach((node) => {
    try {
      node.disconnect()
    } catch {
      // no-op
    }
  })

  resources.micStream.getTracks().forEach((track) => track.stop())
  resources.screenStream.getTracks().forEach((track) => track.stop())

  if (resources.audioContext.state !== 'closed') {
    void resources.audioContext.close()
  }
}

function mergeChunks(chunks: Float32Array[]) {
  const totalLength = chunks.reduce((sum, chunk) => sum + chunk.length, 0)
  const merged = new Float32Array(totalLength)

  let offset = 0
  for (const chunk of chunks) {
    merged.set(chunk, offset)
    offset += chunk.length
  }

  return merged
}

function writeAscii(view: DataView, offset: number, value: string) {
  for (let i = 0; i < value.length; i += 1) {
    view.setUint8(offset + i, value.charCodeAt(i))
  }
}

function encodeWav(samples: Float32Array, sampleRate: number) {
  const bytesPerSample = 2
  const blockAlign = bytesPerSample
  const byteRate = sampleRate * blockAlign
  const dataSize = samples.length * bytesPerSample
  const buffer = new ArrayBuffer(44 + dataSize)
  const view = new DataView(buffer)

  writeAscii(view, 0, 'RIFF')
  view.setUint32(4, 36 + dataSize, true)
  writeAscii(view, 8, 'WAVE')
  writeAscii(view, 12, 'fmt ')
  view.setUint32(16, 16, true)
  view.setUint16(20, 1, true)
  view.setUint16(22, 1, true)
  view.setUint32(24, sampleRate, true)
  view.setUint32(28, byteRate, true)
  view.setUint16(32, blockAlign, true)
  view.setUint16(34, 16, true)
  writeAscii(view, 36, 'data')
  view.setUint32(40, dataSize, true)

  let offset = 44
  for (let i = 0; i < samples.length; i += 1) {
    const sample = Math.max(-1, Math.min(1, samples[i]))
    const int16 = sample < 0 ? sample * 0x8000 : sample * 0x7fff
    view.setInt16(offset, int16, true)
    offset += bytesPerSample
  }

  return buffer
}


export function useAudioRecorder() {
  const [status, setStatus] = useState<Status>('idle')
  const [error, setError] = useState<string | null>(null)
  const [savedPath, setSavedPath] = useState<string | null>(null)
  const [uploadResult, setUploadResult] = useState<string | null>(null)

  const captureRef = useRef<CaptureResources | null>(null)
  const recordedChunksRef = useRef<Float32Array[]>([])
  const processorRef = useRef<ScriptProcessorNode | null>(null)
  const sampleRateRef = useRef<number>(44100)

  const start = useCallback(async () => {
    let loopbackEnabled = false

    try {
      setError(null)
      setSavedPath(null)
      setUploadResult(null)
      setStatus('preparing')
  
      // 1) Ask permissions here, inside the button-triggered flow
      const micStream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: false,
          noiseSuppression: false,
          autoGainControl: false,
        },
        video: false,
      })
  
      await window.electronAPI.enableLoopbackAudio()
      loopbackEnabled = true

      const screenStream = await navigator.mediaDevices.getDisplayMedia({
        video: true,
        audio: true,
      })

      await window.electronAPI.disableLoopbackAudio()
      loopbackEnabled = false
  
      screenStream.getVideoTracks().forEach((track) => track.stop())

      const micTrack = micStream.getAudioTracks()[0]
      const systemTrack = screenStream.getAudioTracks()[0]
  
      if (!micTrack) {
        throw new Error('Microphone permission was not granted')
      }
  
      if (!systemTrack) {
        throw new Error('system audio not captured (loopback failed)')
      }
  
      // 2) Mix mic + system audio
      const audioContext = new AudioContext()
      const micSource = audioContext.createMediaStreamSource(new MediaStream([micTrack]))
      const systemSource = audioContext.createMediaStreamSource(new MediaStream([systemTrack]))
      const mixBus = audioContext.createGain()
      const processor = audioContext.createScriptProcessor(4096, 2, 1)
      const silentGain = audioContext.createGain()

      silentGain.gain.value = 0
      recordedChunksRef.current = []
      sampleRateRef.current = audioContext.sampleRate

      processor.onaudioprocess = (event) => {
        const inputBuffer = event.inputBuffer
        const frameCount = inputBuffer.length
        const channelCount = inputBuffer.numberOfChannels
        const monoChunk = new Float32Array(frameCount)

        for (let sampleIndex = 0; sampleIndex < frameCount; sampleIndex += 1) {
          let sum = 0
          for (let channelIndex = 0; channelIndex < channelCount; channelIndex += 1) {
            sum += inputBuffer.getChannelData(channelIndex)[sampleIndex]
          }
          monoChunk[sampleIndex] = sum / channelCount
        }

        recordedChunksRef.current.push(monoChunk)
      }

      micSource.connect(mixBus)
      systemSource.connect(mixBus)
      mixBus.connect(processor)
      processor.connect(silentGain)
      silentGain.connect(audioContext.destination)

      captureRef.current = {
        micStream,
        screenStream,
        audioContext,
        nodes: [micSource, systemSource, mixBus, processor, silentGain],
      }
      processorRef.current = processor

      setStatus('recording')
    } catch (err) {
      if (loopbackEnabled) {
        await window.electronAPI.disableLoopbackAudio().catch(() => {
          // no-op
        })
      }

      cleanupCapture(captureRef.current)
      captureRef.current = null
      processorRef.current = null
      recordedChunksRef.current = []

      setStatus('error')
      setError(err instanceof Error ? err.message : 'Failed to start recording')
    }
  }, [])

  const stopAndSave = useCallback(async (): Promise<string | null | void> => {
    try {
      if (!captureRef.current || !processorRef.current) {
        throw new Error('Recorder is not active')
      }

      setStatus('stopping')
      processorRef.current.onaudioprocess = null

      const mergedSamples = mergeChunks(recordedChunksRef.current)
      if (mergedSamples.length === 0) {
        throw new Error('No audio was recorded')
      }

      const wavArrayBuffer = encodeWav(mergedSamples, sampleRateRef.current)
      const fileName = `recording-${new Date().toISOString().replace(/[:.]/g, '-')}.flac`

      cleanupCapture(captureRef.current)

      captureRef.current = null
      processorRef.current = null
      recordedChunksRef.current = []

      setStatus('saving')
      const saveResult = await window.electronAPI.saveAudioFile(wavArrayBuffer, fileName)

      if (saveResult.canceled) {
        setStatus('idle')
        return null
      }

      if (!('filePath' in saveResult)) {
        throw new Error('Saved file path was not returned')
      }

      const { filePath } = saveResult
      setSavedPath(filePath)
      setStatus('done')
      return filePath
    } catch (err) {
      cleanupCapture(captureRef.current)

      captureRef.current = null
      processorRef.current = null
      recordedChunksRef.current = []

      setStatus('error')
      setError(err instanceof Error ? err.message : 'Failed to stop recording')
      return null
    }
  }, [])

  const uploadSavedFile = useCallback(async (uploadUrl: string, idToken?: string) => {
    try {
      if (!savedPath) {
        throw new Error('No saved file found')
      }

      setStatus('uploading')
      const result = await window.electronAPI.uploadAudioFile(savedPath, uploadUrl, idToken)
      setUploadResult(result.body)
      setStatus('done')
    } catch (err) {
      setStatus('error')
      setError(err instanceof Error ? err.message : 'Upload failed')
    }
  }, [savedPath])

  return {
    status,
    error,
    savedPath,
    uploadResult,
    start,
    stopAndSave,
    uploadSavedFile,
    isRecording: status === 'recording',
  }
}
