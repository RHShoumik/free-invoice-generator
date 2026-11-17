import { act } from 'react'
import { createRoot } from 'react-dom/client'
import type { Root } from 'react-dom/client'
import { afterEach, beforeAll, describe, expect, it, vi } from 'vitest'
import { RichTextField } from '../src/templates/21-freeform/blocks/RichTextField'

beforeAll(() => {
  ;(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true
})

let root: Root | null = null
let container: HTMLElement | null = null
afterEach(() => {
  act(() => root?.unmount())
  container?.remove()
  root = container = null
})

function mount(props: Partial<React.ComponentProps<typeof RichTextField>> = {}) {
  const onChange = vi.fn()
  container = document.createElement('div')
  document.body.appendChild(container)
  root = createRoot(container)
  const render = (html: string, extra: Partial<React.ComponentProps<typeof RichTextField>> = {}) =>
    act(() => {
      root!.render(<RichTextField html={html} onChange={onChange} elementId="el1" placeholder="Text" {...props} {...extra} />)
    })
  return { onChange, render, box: () => container!.querySelector<HTMLElement>('[data-rich-text]')! }
}

describe('RichTextField', () => {
  it('shows the stored rich text', () => {
    const { render, box } = mount()
    render('a <span style="color:#ff0000">b</span><br>c')
    expect(box().innerHTML).toBe('a <span style="color:#ff0000">b</span><br>c')
    expect(box().getAttribute('contenteditable')).toBe('true')
    expect(box().dataset.richText).toBe('el1')
  })

  it('never renders anything outside the allow-list, whatever the stored value says', () => {
    const { render, box } = mount()
    render('hi<img src=x onerror="window.__pwned=1"><script>window.__pwned=1</script><a href="javascript:1">x</a>')
    expect(box().querySelector('img, script, a')).toBeNull()
    expect(box().textContent).toBe('hix')
  })

  it('rewrites the box when the stored value changes from outside (undo/redo)', () => {
    const { render, box } = mount()
    render('one')
    render('two <span style="color:#00ff00">three</span>')
    expect(box().innerHTML).toBe('two <span style="color:#00ff00">three</span>')
  })

  it('reports what was typed, sanitized, with the plain text alongside', () => {
    const { render, box, onChange } = mount()
    render('hello')
    act(() => {
      box().innerHTML = 'hello <b>there</b><div>next</div>'
      box().dispatchEvent(new Event('input', { bubbles: true }))
    })
    expect(onChange).toHaveBeenCalledWith('hello <span style="font-weight:bold">there</span><br>next', 'hello there\nnext')
  })

  it('does not touch the DOM when the stored value is just the echo of its own typing (so the caret stays put)', () => {
    const { render, box, onChange } = mount()
    render('hello')
    const textNode = box().firstChild
    act(() => {
      box().innerHTML = 'hello!'
      box().dispatchEvent(new Event('input', { bubbles: true }))
    })
    const typedNode = box().firstChild
    const [html] = onChange.mock.calls[0]
    render(html) // the store feeds the same value back down
    expect(box().firstChild).toBe(typedNode)
    expect(typedNode).not.toBe(textNode)
  })

  it('is not editable when read-only, and hides an empty box from exports', () => {
    const { render, box } = mount({ readOnly: true })
    render('')
    expect(box().getAttribute('contenteditable')).toBe('false')
    expect(box().getAttribute('data-export-hide')).toBe('true')
    render('now has text')
    expect(box().hasAttribute('data-export-hide')).toBe(false)
  })
})
