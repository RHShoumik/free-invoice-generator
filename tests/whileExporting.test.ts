import { describe, expect, it } from 'vitest'
import { whileExporting } from '../src/features/export/whileExporting'

describe('whileExporting', () => {
  it('marks the page as being captured for exactly as long as the capture runs, and hands back its result', async () => {
    const page = document.createElement('div')
    let during: string | undefined
    const result = await whileExporting(page, async () => {
      during = page.dataset.exporting
      return 'png'
    })
    expect(during).toBe('true')
    expect(page.dataset.exporting).toBeUndefined()
    expect(result).toBe('png')
  })

  it('takes the mark off again when the capture fails, and lets the failure through', async () => {
    const page = document.createElement('div')
    await expect(
      whileExporting(page, async () => {
        throw new Error('Could not generate an image from the invoice preview.')
      }),
    ).rejects.toThrow('Could not generate an image')
    expect(page.dataset.exporting).toBeUndefined()
  })
})
