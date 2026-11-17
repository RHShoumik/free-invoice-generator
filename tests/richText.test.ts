import { describe, expect, it } from 'vitest'
import { htmlToPlainText, htmlToRuns, normalizeColor, plainTextToHtml, sanitizeRichHtml, stripRunFormatting } from '../src/lib/richText'

describe('normalizeColor', () => {
  it('accepts hex and opaque rgb, normalizing to #rrggbb', () => {
    expect(normalizeColor('#DC2626')).toBe('#dc2626')
    expect(normalizeColor('#f00')).toBe('#ff0000')
    expect(normalizeColor('rgb(220, 38, 38)')).toBe('#dc2626')
    expect(normalizeColor('rgba(220,38,38,1)')).toBe('#dc2626')
  })
  it('rejects anything that is not a plain opaque color', () => {
    for (const bad of ['red', 'rgba(1,2,3,0.5)', 'url(x)', 'expression(alert(1))', '#12', '', 'var(--x)']) {
      expect(normalizeColor(bad), bad).toBeNull()
    }
  })
})

describe('sanitizeRichHtml', () => {
  it('keeps text, line breaks and a span with a color', () => {
    expect(sanitizeRichHtml('Hello <span style="color: rgb(220, 38, 38)">red</span> world<br>next')).toBe(
      'Hello <span style="color:#dc2626">red</span> world<br>next',
    )
  })

  it('turns the tags a browser may generate into spans', () => {
    expect(sanitizeRichHtml('<b>a</b><i>b</i><strong>c</strong><em>d</em>')).toBe(
      '<span style="font-weight:bold">a</span><span style="font-style:italic">b</span><span style="font-weight:bold">c</span><span style="font-style:italic">d</span>',
    )
    expect(sanitizeRichHtml('<font color="#00f">x</font>')).toBe('<span style="color:#0000ff">x</span>')
  })

  it('combines nested formatting', () => {
    expect(sanitizeRichHtml('<b><span style="color:#f00">x</span></b>')).toBe(
      '<span style="font-weight:bold"><span style="color:#ff0000">x</span></span>',
    )
  })

  it('keeps an explicit "normal", which un-bolds a word inside a bold box', () => {
    expect(sanitizeRichHtml('<span style="font-weight: normal">plain</span>')).toBe('<span style="font-weight:normal">plain</span>')
  })

  it('drops anything outside the allow-list', () => {
    expect(sanitizeRichHtml('<script>alert(1)</script>ok')).toBe('ok')
    expect(sanitizeRichHtml('<img src=x onerror=alert(1)>ok')).toBe('ok')
    expect(sanitizeRichHtml('<a href="javascript:alert(1)" onclick="x()">link</a>')).toBe('link')
    expect(sanitizeRichHtml('<span style="background:url(javascript:1);font-size:99px;color:red">x</span>')).toBe('x')
    expect(sanitizeRichHtml('<span onmouseover="x()" style="color:#f00">x</span>')).toBe('<span style="color:#ff0000">x</span>')
  })

  it('escapes text so it can never become markup', () => {
    expect(sanitizeRichHtml('1 &lt; 2 &amp;&amp; 3 &gt; 2')).toBe('1 &lt; 2 &amp;&amp; 3 &gt; 2')
    expect(sanitizeRichHtml('&lt;b&gt;not bold&lt;/b&gt;')).toBe('&lt;b&gt;not bold&lt;/b&gt;')
  })

  it('turns block lines into line breaks, however the browser nested them', () => {
    expect(sanitizeRichHtml('<div>a</div><div>b</div>')).toBe('a<br>b')
    expect(sanitizeRichHtml('a<div>b</div>c')).toBe('a<br>b<br>c')
    expect(sanitizeRichHtml('<div>a</div><div><br></div><div>b</div>')).toBe('a<br><br>b')
  })

  it('removes the single trailing <br> a contenteditable leaves behind, and treats a lone <br> as empty', () => {
    expect(sanitizeRichHtml('hello<br>')).toBe('hello')
    expect(sanitizeRichHtml('<br>')).toBe('')
    expect(sanitizeRichHtml('')).toBe('')
  })

  it('is idempotent', () => {
    const once = sanitizeRichHtml('A <b>b</b> <span style="color:rgb(1,2,3)">c</span><br>d<div>e</div>')
    expect(sanitizeRichHtml(once)).toBe(once)
  })
})

describe('stripRunFormatting', () => {
  const html = 'a <span style="color:#ff0000;font-weight:bold;font-style:italic">b</span> c'
  it('removes only the named formatting', () => {
    expect(stripRunFormatting(html, ['color'])).toBe('a <span style="font-weight:bold;font-style:italic">b</span> c')
    expect(stripRunFormatting(html, ['bold', 'italic'])).toBe('a <span style="color:#ff0000">b</span> c')
  })
  it('leaves plain text as it was once nothing is left to style', () => {
    expect(stripRunFormatting(html, ['color', 'bold', 'italic'])).toBe('a b c')
  })
})

describe('text conversions', () => {
  it('plainTextToHtml escapes and turns newlines into breaks', () => {
    expect(plainTextToHtml('a < b\nc & d')).toBe('a &lt; b<br>c &amp; d')
  })
  it('htmlToPlainText round-trips it', () => {
    expect(htmlToPlainText(plainTextToHtml('a < b\nc & d'))).toBe('a < b\nc & d')
  })
  it('htmlToRuns gives each run its own formatting', () => {
    expect(htmlToRuns('plain <span style="color:#ff0000;font-weight:bold">red bold</span><br><span style="font-weight:normal">n</span>')).toEqual([
      { text: 'plain ' },
      { text: 'red bold', color: '#ff0000', bold: true },
      { text: '\n' },
      { text: 'n', bold: false },
    ])
  })
})
