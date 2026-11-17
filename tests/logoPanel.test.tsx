import { act } from 'react'
import { createRoot } from 'react-dom/client'
import type { Root } from 'react-dom/client'
import { afterEach, beforeAll, describe, expect, it } from 'vitest'
import { resolveStyleSelection } from '../src/features/invoice-editor/styleSelection'
import { logoRadius } from '../src/lib/logoShape'
import { createBlankInvoice, useInvoiceStore } from '../src/store/invoiceStore'
import { Logo } from '../src/templates/shared/primitives/Logo'
import { CanvasEditProvider } from '../src/templates/shared/CanvasEditContext'
import { SectionStylesProvider } from '../src/templates/shared/SectionOffsetsContext'

beforeAll(() => {
  ;(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true
})

describe('logoRadius', () => {
  it('uses the design\'s own corner until a shape is chosen', () => {
    expect(logoRadius(undefined, 60, 8)).toBe(8)
  })

  it('maps each shape to a corner radius', () => {
    expect(logoRadius('square', 60, 8)).toBe(0)
    expect(logoRadius('rounded', 60, 0)).toBe(12)
    expect(logoRadius('circle', 60, 8)).toBe(9999)
  })
})

describe('the logo in the style bar', () => {
  const base = createBlankInvoice('classic')
  const input = (over: Partial<Parameters<typeof resolveStyleSelection>[0]>) => ({
    selectedId: null,
    layoutId: 'classic',
    isFreeform: false,
    freeformLayout: base.freeformLayout,
    sectionStyles: {},
    ...over,
  })

  it('is selectable on a fixed layout, and offers the logo controls', () => {
    expect(resolveStyleSelection(input({ selectedId: 'logo' }))).toMatchObject({ id: 'logo', logo: true, target: 'section' })
  })

  it('offers them on Freeform Canvas too', () => {
    const logo = base.freeformLayout.find((el) => el.kind === 'logo')!
    expect(resolveStyleSelection(input({ selectedId: logo.id, isFreeform: true, layoutId: 'freeform' }))).toMatchObject({ logo: true, target: 'element' })
  })

  it('does not offer them for other sections', () => {
    expect(resolveStyleSelection(input({ selectedId: 'to' }))?.logo).toBe(false)
  })
})

describe('the Logo primitive on the page', () => {
  let root: Root | null = null
  let container: HTMLElement | null = null
  afterEach(() => {
    act(() => root?.unmount())
    container?.remove()
    root = container = null
  })

  function mount(sectionStyles: Record<string, { shape?: 'square' | 'rounded' | 'circle' }>, editable: boolean) {
    container = document.createElement('div')
    document.body.appendChild(container)
    root = createRoot(container)
    const tile = (
      <SectionStylesProvider value={sectionStyles}>
        <Logo logoDataUrl={null} businessName="Acme" size={60} radius={8} />
      </SectionStylesProvider>
    )
    act(() => {
      root!.render(
        editable ? (
          <CanvasEditProvider
            value={{
              updateFrom: () => {}, updateTo: () => {}, updateField: () => {}, updateItem: () => {}, addItem: () => {}, removeItem: () => {},
              setColumnLabel: () => {}, setCustomColumnLabel: () => {}, setItemCustomValue: () => {}, setLogo: () => {},
            }}
          >
            {tile}
          </CanvasEditProvider>
        ) : (
          tile
        ),
      )
    })
    return container
  }

  const tileOf = (c: HTMLElement) => c.querySelector<HTMLElement>('[style*="border-radius"]')!

  it('takes its corners from the shape stored for the logo section', () => {
    expect(tileOf(mount({}, false)).style.borderRadius).toBe('8px')
    act(() => root?.unmount())
    container?.remove()
    expect(tileOf(mount({ logo: { shape: 'circle' } }, false)).style.borderRadius).toBe('9999px')
  })

  it('a single click does not open the file picker (so the logo can be selected), but a double click does', () => {
    const c = mount({}, true)
    const input = c.querySelector<HTMLInputElement>('input[type="file"]')!
    let opened = 0
    input.click = () => {
      opened += 1
    }
    const wrapper = c.querySelector<HTMLElement>('[title="Double-click to replace"]')!
    act(() => wrapper.dispatchEvent(new MouseEvent('click', { bubbles: true })))
    expect(opened).toBe(0)
    act(() => wrapper.dispatchEvent(new MouseEvent('dblclick', { bubbles: true })))
    expect(opened).toBe(1)
  })

  it('stores a chosen shape per section, as one undoable edit', () => {
    useInvoiceStore.getState().startNewInvoice('classic')
    useInvoiceStore.getState().updateSectionStyle('logo', { shape: 'rounded' })
    expect(useInvoiceStore.getState().invoice.sectionStyles.logo).toEqual({ shape: 'rounded' })
    useInvoiceStore.getState().undo()
    expect(useInvoiceStore.getState().invoice.sectionStyles.logo).toBeUndefined()
  })
})
