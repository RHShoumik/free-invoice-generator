import { ImagePlus, Trash2 } from 'lucide-react'
import { useRef, useState } from 'react'
import { Button } from '@/components/ui/button'
import { resizeImageFile } from '../../lib/image'

/** The Watermark design's watermark, edited from the style pill because the watermark itself sits behind the page's content. */
export interface WatermarkControl {
  text: string
  /** A data URL when the watermark is an image, else null. */
  image: string | null
  /** Whether the user has changed anything (vs. the automatic business-name initial). */
  overridden: boolean
  onTextChange: (text: string) => void
  onImageChange: (dataUrl: string | null) => void
  /** Text, image and look back to the automatic watermark — one undo step. */
  onReset: () => void
}

/** A bit larger than the text watermark's logical size: it's drawn ~460px wide, and fades, so detail matters less than file size. */
const IMAGE_MAX_DIMENSION = 900

/**
 * What the watermark *is*: a text box, or — once an image is chosen — a
 * thumbnail with Replace and Remove. Removing the image brings the text
 * watermark back, so the two never both need a control at once.
 */
export function WatermarkSource({ watermark }: { watermark: WatermarkControl }) {
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
      watermark.onImageChange(await resizeImageFile(file, IMAGE_MAX_DIMENSION))
    } catch {
      setError('Could not use that image.')
    }
  }

  return (
    <>
      {watermark.image ? (
        <div className="flex shrink-0 items-center gap-1 rounded-lg border border-slate-200 p-0.5 pr-1">
          <span className="flex size-8 items-center justify-center overflow-hidden rounded-md bg-paper">
            <img src={watermark.image} alt="" className="size-full object-contain" />
          </span>
          <span className="px-1 text-sm font-semibold text-ink">Image</span>
          <Button type="button" variant="ghost" size="icon-sm" onClick={() => fileRef.current?.click()} aria-label="Replace image" title="Replace image">
            <ImagePlus />
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            onClick={() => watermark.onImageChange(null)}
            aria-label="Remove image"
            title="Remove the image (use text instead)"
          >
            <Trash2 />
          </Button>
        </div>
      ) : (
        <>
          <input
            type="text"
            value={watermark.text}
            onChange={(e) => watermark.onTextChange(e.target.value)}
            placeholder="Type a watermark"
            aria-label="Watermark text"
            maxLength={40}
            className="h-9 w-40 shrink-0 rounded-lg border border-slate-200 bg-paper px-3 text-sm font-semibold text-ink outline-none transition-colors placeholder:font-normal placeholder:text-slate-400 focus:border-ink/30 focus:bg-white focus-visible:ring-2 focus-visible:ring-ring"
          />
          <Button
            type="button"
            variant="outline"
            size="icon-sm"
            className="shrink-0"
            onClick={() => fileRef.current?.click()}
            aria-label="Use an image as the watermark"
            title="Use an image instead (a logo or stamp)"
          >
            <ImagePlus />
          </Button>
        </>
      )}
      {error && (
        <span role="alert" className="shrink-0 text-xs font-medium text-red-600">
          {error}
        </span>
      )}
      <input
        ref={fileRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => {
          void handleFile(e.target.files?.[0])
          e.target.value = '' // so choosing the same file again still fires
        }}
      />
    </>
  )
}
