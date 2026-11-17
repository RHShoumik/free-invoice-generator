import { act } from 'react'
import { createRoot } from 'react-dom/client'
import type { Root } from 'react-dom/client'
import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest'
import { UploadsDrawer } from '../src/features/invoice-editor/UploadsDrawer'
import { UPLOAD_DRAG_TYPE } from '../src/features/invoice-editor/elementDrag'
import { createBlankInvoice, useInvoiceStore } from '../src/store/invoiceStore'
import { MAX_UPLOADS, useUploadsStore } from '../src/store/uploadsStore'
import { FreeformBlockProvider } from '../src/templates/shared/FreeformBlockContext'

beforeAll(() => {
  ;(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true
})

const png = (n: number) => ({ name: `pic-${n}.png`, dataUrl: `data:image/png;base64,AAA${n}` })

beforeEach(() => useUploadsStore.setState({ items: [] }))

describe('the uploads library', () => {
  it('puts the newest upload first and gives each an id', () => {
    const { add } = useUploadsStore.getState()
    const a = add(png(1))
    const b = add(png(2))
    expect(a.id).not.toBe(b.id)
    expect(useUploadsStore.getState().items.map((i) => i.name)).toEqual(['pic-2.png', 'pic-1.png'])
  })

  it('keeps only the most recent MAX_UPLOADS', () => {
    const { add } = useUploadsStore.getState()
    for (let i = 0; i < MAX_UPLOADS + 3; i++) add(png(i))
    const names = useUploadsStore.getState().items.map((i) => i.name)
    expect(names).toHaveLength(MAX_UPLOADS)
    expect(names[0]).toBe(`pic-${MAX_UPLOADS + 2}.png`)
    expect(names).not.toContain('pic-0.png')
  })

  it('removes one by id', () => {
    const { add, remove } = useUploadsStore.getState()
    const a = add(png(1))
    add(png(2))
    remove(a.id)
    expect(useUploadsStore.getState().items.map((i) => i.name)).toEqual(['pic-2.png'])
  })

  it('is saved under its own key, apart from the invoice', () => {
    useUploadsStore.getState().add(png(1))
    const saved = JSON.parse(localStorage.getItem('invoice-generator/uploads') ?? 'null')
    expect(saved.state.items).toHaveLength(1)
    expect(localStorage.getItem('invoice-generator/invoice') ?? '').not.toContain('pic-1.png')
  })

  it('is not cleared by starting a new invoice, and not touched by undo', () => {
    useUploadsStore.getState().add(png(1))
    useInvoiceStore.getState().startNewInvoice('classic')
    useInvoiceStore.getState().undo()
    expect(useUploadsStore.getState().items).toHaveLength(1)
  })

  it('leaves the library as it was, and says why, when the browser is out of storage', () => {
    const { add } = useUploadsStore.getState()
    add(png(1))
    const spy = vi.spyOn(Storage.prototype, 'setItem').mockImplementationOnce(() => {
      throw new DOMException('full', 'QuotaExceededError')
    })
    expect(() => add(png(2))).toThrow(/storage/i)
    spy.mockRestore()
    expect(useUploadsStore.getState().items.map((i) => i.name)).toEqual(['pic-1.png'])
  })
})

describe('the Uploads drawer', () => {
  let root: Root | null = null
  let container: HTMLElement | null = null
  afterEach(() => {
    act(() => root?.unmount())
    container?.remove()
    root = container = null
  })

  function mount() {
    const onAddElement = vi.fn()
    const onClose = vi.fn()
    container = document.createElement('div')
    document.body.appendChild(container)
    root = createRoot(container)
    act(() => {
      root!.render(
        <FreeformBlockProvider
          value={{
            onMoveOrResize: vi.fn(), selectedId: null, onSelect: vi.fn(), onDelete: vi.fn(), onDuplicate: vi.fn(),
            onUpdateContent: vi.fn(), onUpdateStyle: vi.fn(), onAddElement,
          }}
        >
          <UploadsDrawer onClose={onClose} />
        </FreeformBlockProvider>,
      )
    })
    return { onAddElement, onClose, q: (sel: string) => container!.querySelector<HTMLButtonElement>(sel)! }
  }

  it('invites you to upload when the library is empty', () => {
    const { q } = mount()
    expect(container!.textContent).toContain('No uploads yet')
    expect(q('button[aria-label^="Add"]')).toBeNull()
  })

  it('shows each upload as a card', () => {
    useUploadsStore.getState().add(png(1))
    useUploadsStore.getState().add(png(2))
    mount()
    expect(container!.querySelectorAll('button[aria-label^="Add "]')).toHaveLength(2)
  })

  it('a click drops the image on the page as an Image element holding that picture', () => {
    const image = useUploadsStore.getState().add(png(1))
    const { onAddElement, q } = mount()
    act(() => q('button[aria-label="Add pic-1.png to the page"]').click())
    expect(onAddElement).toHaveBeenCalledWith('image', undefined, { dataUrl: image.dataUrl })
  })

  it('starts a drag that carries the upload\'s id', () => {
    const image = useUploadsStore.getState().add(png(1))
    const { q } = mount()
    const setData = vi.fn()
    const event = new Event('dragstart', { bubbles: true }) as Event & { dataTransfer: unknown }
    event.dataTransfer = { setData, effectAllowed: '' }
    act(() => {
      q('button[aria-label="Add pic-1.png to the page"]').dispatchEvent(event)
    })
    expect(setData).toHaveBeenCalledWith(UPLOAD_DRAG_TYPE, image.id)
  })

  it('"Use as logo" sets the invoice\'s logo', () => {
    useInvoiceStore.setState({ invoice: createBlankInvoice('classic') })
    const image = useUploadsStore.getState().add(png(1))
    const { q } = mount()
    act(() => q('button[aria-label="Use pic-1.png as the logo"]').click())
    expect(useInvoiceStore.getState().invoice.logoDataUrl).toBe(image.dataUrl)
  })

  it('delete removes it from the library only', () => {
    useInvoiceStore.setState({ invoice: createBlankInvoice('classic') })
    useUploadsStore.getState().add(png(1))
    const { q } = mount()
    act(() => q('button[aria-label="Delete pic-1.png from uploads"]').click())
    expect(useUploadsStore.getState().items).toHaveLength(0)
    expect(container!.textContent).toContain('No uploads yet')
  })

  it('closes from its ✕', () => {
    const { onClose, q } = mount()
    act(() => q('button[aria-label="Close uploads panel"]').click())
    expect(onClose).toHaveBeenCalled()
  })
})

describe('adding an element with starting content', () => {
  beforeEach(() => useInvoiceStore.setState({ invoice: createBlankInvoice('classic') }))

  it('an image added with a data URL starts with that picture, at the drop point', () => {
    useInvoiceStore.getState().addFreeformElement('image', { x: 397, y: 641 }, { dataUrl: 'data:image/png;base64,ZZ' })
    const el = useInvoiceStore.getState().invoice.freeformLayout.find((e) => e.kind === 'image')
    expect(el).toMatchObject({ dataUrl: 'data:image/png;base64,ZZ', x: 248, y: 624, width: 300 })
  })

  it('without content it still starts empty', () => {
    useInvoiceStore.getState().addFreeformElement('image')
    expect(useInvoiceStore.getState().invoice.freeformLayout.find((e) => e.kind === 'image')).toMatchObject({ dataUrl: null })
  })
})
