import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import { LOGO_POSITIONS, logoObjectFit, logoObjectPosition } from '../src/lib/logoFit'
import { Logo } from '../src/templates/shared/primitives'
import { SectionStylesProvider } from '../src/templates/shared/SectionOffsetsContext'

const PNG = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII='

describe('logo fit and position', () => {
  it('maps the three fits to CSS, with "fit" (the whole image) as the default', () => {
    expect(logoObjectFit(undefined)).toBe('contain')
    expect(logoObjectFit('fit')).toBe('contain')
    expect(logoObjectFit('fill')).toBe('cover')
    expect(logoObjectFit('stretch')).toBe('fill')
  })

  it('maps each of the nine positions to a CSS object-position, centered by default', () => {
    expect(logoObjectPosition(undefined)).toBe('center')
    expect(logoObjectPosition('top-left')).toBe('left top')
    expect(logoObjectPosition('top')).toBe('center top')
    expect(logoObjectPosition('bottom-right')).toBe('right bottom')
    expect(logoObjectPosition('left')).toBe('left center')
    expect(logoObjectPosition('center')).toBe('center')
  })

  it('lists the positions in grid order, top-left first, each with a readable label', () => {
    expect(LOGO_POSITIONS).toHaveLength(9)
    expect(LOGO_POSITIONS.map((p) => p.position)).toEqual([
      'top-left', 'top', 'top-right', 'left', 'center', 'right', 'bottom-left', 'bottom', 'bottom-right',
    ])
    expect(LOGO_POSITIONS[0].label).toBe('Top left')
    expect(LOGO_POSITIONS[4].label).toBe('Center')
  })
})

function logoImg(props: Partial<React.ComponentProps<typeof Logo>> = {}, sectionStyle?: object): HTMLImageElement {
  const root = document.createElement('div')
  root.innerHTML = renderToStaticMarkup(
    <SectionStylesProvider value={sectionStyle ? { logo: sectionStyle } : null}>
      <Logo logoDataUrl={PNG} businessName="Aster" {...props} />
    </SectionStylesProvider>,
  )
  return root.querySelector('img') as HTMLImageElement
}

describe('the Logo primitive honours fit and position', () => {
  it('draws the whole image, centered, when nothing was chosen (what every existing invoice does today)', () => {
    const img = logoImg()
    expect(img.style.objectFit).toBe('contain')
    expect(img.style.objectPosition).toBe('')
  })

  it('takes fit and position from props (Freeform Canvas keeps them on the element)', () => {
    const img = logoImg({ fit: 'fill', imagePosition: 'top-left' })
    expect(img.style.objectFit).toBe('cover')
    expect(img.style.objectPosition).toBe('left top')
  })

  it('takes them from the logo section style on a fixed layout', () => {
    const img = logoImg({}, { fit: 'stretch', imagePosition: 'bottom' })
    expect(img.style.objectFit).toBe('fill')
    expect(img.style.objectPosition).toBe('center bottom')
  })

  it('lets the props win over the section style', () => {
    const img = logoImg({ fit: 'fit' }, { fit: 'stretch' })
    expect(img.style.objectFit).toBe('contain')
  })
})
