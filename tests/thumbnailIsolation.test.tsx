import { act } from 'react'
import { createRoot } from 'react-dom/client'
import type { Root } from 'react-dom/client'
import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest'
import { TemplateThumbnail } from '../src/features/template-gallery/TemplateThumbnail'
import { TEMPLATES } from '../src/templates/registry'
import { CanvasEditProvider } from '../src/templates/shared/CanvasEditContext'
import { FreeformBlockProvider } from '../src/templates/shared/FreeformBlockContext'
import { LineItemsDragProvider } from '../src/templates/shared/LineItemsDragContext'

beforeAll(() => {
  ;(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true
  ;(globalThis as { ResizeObserver?: unknown }).ResizeObserver = class {
    observe() {}
    unobserve() {}
    disconnect() {}
  }
})

let host: HTMLDivElement
let root: Root
beforeEach(() => {
  host = document.createElement('div')
  document.body.appendChild(host)
  root = createRoot(host)
})
afterEach(() => {
  act(() => root.unmount())
  host.remove()
})

/**
 * The editor's Designs dialog is rendered *inside* the editor's providers (a portal moves the DOM, not the React
 * tree), so a thumbnail placed in it inherits the live editor's contexts unless it resets them. Without that, every
 * thumbnail would be a live editor: typing in one would edit the invoice being worked on.
 */
describe('a design thumbnail rendered inside the live editor\'s providers (the Designs dialog)', () => {
  const layouts = TEMPLATES.filter((t, i, all) => all.findIndex((x) => x.layoutId === t.layoutId) === i)

  it.each(layouts.map((t) => [t.layoutId, t] as const))('%s is plain: nothing to click and nothing to type into', (_name, definition) => {
    const updateField = vi.fn()
    const editText = vi.fn()
    act(() =>
      root.render(
        <CanvasEditProvider value={{ updateField, updateFrom: vi.fn(), updateTo: vi.fn(), updateItem: vi.fn(), editText } as never}>
          <FreeformBlockProvider value={{ onSelect: vi.fn(), selectedId: null } as never}>
            <LineItemsDragProvider value={{ onReorder: vi.fn() } as never}>
              <TemplateThumbnail definition={definition} />
            </LineItemsDragProvider>
          </FreeformBlockProvider>
        </CanvasEditProvider>,
      ),
    )
    expect(host.querySelectorAll('[data-item]')).toHaveLength(0)
    expect(host.querySelectorAll('[data-editable-date]')).toHaveLength(0)
    expect([...host.querySelectorAll('input, textarea')].filter((el) => !(el as HTMLInputElement).readOnly)).toHaveLength(0)
    expect(host.querySelectorAll('[role="button"]')).toHaveLength(0)
  })
})
