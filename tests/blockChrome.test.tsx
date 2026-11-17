import { act } from 'react'
import { createRoot } from 'react-dom/client'
import type { Root } from 'react-dom/client'
import { afterEach, beforeAll, describe, expect, it, vi } from 'vitest'
import { FreeformBlockWrapper } from '../src/templates/21-freeform/blocks/FreeformBlockWrapper'
import { FreeformBlockProvider } from '../src/templates/shared/FreeformBlockContext'

// React needs to know it's running under a test harness for `act` to work, and jsdom has no ResizeObserver.
beforeAll(() => {
  ;(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true
  globalThis.ResizeObserver = class {
    observe() {}
    unobserve() {}
    disconnect() {}
  }
})

let root: Root | null = null
let container: HTMLElement | null = null
afterEach(() => {
  act(() => root?.unmount())
  container?.remove()
  root = container = null
})

function mount() {
  const onDelete = vi.fn()
  const onDuplicate = vi.fn()
  const pageMouseDown = vi.fn()
  container = document.createElement('div')
  document.body.appendChild(container)
  root = createRoot(container)
  act(() => {
    root!.render(
      <FreeformBlockProvider
        value={{
          onMoveOrResize: vi.fn(),
          selectedId: 'el1',
          onSelect: vi.fn(),
          onDelete,
          onDuplicate,
          onUpdateContent: vi.fn(),
          onUpdateStyle: vi.fn(),
          onAddElement: vi.fn(),
        }}
      >
        {/* Stands in for the page, which deselects on any mouse-down it sees. */}
        <div onMouseDown={pageMouseDown}>
          <FreeformBlockWrapper
            id="el1"
            rect={{ x: 0, y: 0, width: 300 }}
            canvasRef={{ current: null }}
            onLiveChange={vi.fn()}
            onCommitChange={vi.fn()}
            onMeasuredHeight={vi.fn()}
          >
            <p>hello</p>
          </FreeformBlockWrapper>
        </div>
      </FreeformBlockProvider>,
    )
  })
  return { onDelete, onDuplicate, pageMouseDown, button: (label: string) => container!.querySelector<HTMLButtonElement>(`button[aria-label="${label}"]`)! }
}

describe('a selected element\'s delete and duplicate buttons', () => {
  it('do not let the press reach the page, which would deselect and unmount them before the click lands', () => {
    const { pageMouseDown, button } = mount()
    for (const label of ['Delete element', 'Duplicate element']) {
      act(() => {
        button(label).dispatchEvent(new MouseEvent('mousedown', { bubbles: true }))
      })
      expect(pageMouseDown, label).not.toHaveBeenCalled()
    }
  })

  it('delete the element on click', () => {
    const { onDelete, button } = mount()
    act(() => button('Delete element').click())
    expect(onDelete).toHaveBeenCalledWith('el1')
  })

  it('duplicate the element on click', () => {
    const { onDuplicate, button } = mount()
    act(() => button('Duplicate element').click())
    expect(onDuplicate).toHaveBeenCalledWith('el1')
  })

  it('still let a mouse-down on the element itself reach the page (clicking the content is not the chrome)', () => {
    const { pageMouseDown } = mount()
    act(() => {
      container!.querySelector('p')!.dispatchEvent(new MouseEvent('mousedown', { bubbles: true }))
    })
    expect(pageMouseDown).toHaveBeenCalledTimes(1)
  })
})
