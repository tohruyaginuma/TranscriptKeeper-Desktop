import { useCallback, useRef, useState } from 'react'
import { cleanupCapture, createMixedAudioStream, type CaptureResources } from '../lib/audio'
import { createRecorder, type RecorderSession } from '../lib/recorder'
import { saveBlobLocally } from '@/lib/file'
import { Status } from '@/types/types'

export function useAudioRecorder() {
  const [status, setStatus] = useState<Status>('idle')
  const [error, setError] = useState<string | null>(null)
  const [savedPath, setSavedPath] = useState<string | null>(null)
  const [uploadResult, setUploadResult] = useState<string | null>(null)

  const captureRef = useRef<CaptureResources | null>(null)
  const recorderRef = useRef<RecorderSession | null>(null)

  const start = useCallback(async () => {
    try {
      setError(null)
      setSavedPath(null)
      setUploadResult(null)
      setStatus('preparing')
  
      // 1) Ask permissions here, inside the button-triggered flow
      const micStream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
        video: false,
      })
  
      const screenStream = await navigator.mediaDevices.getDisplayMedia({
        video: true,
        audio: true,
      })
  
      const micTrack = micStream.getAudioTracks()[0]
      const systemTrack = screenStream.getAudioTracks()[0]
  
      if (!micTrack) {
        throw new Error('Microphone permission was not granted')
      }
  
      if (!systemTrack) {
        throw new Error('System audio was not included in the screen share')
      }
  
      // 2) Mix mic + system audio
      const audioContext = new AudioContext()
      const destination = audioContext.createMediaStreamDestination()
  
      const micSource = audioContext.createMediaStreamSource(
        new MediaStream([micTrack])
      )
      const systemSource = audioContext.createMediaStreamSource(
        new MediaStream([systemTrack])
      )
  
      const micGain = audioContext.createGain()
      micGain.gain.value = 1.0
  
      const systemGain = audioContext.createGain()
      systemGain.gain.value = 1.0
  
      micSource.connect(micGain).connect(destination)
      systemSource.connect(systemGain).connect(destination)
  
      const capture = {
        mixedStream: destination.stream,
        micStream,
        screenStream,
        audioContext,
      }
  
      captureRef.current = capture
  
      // 3) Start recording
      const recorder = createRecorder(capture.mixedStream)
      recorderRef.current = recorder
  
      setStatus('recording')
    } catch (err) {
      setStatus('error')
      setError(err instanceof Error ? err.message : 'Failed to start recording')
    }
  }, [])

  const stopAndSave = useCallback(async () => {
    try {
      if (!recorderRef.current) {
        throw new Error('Recorder is not active')
      }

      setStatus('stopping')
      const blob = await recorderRef.current.stop()

      setStatus('saving')
      const saveResult = await saveBlobLocally(blob)

      cleanupCapture(captureRef.current ?? {})
      captureRef.current = null
      recorderRef.current = null

      if (saveResult.canceled) {
        setStatus('idle')
        return null
      }

      setSavedPath(saveResult.filePath)
      setStatus('done')
      return saveResult.filePath
    } catch (err) {
      cleanupCapture(captureRef.current ?? {})
      captureRef.current = null
      recorderRef.current = null

      setStatus('error')
      setError(err instanceof Error ? err.message : 'Failed to stop recording')
      return null
    }
  }, [])

  const uploadSavedFile = useCallback(async (uploadUrl: string) => {
    try {
      if (!savedPath) {
        throw new Error('No saved file found')
      }

      setStatus('uploading')
      const result = await window.electronAPI.uploadAudioFile(savedPath, uploadUrl)
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