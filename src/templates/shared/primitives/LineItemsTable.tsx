import { DndContext, PointerSensor, closestCenter, useSensor, useSensors } from '@dnd-kit/core'
import type { DragEndEvent } from '@dnd-kit/core'
import { SortableContext, useSortable, verticalListSortingStrategy } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import type { CSSProperties, ReactNode } from 'react'
import { lineItemAmount } from '../../../lib/calculations'
import { formatCurrency } from '../../../lib/currency'
import { useCanvasEdit } from '../CanvasEditContext'
import { useLineItemsDrag } from '../LineItemsDragContext'
import { useMovableSection } from '../SectionOffsetsContext'
import { InlineField } from './InlineField'
import type { CustomColumn, LineItem, LineItemColumns } from '../../../types/invoice'

interface LineItemsTableProps {
  items: LineItem[]
  currency: string
  columns: LineItemColumns
  customColumns: CustomColumn[]
  className?: string
  headClassName?: string
  headCellClassName?: string
  rowClassName?: string
  cellClassName?: string
  numericCellClassName?: string
  /** For dynamic (user-chosen) accent colors, which can't be expressed as static Tailwind classes. */
  headStyle?: CSSProperties
  headCellStyle?: CSSProperties
}

interface RowProps {
  item: LineItem
  currency: string
  columns: LineItemColumns
  customColumns: CustomColumn[]
  rowClassName?: string
  cellClassName?: string
  numericCellClassName?: string
  dragHandle?: ReactNode
  readOnly: boolean
  onUpdateItem: (patch: Partial<Omit<LineItem, 'id'>>) => void
  onSetCustomValue: (columnId: string, value: string) => void
  onRemove: (() => void) | null
}

/** Cell markup shared by the draggable and static row variants. */
function RowCells({
  item,
  currency,
  columns,
  customColumns,
  cellClassName,
  numericCellClassName,
  dragHandle,
  readOnly,
  onUpdateItem,
  onSetCustomValue,
  onRemove,
}: RowProps) {
  return (
    <>
      <td className={cellClassName}>
        {dragHandle}
        <InlineField
          value={item.description}
          onChange={(v) => onUpdateItem({ description: v })}
          placeholder="Untitled item"
          readOnly={readOnly}
          ariaLabel="Description"
        />
      </td>
      {columns.quantity.visible && (
        <td className={numericCellClassName ?? cellClassName} style={{ textAlign: 'right' }}>
          <InlineField
            type="number"
            value={String(item.quantity)}
            onChange={(v) => onUpdateItem({ quantity: Number(v) || 0 })}
            readOnly={readOnly}
            style={{ textAlign: 'right' }}
            ariaLabel="Quantity"
          />
        </td>
      )}
      {columns.rate.visible && (
        <td className={numericCellClassName ?? cellClassName} style={{ textAlign: 'right' }}>
          <InlineField
            type="number"
            value={String(item.unitPrice)}
            onChange={(v) => onUpdateItem({ unitPrice: Number(v) || 0 })}
            readOnly={readOnly}
            style={{ textAlign: 'right' }}
            ariaLabel="Unit price"
          />
        </td>
      )}
      <td className={numericCellClassName ?? cellClassName} style={{ textAlign: 'right' }}>
        {formatCurrency(lineItemAmount(item), currency)}
      </td>
      {customColumns.map((col) => (
        <td key={col.id} className={cellClassName} style={{ paddingLeft: '0.75rem' }}>
          <InlineField
            value={item.customValues[col.id] ?? ''}
            onChange={(v) => onSetCustomValue(col.id, v)}
            readOnly={readOnly}
            ariaLabel={col.label || 'Custom column'}
          />
        </td>
      ))}
      {onRemove && (
        <td data-export-hide="true" style={{ width: 20, textAlign: 'center' }}>
          <button
            type="button"
            onClick={onRemove}
            aria-label="Remove item"
            style={{
              border: 'none',
              background: 'transparent',
              color: '#94a3b8',
              cursor: 'pointer',
              fontSize: 13,
              lineHeight: 1,
              padding: 0,
            }}
          >
            ✕
          </button>
        </td>
      )}
    </>
  )
}

function StaticRow(props: RowProps) {
  return (
    <tr className={props.rowClassName}>
      <RowCells {...props} />
    </tr>
  )
}

function DraggableRow(props: RowProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: props.item.id,
  })

  const style: CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.6 : 1,
  }

  const dragHandle = (
    <span
      {...attributes}
      {...listeners}
      data-export-hide="true"
      data-no-section-drag="true"
      className="mr-1.5 inline-block cursor-grab touch-none select-none align-middle text-slate-300 hover:text-slate-500 active:cursor-grabbing"
      aria-label="Drag to reorder"
    >
      ⠿
    </span>
  )

  return (
    <tr ref={setNodeRef} style={style} className={props.rowClassName}>
      <RowCells {...props} dragHandle={dragHandle} />
    </tr>
  )
}

/**
 * Shared line-items table used by every one of the 21 layouts. Templates
 * control the *look* entirely via className/style props — this only owns
 * the row-mapping, column customization, and currency-formatting logic so
 * it can't drift between designs. Description and amount always render (an
 * invoice needs at least an item name and its price); quantity/rate are
 * individually hideable via `columns`.
 *
 * Two independent opt-in contexts, both gated on null the same way (see
 * `CanvasEditContext.ts`/`LineItemsDragContext.ts` for why — this also
 * renders inside up to 105 throwaway sample-data thumbnails, which must
 * stay inert): `useCanvasEdit()` turns every cell and column header into a
 * click-to-edit field and adds the "+ Add line item" row / per-row "✕";
 * `useLineItemsDrag()` turns rows into drag-to-reorder handles. They're
 * orthogonal — either, both, or neither can be active at once.
 */
export function LineItemsTable({
  items,
  currency,
  columns,
  customColumns,
  className,
  headClassName,
  headCellClassName,
  rowClassName,
  cellClassName,
  numericCellClassName,
  headStyle,
  headCellStyle,
}: LineItemsTableProps) {
  const edit = useCanvasEdit()
  const drag = useLineItemsDrag()
  const movable = useMovableSection('items')
  const readOnly = !edit
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 4 } }))

  function handleDragEnd(event: DragEndEvent) {
    if (!drag) return
    const { active, over } = event
    if (!over || active.id === over.id) return
    const fromIndex = items.findIndex((i) => i.id === active.id)
    const toIndex = items.findIndex((i) => i.id === over.id)
    if (fromIndex === -1 || toIndex === -1) return
    drag.onReorder(fromIndex, toIndex)
  }

  const columnCount =
    1 + // description
    (columns.quantity.visible ? 1 : 0) +
    (columns.rate.visible ? 1 : 0) +
    1 + // amount
    customColumns.length +
    (edit ? 1 : 0) // remove-item column

  const rowProps = (item: LineItem): Omit<RowProps, 'dragHandle'> => ({
    item,
    currency,
    columns,
    customColumns,
    rowClassName,
    cellClassName,
    numericCellClassName,
    readOnly,
    onUpdateItem: (patch) => edit?.updateItem(item.id, patch),
    onSetCustomValue: (columnId, value) => edit?.setItemCustomValue(item.id, columnId, value),
    onRemove: edit && items.length > 1 ? () => edit.removeItem(item.id) : null,
  })

  const table = (
    <table className={className} style={{ width: '100%', borderCollapse: 'collapse', ...movable.style }} {...movable.attrs}>
      <thead className={headClassName} style={headStyle}>
        <tr>
          <th className={headCellClassName} style={{ textAlign: 'left', ...headCellStyle }}>
            <InlineField
              value={columns.description.label}
              onChange={(v) => edit?.setColumnLabel('description', v)}
              readOnly={readOnly}
              placeholder="Description"
            />
          </th>
          {columns.quantity.visible && (
            <th className={headCellClassName} style={{ textAlign: 'right', ...headCellStyle }}>
              <InlineField
                value={columns.quantity.label}
                onChange={(v) => edit?.setColumnLabel('quantity', v)}
                readOnly={readOnly}
                placeholder="Qty"
              />
            </th>
          )}
          {columns.rate.visible && (
            <th className={headCellClassName} style={{ textAlign: 'right', ...headCellStyle }}>
              <InlineField
                value={columns.rate.label}
                onChange={(v) => edit?.setColumnLabel('rate', v)}
                readOnly={readOnly}
                placeholder="Rate"
              />
            </th>
          )}
          <th className={headCellClassName} style={{ textAlign: 'right', ...headCellStyle }}>
            <InlineField
              value={columns.amount.label}
              onChange={(v) => edit?.setColumnLabel('amount', v)}
              readOnly={readOnly}
              placeholder="Amount"
            />
          </th>
          {customColumns.map((col) => (
            <th
              key={col.id}
              className={headCellClassName}
              style={{ textAlign: 'left', paddingLeft: '0.75rem', ...headCellStyle }}
            >
              <InlineField
                value={col.label}
                onChange={(v) => edit?.setCustomColumnLabel(col.id, v)}
                readOnly={readOnly}
                placeholder="Column"
              />
            </th>
          ))}
          {edit && <th data-export-hide="true" style={{ width: 20 }} />}
        </tr>
      </thead>
      <tbody>
        {drag ? (
          <SortableContext items={items.map((i) => i.id)} strategy={verticalListSortingStrategy}>
            {items.map((item) => (
              <DraggableRow key={item.id} {...rowProps(item)} />
            ))}
          </SortableContext>
        ) : (
          items.map((item) => <StaticRow key={item.id} {...rowProps(item)} />)
        )}
        {edit && (
          <tr data-export-hide="true">
            <td colSpan={columnCount} style={{ paddingTop: 6 }}>
              <button
                type="button"
                onClick={() => edit.addItem()}
                style={{
                  border: 'none',
                  background: 'transparent',
                  color: '#94a3b8',
                  cursor: 'pointer',
                  fontSize: 12,
                  padding: 0,
                }}
              >
                + Add line item
              </button>
            </td>
          </tr>
        )}
      </tbody>
    </table>
  )

  if (!drag) return table

  return (
    <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
      {table}
    </DndContext>
  )
}
