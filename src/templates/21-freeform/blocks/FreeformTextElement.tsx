import { plainTextToHtml } from '../../../lib/richText'
import { useFreeformBlock } from '../../shared/FreeformBlockContext'
import { freeformStyleToCss } from './freeformStyle'
import { RichTextField } from './RichTextField'
import type { FreeformElement } from '../../../types/invoice'

interface FreeformTextElementProps {
  element: Extract<FreeformElement, { kind: 'text' }>
}

/**
 * A free-floating text element added from the drawer — no `Invoice` field
 * backs it. Rich: the style toolbar colors/bolds/italicizes the words you've
 * selected, or the whole box when nothing is selected. `element.style` is the
 * whole-box baseline; per-word formatting lives in `element.html` and wins
 * over it. A box from before rich text existed has no `html`, and shows its
 * plain `text`.
 */
export function FreeformTextElement({ element }: FreeformTextElementProps) {
  const block = useFreeformBlock()

  return (
    <RichTextField
      html={element.html ?? plainTextToHtml(element.text)}
      onChange={(html, text) => block?.onUpdateContent(element.id, { html, text })}
      elementId={element.id}
      placeholder="Text"
      className="text-sm text-slate-700"
      style={freeformStyleToCss(element.style)}
      readOnly={!block}
      ariaLabel="Text"
    />
  )
}
