import { InlineField } from '../../shared/primitives'
import { useFreeformBlock } from '../../shared/FreeformBlockContext'
import { freeformStyleToCss } from './freeformStyle'
import type { FreeformElement } from '../../../types/invoice'

interface FreeformTableElementProps {
  element: Extract<FreeformElement, { kind: 'table' }>
}

const CELL_STYLE = { border: '1px solid #e2e8f0', padding: '4px 6px' }

/** A free-floating generic table added from the canvas palette — a plain grid of editable cells. */
export function FreeformTableElement({ element }: FreeformTableElementProps) {
  const block = useFreeformBlock()
  const readOnly = !block
  const rows = element.rows

  function setCell(r: number, c: number, value: string) {
    const next = rows.map((row, ri) => (ri === r ? row.map((cell, ci) => (ci === c ? value : cell)) : row))
    block?.onUpdateContent(element.id, { rows: next })
  }

  function addRow() {
    const cols = rows[0]?.length ?? 2
    block?.onUpdateContent(element.id, { rows: [...rows, Array(cols).fill('')] })
  }

  function addColumn() {
    block?.onUpdateContent(element.id, { rows: rows.map((row) => [...row, '']) })
  }

  return (
    <div>
      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13, ...freeformStyleToCss(element.style) }}>
        <tbody>
          {rows.map((row, r) => (
            <tr key={r}>
              {row.map((cell, c) => (
                <td key={c} style={CELL_STYLE}>
                  <InlineField value={cell} onChange={(v) => setCell(r, c, v)} readOnly={readOnly} ariaLabel={`Cell ${r + 1},${c + 1}`} />
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
      {block && (
        <div data-export-hide="true" style={{ marginTop: 4, display: 'flex', gap: 8 }}>
          <button type="button" onClick={addRow} style={{ fontSize: 11, color: '#94a3b8', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}>
            + Row
          </button>
          <button type="button" onClick={addColumn} style={{ fontSize: 11, color: '#94a3b8', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}>
            + Column
          </button>
        </div>
      )}
    </div>
  )
}
