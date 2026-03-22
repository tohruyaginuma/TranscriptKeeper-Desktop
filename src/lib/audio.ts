export type CaptureResources = {
  mixedStream: MediaStream
  micStream: MediaStream
  screenStream: MediaStream
  audioContext: AudioContext
}

export async function createMixedAudioStream(): Promise<CaptureResources> {
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
    throw new Error('Microphone track not found')
  }

  if (!systemTrack) {
    throw new Error(
      'System audio track was not included. Re-share the screen and make sure audio is enabled.'
    )
  }

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

  return {
    mixedStream: destination.stream,
    micStream,
    screenStream,
    audioContext,
  }
}

export function cleanupCapture(resources: Partial<CaptureResources>) {
  resources.mixedStream?.getTracks().forEach((t) => t.stop())
  resources.micStream?.getTracks().forEach((t) => t.stop())
  resources.screenStream?.getTracks().forEach((t) => t.stop())

  if (resources.audioContext && resources.audioContext.state !== 'closed') {
    void resources.audioContext.close()
  }
}