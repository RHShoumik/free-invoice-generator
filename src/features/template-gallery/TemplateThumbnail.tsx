import { useMemo } from 'react'
import { ZoomToFit } from '../../components/ui/ZoomToFit'
import { createSampleInvoice } from '../../store/invoiceStore'
import type { TemplateDefinition } from '../../templates/registry'
import { CanvasEditProvider } from '../../templates/shared/CanvasEditContext'
import { FreeformBlockProvider } from '../../templates/shared/FreeformBlockContext'
import { LineItemsDragProvider } from '../../templates/shared/LineItemsDragContext'

const NATURAL_WIDTH = 794

interface TemplateThumbnailProps {
  definition: TemplateDefinition
}

/** A live, scaled-down render of the real template — never drifts from the actual design. */
export function TemplateThumbnail({ definition }: TemplateThumbnailProps) {
  // createSampleInvoice already pulls this template's default accent/font/padding from the registry.
  const invoice = useMemo(() => createSampleInvoice(definition.id), [definition])

  const TemplateComponent = definition.component

  return (
    <div
      className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm transition-all duration-200 group-hover:-translate-y-1 group-hover:border-ink/30 group-hover:shadow-[0_14px_36px_rgb(21_23_26/0.16)]"
      style={{ aspectRatio: '794 / 1123' }}
    >
      <ZoomToFit contentWidth={NATURAL_WIDTH}>
        {/* The editor's Designs dialog is rendered inside the editor's providers (a portal moves the DOM, not the
            React tree), so without this every thumbnail in it would inherit the live editor: typing in one would
            edit the invoice being worked on. `null` is "not in the editor" for all three opt-in contexts. */}
        <CanvasEditProvider value={null}>
          <FreeformBlockProvider value={null}>
            <LineItemsDragProvider value={null}>
              <TemplateComponent invoice={invoice} />
            </LineItemsDragProvider>
          </FreeformBlockProvider>
        </CanvasEditProvider>
      </ZoomToFit>
    </div>
  )
}
