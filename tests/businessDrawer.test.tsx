import { act } from 'react'
import { createRoot } from 'react-dom/client'
import type { Root } from 'react-dom/client'
import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest'
import { BusinessDrawer } from '../src/features/invoice-editor/BusinessDrawer'

beforeAll(() => {
  ;(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true
})

const PNG = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII='

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
  vi.restoreAllMocks()
})

function mount(props: Partial<React.ComponentProps<typeof BusinessDrawer>> = {}) {
  const handlers = {
    onNameChange: vi.fn(),
    onEmailChange: vi.fn(),
    onLogoChange: vi.fn(),
    onLogoStyleChange: vi.fn(),
    onClose: vi.fn(),
  }
  act(() =>
    root.render(
      <BusinessDrawer name="Aster & Co." email="hello@aster.co" logo={PNG} logoStyle={{}} {...handlers} {...props} />,
    ),
  )
  return handlers
}

const byLabel = (label: string) => host.querySelector<HTMLElement>(`[aria-label="${label}"]`)
const group = (label: string) => host.querySelector<HTMLElement>(`[role="group"][aria-label="${label}"]`)
const inGroup = (g: string, label: string) => group(g)?.querySelector<HTMLButtonElement>(`[aria-label="${label}"]`) ?? null
const click = (el: Element | null) => act(() => (el as HTMLElement).click())
function typeInto(input: HTMLInputElement, value: string) {
  act(() => {
    Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value')!.set!.call(input, value)
    input.dispatchEvent(new Event('input', { bubbles: true }))
  })
}

describe('the Business drawer', () => {
  it('shows the business name and email and reports edits as you type', () => {
    const h = mount()
    const name = host.querySelector<HTMLInputElement>('input[aria-label="Business name"]')!
    const email = host.querySelector<HTMLInputElement>('input[aria-label="Email"]')!
    expect(name.value).toBe('Aster & Co.')
    expect(email.value).toBe('hello@aster.co')
    typeInto(name, 'Aster Studio')
    expect(h.onNameChange).toHaveBeenCalledWith('Aster Studio')
    typeInto(email, 'hi@aster.co')
    expect(h.onEmailChange).toHaveBeenCalledWith('hi@aster.co')
  })

  it('closes from its ✕', () => {
    const h = mount()
    click(byLabel('Close business panel'))
    expect(h.onClose).toHaveBeenCalledTimes(1)
  })

  describe('with a logo', () => {
    it('previews it and offers Replace and Remove', () => {
      const h = mount()
      expect(host.querySelector('img[alt="Logo preview"]')?.getAttribute('src')).toBe(PNG)
      click(byLabel('Remove logo'))
      expect(h.onLogoChange).toHaveBeenCalledWith(null)
      const picker = vi.spyOn(HTMLInputElement.prototype, 'click').mockImplementation(() => {})
      click(byLabel('Replace logo'))
      expect(picker).toHaveBeenCalledTimes(1)
    })

    it('rejects a file that is not an image, in the drawer', () => {
      mount()
      const input = host.querySelector<HTMLInputElement>('input[type="file"]')!
      Object.defineProperty(input, 'files', { value: [new File(['x'], 'notes.txt', { type: 'text/plain' })] })
      act(() => void input.dispatchEvent(new Event('change', { bubbles: true })))
      expect(host.querySelector('[role="alert"]')?.textContent).toBe('Choose an image file.')
    })

    it('offers three fits, with "Fit" (the whole image) chosen until you pick another', () => {
      const h = mount()
      expect(group('Logo fit')).not.toBeNull()
      expect(inGroup('Logo fit', 'Fit')!.getAttribute('aria-pressed')).toBe('true')
      expect(inGroup('Logo fit', 'Fill')!.getAttribute('aria-pressed')).toBe('false')
      click(inGroup('Logo fit', 'Fill'))
      expect(h.onLogoStyleChange).toHaveBeenCalledWith({ fit: 'fill' })
      click(inGroup('Logo fit', 'Stretch'))
      expect(h.onLogoStyleChange).toHaveBeenCalledWith({ fit: 'stretch' })
    })

    it('offers a 3×3 position grid, centered until you pick another cell', () => {
      const h = mount()
      const cells = group('Logo position')!.querySelectorAll('button')
      expect(cells).toHaveLength(9)
      expect(inGroup('Logo position', 'Center')!.getAttribute('aria-pressed')).toBe('true')
      click(inGroup('Logo position', 'Top left'))
      expect(h.onLogoStyleChange).toHaveBeenCalledWith({ imagePosition: 'top-left' })
    })

    it('marks the chosen position', () => {
      mount({ logoStyle: { imagePosition: 'bottom-right' } })
      expect(inGroup('Logo position', 'Bottom right')!.getAttribute('aria-pressed')).toBe('true')
      expect(inGroup('Logo position', 'Center')!.getAttribute('aria-pressed')).toBe('false')
    })

    it('turns the position grid off while the image is stretched, since there is nothing to position', () => {
      mount({ logoStyle: { fit: 'stretch' } })
      const cells = [...group('Logo position')!.querySelectorAll('button')]
      expect(cells.every((c) => c.disabled)).toBe(true)
    })

    it('offers the three shapes', () => {
      const h = mount({ logoStyle: { shape: 'rounded' } })
      expect(inGroup('Logo shape', 'Rounded')!.getAttribute('aria-pressed')).toBe('true')
      click(inGroup('Logo shape', 'Circle'))
      expect(h.onLogoStyleChange).toHaveBeenCalledWith({ shape: 'circle' })
    })

    it('shows the preview exactly as it will print: same fit, position and shape', () => {
      mount({ logoStyle: { fit: 'fill', imagePosition: 'top-left', shape: 'circle' } })
      const img = host.querySelector<HTMLImageElement>('img[alt="Logo preview"]')!
      expect(img.style.objectFit).toBe('cover')
      expect(img.style.objectPosition).toBe('left top')
      expect(img.style.borderRadius).not.toBe('')
    })
  })

  describe('without a logo', () => {
    it('offers Upload, and none of the fit, position or shape choices', () => {
      mount({ logo: null })
      expect(host.textContent).toContain('Upload logo')
      expect(group('Logo fit')).toBeNull()
      expect(group('Logo position')).toBeNull()
      expect(group('Logo shape')).toBeNull()
      expect(host.querySelector('img')).toBeNull()
    })
  })
})
