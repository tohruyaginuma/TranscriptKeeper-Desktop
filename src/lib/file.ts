export async function saveBlobLocally(blob: Blob) {
  const arrayBuffer = await blob.arrayBuffer()
  const fileName = `recording-${new Date()
    .toISOString()
    .replace(/[:.]/g, '-')}.webm`

  return window.electronAPI.saveAudioFile(arrayBuffer, fileName)
}