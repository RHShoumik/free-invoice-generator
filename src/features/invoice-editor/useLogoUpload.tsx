import { useRef, useState } from 'react'
import type { ReactElement } from 'react'
import { resizeImageFile } from '../../lib/image'

/**
 * The "choose an image file" flow shared by the style bar and the Business
 * drawer: `pick()` opens the file dialog, a non-image or unreadable file sets
 * `error`, and a good one is resized (`resizeImageFile`) and handed to
 * `onImageChange`. Render `fileInput` once, anywhere in the component.
 */
export function useLogoUpload(
  onImageChange: (dataUrl: string) => void,
  /** Longest side the stored image may have; a logo's default (480) is small for a picture that fills a page region. */
  maxDimension?: number,
): {
  pick: () => void
  error: string | null
  fileInput: ReactElement
} {
  const fileRef = useRef<HTMLInputElement>(null)
  const [error, setError] = useState<string | null>(null)

  async function handleFile(file: File | undefined) {
    if (!file) return
    if (!file.type.startsWith('image/')) {
      setError('Choose an image file.')
      return
    }
    setError(null)
    try {
      onImageChange(await resizeImageFile(file, maxDimension))
    } catch {
      setError('Could not use that image.')
    }
  }

  const fileInput = (
    <input
      ref={fileRef}
      type="file"
      accept="image/*"
      className="hidden"
      onChange={(e) => {
        void handleFile(e.target.files?.[0])
        e.target.value = ''
      }}
    />
  )
  return { pick: () => fileRef.current?.click(), error, fileInput }
}
