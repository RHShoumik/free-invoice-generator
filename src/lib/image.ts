/**
 * Downscales an uploaded logo client-side before it's stored (base64, in
 * localStorage via the Zustand persist middleware). Without this, a phone
 * photo dropped in as a "logo" could be several MB and blow past
 * localStorage's ~5-10MB quota, or slow down every export.
 */
export function resizeImageFile(file: File, maxDimension = 480): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onerror = () => reject(new Error('Could not read the selected file.'))
    reader.onload = () => {
      const img = new Image()
      img.onerror = () => reject(new Error('Could not decode the selected image.'))
      img.onload = () => {
        const scale = Math.min(1, maxDimension / Math.max(img.width, img.height))
        const width = Math.round(img.width * scale)
        const height = Math.round(img.height * scale)

        const canvas = document.createElement('canvas')
        canvas.width = width
        canvas.height = height
        const ctx = canvas.getContext('2d')
        if (!ctx) {
          reject(new Error('Canvas is not supported in this browser.'))
          return
        }
        ctx.drawImage(img, 0, 0, width, height)

        const isPng = file.type === 'image/png' || file.type === 'image/svg+xml'
        resolve(canvas.toDataURL(isPng ? 'image/png' : 'image/jpeg', 0.9))
      }
      img.src = reader.result as string
    }
    reader.readAsDataURL(file)
  })
}
