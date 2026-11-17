import { forwardRef, useCallback, useRef, useState } from 'react'
import type { DragEvent } from 'react'
import { useInvoiceStore } from '../../store/invoiceStore'
import { getTemplate } from '../../templates/registry'
import { useFreeformBlock } from '../../templates/shared/FreeformBlockContext'
import { LabelsProvider } from '../../templates/shared/LabelsContext'
import { SectionOffsetsProvider, SectionStylesProvider } from '../../templates/shared/SectionOffsetsContext'
import { isFreeformFreeKind } from '../../types/invoice'
import type { FreeformFreeKind } from '../../types/invoice'
import { useUploadsStore } from '../../store/uploadsStore'
import { ELEMENT_DRAG_TYPE, UPLOAD_DRAG_TYPE } from './elementDrag'
import { DrawLayer } from './DrawLayer'
import type { DrawSettings } from './drawSettings'
import { FreeLayer } from './FreeLayer'
import type { LiveDrag } from './FreeLayer'
import { SECTION_LABELS, useElementBox, useSectionDrag } from './useSectionDrag'
import type { SectionBox } from './useSectionDrag'

const PAGE_WIDTH = 794

/**
 * Renders the active template with live store data. This node's ref is what
 * the image/PDF exporters capture — so what's on screen is always exactly
 * what gets downloaded, including everything this adds on top of the design.
 *
 * On top of the template it layers the "canvas" behaviour every design gets:
 *  - dragging any shared section (logo/from/to/items/totals/signature)
 *    anywhere on the page (`useSectionDrag`, via `SectionOffsetsContext`);
 *  - the free-floating Text/Table/Image/Divider elements (`FreeLayer`);
 *  - dropping a card from the elements or uploads drawer at the exact spot you let go;
 *  - draw mode (`DrawLayer`), a sheet over the page that turns drags into shapes.
 * Freeform Canvas does its own positioning for all of this, so it gets none
 * of the section-offset or overlay machinery — only the drop target.
 *
 * The `LineItemsDragProvider`/`CanvasEditProvider`/`FreeformBlockProvider`
 * stack lives one level up in `EditorLayout`, because the drawer and style
 * toolbar are siblings of this preview and need the same context.
 * Design-picker thumbnails never render through here, so none of this
 * reaches them.
 */
interface InvoicePreviewProps {
  /** Draw mode: set while the user is drawing, and the page then takes drags as drawing instead of editing. */
  draw?: DrawSettings | null
}

export const InvoicePreview = forwardRef<HTMLDivElement, InvoicePreviewProps>(function InvoicePreview({ draw }, ref) {
  const invoice = useInvoiceStore((s) => s.invoice)
  const setSectionOffset = useInvoiceStore((s) => s.setSectionOffset)
  const setElementRect = useInvoiceStore((s) => s.setElementRect)
  const block = useFreeformBlock()
  const template = getTemplate(invoice.templateId)
  const TemplateComponent = template.component
  const isFreeform = template.layoutId === 'freeform'

  const wrapperRef = useRef<HTMLDivElement | null>(null)
  const setRefs = useCallback(
    (el: HTMLDivElement | null) => {
      wrapperRef.current = el
      if (typeof ref === 'function') ref(el)
      else if (ref) ref.current = el
    },
    [ref],
  )

  const [liveFree, setLiveFree] = useState<LiveDrag | null>(null)
  const [measuredHeights, setMeasuredHeights] = useState<Record<string, number>>({})

  const sectionDrag = useSectionDrag({
    wrapperRef,
    offsets: invoice.sectionOffsets,
    onCommit: setSectionOffset,
    onSelect: block?.onSelect,
    enabled: !isFreeform && !!block,
  })
  const selectedBox = useElementBox(wrapperRef, !isFreeform && block ? block.selectedId : null, invoice)

  // A free element dragged below the design's own height must still be inside
  // the exported page, so the wrapper grows to fit the lowest one.
  const overlayBottom = isFreeform
    ? 0
    : invoice.freeformLayout.reduce((max, el) => {
        if (!isFreeformFreeKind(el.kind)) return max
        const y = liveFree?.id === el.id ? liveFree.rect.y : el.y
        return Math.max(max, y + (measuredHeights[el.id] ?? 0))
      }, 0)

  function handleDragOver(e: DragEvent<HTMLDivElement>) {
    if (!block || !(e.dataTransfer.types.includes(ELEMENT_DRAG_TYPE) || e.dataTransfer.types.includes(UPLOAD_DRAG_TYPE))) return
    e.preventDefault()
    e.dataTransfer.dropEffect = 'copy'
  }

  function handleDrop(e: DragEvent<HTMLDivElement>) {
    const wrapper = wrapperRef.current
    if (!block || !wrapper) return
    const kind = e.dataTransfer.getData(ELEMENT_DRAG_TYPE)
    const uploadId = e.dataTransfer.getData(UPLOAD_DRAG_TYPE)
    const upload = uploadId ? useUploadsStore.getState().items.find((item) => item.id === uploadId) : undefined
    if (!upload && !isFreeformFreeKind(kind as FreeformFreeKind)) return
    e.preventDefault()
    const rect = wrapper.getBoundingClientRect()
    const scale = rect.width / PAGE_WIDTH
    const at = { x: (e.clientX - rect.left) / scale, y: (e.clientY - rect.top) / scale }
    // An upload lands as an Image element already holding its picture.
    if (upload) block.onAddElement('image', at, { dataUrl: upload.dataUrl })
    else block.onAddElement(kind as FreeformFreeKind, at)
  }

  const hoverBox = sectionDrag.box

  return (
    <div
      ref={setRefs}
      id="invoice-print-surface"
      style={{ position: 'relative', minHeight: overlayBottom || undefined }}
      onMouseDown={(e) => {
        // Click empty page to deselect. A press *inside* a section selects it instead (see
        // `useSectionDrag`), so it must not also deselect here.
        if (!(e.target instanceof Element && e.target.closest('[data-section-id]'))) block?.onSelect(null)
      }}
      onDragOver={handleDragOver}
      onDrop={handleDrop}
      {...sectionDrag.handlers}
    >
      <SectionOffsetsProvider value={isFreeform ? null : sectionDrag.offsets}>
        <SectionStylesProvider value={isFreeform ? null : invoice.sectionStyles}>
          <LabelsProvider value={invoice.labels}>
            <TemplateComponent invoice={invoice} />
          </LabelsProvider>
        </SectionStylesProvider>
      </SectionOffsetsProvider>

      {!isFreeform && (
        <FreeLayer
          elements={invoice.freeformLayout}
          canvasRef={wrapperRef}
          liveDrag={liveFree}
          onLiveDrag={setLiveFree}
          onCommit={(id, rect) => setElementRect(id, rect)}
          onMeasuredHeight={(id, h) => setMeasuredHeights((prev) => (prev[id] === h ? prev : { ...prev, [id]: h }))}
        />
      )}

      {draw && block && <DrawLayer settings={draw} />}

      {selectedBox && selectedBox.id !== hoverBox?.id && <SectionOutline box={selectedBox} />}
      {hoverBox && <SectionOutline box={hoverBox} />}
    </div>
  )
})

/** The blue outline + label around a section — an overlay, `data-export-hide`, so it's never in an export. */
function SectionOutline({ box }: { box: SectionBox }) {
  return (
    <div
      data-export-hide="true"
      style={{
        position: 'absolute',
        left: box.left,
        top: box.top,
        width: box.width,
        height: box.height,
        outline: '1.5px solid var(--brand)',
        outlineOffset: 2,
        borderRadius: 4,
        pointerEvents: 'none',
        zIndex: 20,
      }}
    >
      <span
        style={{
          position: 'absolute',
          top: -22,
          left: -2,
          padding: '2px 6px',
          borderRadius: 4,
          background: 'var(--brand)',
          color: '#fff',
          fontSize: 10,
          fontWeight: 500,
          lineHeight: 1.3,
          whiteSpace: 'nowrap',
        }}
      >
        ⠿ {SECTION_LABELS[box.id] ?? 'Section'}
      </span>
    </div>
  )
}
