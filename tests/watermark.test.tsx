import { act } from 'react'
import { createRoot } from 'react-dom/client'
import type { Root } from 'react-dom/client'
import { renderToStaticMarkup } from 'react-dom/server'
import { afterEach, beforeAll, describe, expect, it, vi } from 'vitest'
import { createSampleInvoice } from '../src/store/invoiceStore'
import { WatermarkTemplate } from '../src/templates/14-watermark/WatermarkTemplate'
import {
  WATERMARK_DEFAULT_OPACITY,
  WATERMARK_IMAGE_DEFAULT_OPACITY,
  defaultWatermarkText,
  watermarkFontSize,
} from '../src/templates/14-watermark/watermark'
import { CanvasEditProvider } from '../src/templates/shared/CanvasEditContext'
import { InlineText } from '../src/templates/shared/primitives'
import { SectionOffsetsProvider } from '../src/templates/shared/SectionOffsetsContext'

describe('watermark helpers', () => {
  it('defaults to the business name\'s first letter, uppercased, or "I" with no name', () => {
    expect(defaultWatermarkText('aster & co')).toBe('A')
    expect(defaultWatermarkText('  northwind')).toBe('N')
    expect(defaultWatermarkText('')).toBe('I')
    expect(defaultWatermarkText('   ')).toBe('I')
  })

  it('fills the page with one letter and shrinks longer text to fit, never below a readable floor', () => {
    expect(watermarkFontSize('A')).toBe(560)
    expect(watermarkFontSize('PAID')).toBeLessThan(watermarkFontSize('PA'))
    expect(watermarkFontSize('CONFIDENTIAL')).toBeLessThan(watermarkFontSize('PAID'))
    expect(watermarkFontSize('A VERY LONG WATERMARK PHRASE INDEED')).toBe(40)
    expect(watermarkFontSize('')).toBe(560) // an empty box is sized as one character, not zero
  })
})

describe('Watermark design', () => {
  const noop = () => {}
  const EDIT = { updateField: noop } as never

  function render(watermarkText: string | undefined, name = 'Aster & Co', live = false, watermarkImage?: string) {
    const invoice = { ...createSampleInvoice('watermark'), watermarkText, watermarkImage }
    invoice.from = { ...invoice.from, name }
    let html = renderToStaticMarkup(
      <CanvasEditProvider value={live ? EDIT : null}>
        <SectionOffsetsProvider value={live ? {} : null}>
          <WatermarkTemplate invoice={invoice} />
        </SectionOffsetsProvider>
      </CanvasEditProvider>,
    )
    const root = document.createElement('div')
    root.innerHTML = html
    html = ''
    return root
  }
  const mark = (root: HTMLElement) => root.querySelector<HTMLElement>('[aria-label="Watermark"]')!

  it('shows the business initial until the user types one (what old invoices always showed)', () => {
    expect(mark(render(undefined, 'Aster & Co')).textContent).toBe('A')
    expect(mark(render(undefined, 'Zed')).textContent).toBe('Z')
  })

  it('shows the user\'s own text instead, sized to fit', () => {
    const root = render('PAID')
    expect(mark(root).textContent).toBe('PAID')
    expect(root.querySelector<HTMLElement>('[style*="font-size"]')).not.toBeNull()
  })

  it('is faint by default via opacity (so a user-picked color stays faint too)', () => {
    const wrapper = render('PAID', 'x', true).querySelector<HTMLElement>('[data-section-id="watermark"]')!
    expect(wrapper.style.opacity).toBe(String(WATERMARK_DEFAULT_OPACITY))
  })

  it('is a movable, restylable section in the editor, and inert in a thumbnail', () => {
    expect(render('PAID', 'x', true).querySelector('[data-section-id="watermark"]')).not.toBeNull()
    const thumb = render('PAID')
    expect(thumb.querySelector('[data-section-id]')).toBeNull()
    expect(mark(thumb).getAttribute('contenteditable')).toBe('false')
    expect(thumb.querySelector<HTMLElement>('[style*="pointer-events"]')?.outerHTML).toContain('pointer-events:none')
  })

  it('shows an image instead of the text when one is set, fainter-but-stronger by default, and the text returns without it', () => {
    const src = 'data:image/png;base64,iVBORw0KGgo='
    const withImage = render('PAID', 'x', true, src)
    const img = withImage.querySelector<HTMLImageElement>('img[alt="Watermark"]')!
    expect(img.getAttribute('src')).toBe(src)
    expect(withImage.querySelector('[role="textbox"]')).toBeNull()
    expect(withImage.querySelector<HTMLElement>('[data-section-id="watermark"]')!.style.opacity).toBe(String(WATERMARK_IMAGE_DEFAULT_OPACITY))

    const withoutImage = render('PAID', 'x', true)
    expect(withoutImage.querySelector('img[alt="Watermark"]')).toBeNull()
    expect(withoutImage.querySelector('[role="textbox"]')?.textContent).toBe('')
  })

  it('an image watermark is inert in a thumbnail and carries no text placeholder', () => {
    const thumb = render(undefined, 'x', false, 'data:image/png;base64,iVBORw0KGgo=')
    expect(thumb.querySelector('[data-section-id]')).toBeNull()
    expect(thumb.querySelector('img[alt="Watermark"]')).not.toBeNull()
  })

  it('an emptied watermark leaves nothing in an export, but stays as a clickable placeholder in the editor', () => {
    const empty = mark(render('', 'x', true))
    expect(empty.textContent).toBe('')
    expect(empty.getAttribute('data-export-hide')).toBe('true')
    expect(empty.getAttribute('data-placeholder')).toBe('Type a watermark')
    expect(mark(render('PAID', 'x', true)).hasAttribute('data-export-hide')).toBe(false)
  })
})

describe('InlineText', () => {
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
  function mount(value: string, props: Partial<React.ComponentProps<typeof InlineText>> = {}) {
    const onChange = vi.fn()
    container = document.createElement('div')
    document.body.appendChild(container)
    root = createRoot(container)
    const render = (v: string) => act(() => root!.render(<InlineText value={v} onChange={onChange} {...props} />))
    render(value)
    return { onChange, render, el: () => container!.querySelector<HTMLElement>('[role="textbox"]')! }
  }

  it('shows its value and reports what is typed', () => {
    const { el, onChange } = mount('PAID')
    expect(el().textContent).toBe('PAID')
    act(() => {
      el().textContent = 'PAID!'
      el().dispatchEvent(new Event('input', { bubbles: true }))
    })
    expect(onChange).toHaveBeenCalledWith('PAID!')
  })

  it('rewrites the text only when the value changes from outside (undo), leaving the caret alone while typing', () => {
    const { el, render, onChange } = mount('a')
    act(() => {
      el().textContent = 'ab'
      el().dispatchEvent(new Event('input', { bubbles: true }))
    })
    const typedNode = el().firstChild
    render(onChange.mock.calls[0][0]) // the store echoes the typed value back
    expect(el().firstChild).toBe(typedNode)
    render('z') // undo
    expect(el().textContent).toBe('z')
  })

  it('ignores line breaks, is read-only on request, and hides while empty if asked', () => {
    const { el, onChange, render } = mount('', { readOnly: true, hideWhenEmptyOnExport: true })
    expect(el().getAttribute('contenteditable')).toBe('false')
    expect(el().getAttribute('data-export-hide')).toBe('true')
    render('now')
    expect(el().hasAttribute('data-export-hide')).toBe(false)
    expect(onChange).not.toHaveBeenCalled()
  })
})
