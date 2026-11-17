import { useRef, useState } from 'react'
import type { ReactNode } from 'react'
import type { InvoiceTemplateProps } from '../shared/InvoiceTemplateProps'
import { InvoicePage, Logo, LineItemsTable, PartyBlock, Signature, Totals } from '../shared/primitives'
import { useFreeformBlock } from '../shared/FreeformBlockContext'
import { FreeformBlockWrapper } from './blocks/FreeformBlockWrapper'
import { FreeformMetaBlock } from './blocks/FreeformMetaBlock'
import { FreeformFooterBlock } from './blocks/FreeformFooterBlock'
import { FreeformFreeElement } from './blocks/FreeformFreeElement'
import { isFreeformFreeKind } from '../../types/invoice'
import type { FreeformElement, FreeformElementRect } from '../../types/invoice'

const CANVAS_MIN_HEIGHT = 1123

function renderElementContent(el: FreeformElement, invoice: InvoiceTemplateProps['invoice'], accent: string): ReactNode {
  switch (el.kind) {
    case 'logo':
      return <Logo logoDataUrl={invoice.logoDataUrl} businessName={invoice.from.name} accentColor={accent} size={64} shape={el.style?.shape} fit={el.style?.fit} imagePosition={el.style?.imagePosition} />
    case 'meta':
      return <FreeformMetaBlock invoice={invoice} accent={accent} />
    case 'from':
      return <PartyBlock label="From" party={invoice.from} which="from" nameClassName="mt-1 text-sm font-semibold text-slate-900" lineClassName="mt-1 text-sm text-slate-500" labelClassName="text-xs font-semibold uppercase tracking-wider text-slate-400" />
    case 'to':
      return <PartyBlock label="Bill To" party={invoice.to} which="to" nameClassName="mt-1 text-sm font-semibold text-slate-900" lineClassName="mt-1 text-sm text-slate-500" labelClassName="text-xs font-semibold uppercase tracking-wider text-slate-400" />
    case 'items':
      return (
        <LineItemsTable
          items={invoice.items}
          currency={invoice.currency}
          columns={invoice.lineItemColumns}
          customColumns={invoice.customColumns}
          headCellClassName="py-2 text-xs font-semibold uppercase tracking-wider text-slate-500 border-b-2 border-slate-800"
          cellClassName="py-2 text-sm text-slate-700 border-b border-slate-100"
        />
      )
    case 'totals':
      return (
        <Totals
          invoice={invoice}
          rowClassName="flex justify-between py-1 text-sm text-slate-600"
          totalRowClassName="mt-2 flex justify-between border-t-2 pt-2 text-base font-bold text-slate-900"
          totalRowStyle={{ borderColor: accent }}
        />
      )
    case 'footer':
      return <FreeformFooterBlock invoice={invoice} />
    case 'signature':
      return (
        <Signature
          invoice={invoice}
          className="grid grid-cols-2 gap-10"
          lineClassName="h-px w-full bg-slate-300"
          nameClassName="mt-3 text-sm font-semibold text-slate-900"
          labelClassName="text-xs text-slate-400"
          dateClassName="mt-2 text-xs text-slate-400"
        />
      )
    case 'text':
    case 'table':
    case 'image':
    case 'divider':
    case 'drawing':
      return <FreeformFreeElement element={el} />
  }
}

/**
 * The Freeform Canvas layout: every element is an independently draggable,
 * width-resizable, deletable/duplicable block, editable in place. New
 * elements (Text/Table/Image/Divider) are added from `ElementsDrawer`
 * (`EditorLayout`'s left panel, available on every layout) rather than from
 * anything rendered here. See docs/ARCHITECTURE.md "Freeform Canvas" for the full
 * design — in short, this is the one layout
 * that deliberately breaks the "pure function of `invoice`, no local state"
 * rule every other template follows (drag/selection state has to live
 * somewhere), and it's safe to do so specifically *because* none of that
 * position/selection state leaks into the shared primitives: `Logo`,
 * `PartyBlock`, `LineItemsTable`, `Totals`, `Signature` are the exact same
 * components every other layout uses, wrapped here only for positioning.
 */
export function FreeformTemplate({ invoice }: InvoiceTemplateProps) {
  const block = useFreeformBlock()
  const accent = invoice.theme.accentColor
  const canvasRef = useRef<HTMLDivElement>(null)
  const [liveDrag, setLiveDrag] = useState<{ id: string; rect: FreeformElementRect } | null>(null)
  const [measuredHeights, setMeasuredHeights] = useState<Record<string, number>>({})

  const canvasHeight = Math.max(
    CANVAS_MIN_HEIGHT,
    ...invoice.freeformLayout.map((el) => {
      const rect = liveDrag?.id === el.id ? liveDrag.rect : el
      return rect.y + (measuredHeights[el.id] ?? 0)
    }),
  )

  return (
    <InvoicePage font={invoice.theme.font}>
      <div
        ref={canvasRef}
        style={{ position: 'relative', width: 794, height: canvasHeight }}
        onMouseDown={() => block?.onSelect(null)}
      >
        {invoice.freeformLayout.map((el) => {
          const rect = liveDrag?.id === el.id ? liveDrag.rect : el
          return (
            <FreeformBlockWrapper
              key={el.id}
              id={el.id}
              rect={rect}
              canvasRef={canvasRef}
              onLiveChange={(r) => setLiveDrag({ id: el.id, rect: r })}
              onCommitChange={(r) => {
                block?.onMoveOrResize(el.id, r)
                setLiveDrag(null)
              }}
              boundStyle={isFreeformFreeKind(el.kind) ? undefined : el.style}
              passThrough={el.kind === 'drawing'}
              onMeasuredHeight={(h) =>
                setMeasuredHeights((prev) => (prev[el.id] === h ? prev : { ...prev, [el.id]: h }))
              }
            >
              {renderElementContent(el, invoice, accent)}
            </FreeformBlockWrapper>
          )
        })}
      </div>
    </InvoicePage>
  )
}
