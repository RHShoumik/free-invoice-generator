import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import { formatDate } from '../src/lib/date'
import { createSampleInvoice } from '../src/store/invoiceStore'
import { TEMPLATES } from '../src/templates/registry'
import { CanvasEditProvider } from '../src/templates/shared/CanvasEditContext'

/** One design per layout (the first preset): all 20 fixed layouts plus Freeform Canvas. */
const LAYOUTS = TEMPLATES.filter((t, i, all) => all.findIndex((x) => x.layoutId === t.layoutId) === i)

const EDIT = { updateField: () => {} } as never

function render(layout: (typeof LAYOUTS)[number], editable: boolean): HTMLElement {
  const invoice = createSampleInvoice(layout.id)
  invoice.issueDate = '2026-11-15'
  invoice.dueDate = '2026-11-29'
  const Component = layout.component
  const page = <Component invoice={invoice} />
  const root = document.createElement('div')
  root.innerHTML = renderToStaticMarkup(editable ? <CanvasEditProvider value={EDIT}>{page}</CanvasEditProvider> : page)
  return root
}

describe('the issue and due dates on every layout', () => {
  it('covers all 21 layouts', () => {
    expect(LAYOUTS).toHaveLength(21)
  })

  describe.each(LAYOUTS.map((t) => [t.layoutId, t] as const))('%s', (_name, layout) => {
    it('are click-to-pick in the live editor, one each, showing the usual formatted date', () => {
      const dates = [...render(layout, true).querySelectorAll<HTMLElement>('[data-editable-date]')]
      expect(dates.map((d) => d.dataset.editableDate).sort()).toEqual(['dueDate', 'issueDate'])
      for (const el of dates) {
        expect(el.textContent).toBe(formatDate(el.dataset.editableDate === 'issueDate' ? '2026-11-15' : '2026-11-29'))
      }
    })

    it('are plain text outside the editor (a design-picker thumbnail)', () => {
      const root = render(layout, false)
      expect(root.querySelectorAll('[data-editable-date]')).toHaveLength(0)
      expect(root.textContent).toContain('Nov 15, 2026')
      expect(root.textContent).toContain('Nov 29, 2026')
    })
  })
})
