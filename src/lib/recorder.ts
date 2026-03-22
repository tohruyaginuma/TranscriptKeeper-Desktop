export type RecorderSession = {
  stop: () => Promise<Blob>
  mediaRecorder: MediaRecorder
}

export function createRecorder(stream: MediaStream): RecorderSession {
  const mimeTypeCandidates = [
    'audio/webm;codecs=opus',
    'audio/webm',
  ]

  const mimeType =
    mimeTypeCandidates.find((type) => MediaRecorder.isTypeSupported(type)) ??
    ''

  const chunks: BlobPart[] = []

  const mediaRecorder = new MediaRecorder(
    stream,
    mimeType ? { mimeType } : undefined
  )

  mediaRecorder.ondataavailable = (event: BlobEvent) => {
    if (event.data.size > 0) {
      chunks.push(event.data)
    }
  }

  mediaRecorder.start(1000)

  return {
    mediaRecorder,
    stop: () =>
      new Promise<Blob>((resolve, reject) => {
        mediaRecorder.onerror = () => {
          reject(new Error('Recording failed'))
        }

        mediaRecorder.onstop = () => {
          resolve(
            new Blob(chunks, {
              type: mimeType || 'audio/webm',
            })
          )
        }

        if (mediaRecorder.state !== 'inactive') {
          mediaRecorder.stop()
        } else {
          resolve(
            new Blob(chunks, {
              type: mimeType || 'audio/webm',
            })
          )
        }
      }),
  }
}