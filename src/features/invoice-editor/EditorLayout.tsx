import { useEffect, useRef, useState } from 'react'
import { Credit } from '@/components/Credit'
import { ZoomToFit } from '@/components/ui/ZoomToFit'
import { ROBOTS_NOINDEX, SEO_DESCRIPTION } from '../../lib/site'
import { usePageMeta } from '../../lib/usePageMeta'
import { useInvoiceStore } from '../../store/invoiceStore'
import { getTemplate } from '../../templates/registry'
import { LineItemsDragProvider } from '../../templates/shared/LineItemsDragContext'
import { CanvasEditProvider } from '../../templates/shared/CanvasEditContext'
import { FreeformBlockProvider } from '../../templates/shared/FreeformBlockContext'
import { BusinessDrawer } from './BusinessDrawer'
import type { LogoLook } from './BusinessDrawer'
import { ElementsDrawer } from './ElementsDrawer'
import { DrawBar } from './DrawBar'
import { DEFAULT_DRAW_SETTINGS } from './drawSettings'
import type { DrawSettings } from './drawSettings'
import { ElementStyleToolbar } from './ElementStyleToolbar'
import { UploadsDrawer } from './UploadsDrawer'
import { defaultWatermarkText } from '../../templates/14-watermark/watermark'
import { InvoicePreview } from './InvoicePreview'
import { DetailsDrawer } from './DetailsDrawer'
import { ItemDrawer } from './ItemDrawer'
import { itemKey } from '../../templates/shared/ItemTarget'
import type { PictureTarget, TextTarget } from '../../templates/shared/ItemTarget'
import { resolveStyleSelection } from './styleSelection'
import { TopBar } from './TopBar'
import { useUndoRedoShortcuts } from './useUndoRedoShortcuts'
import { TemplatePickerDialog } from './TemplatePickerDialog'
import { Dock } from './toolbar/Dock'
import type { LeftPanel } from './toolbar/Dock'
import type { ExportFormat } from './DownloadMenu'

const PAGE_WIDTH = 794
/** Left inset that keeps the page clear of the floating Elements card (16px gap + 288px card + 24px gap). */
const PANEL_INSET = 16 + 288 + 24

export function EditorLayout() {
  const invoice = useInvoiceStore((s) => s.invoice)
  const startNewInvoice = useInvoiceStore((s) => s.startNewInvoice)
  const reorderItems = useInvoiceStore((s) => s.reorderItems)
  const setElementRect = useInvoiceStore((s) => s.setElementRect)
  const addFreeformElement = useInvoiceStore((s) => s.addFreeformElement)
  const removeFreeformElement = useInvoiceStore((s) => s.removeFreeformElement)
  const duplicateFreeformElement = useInvoiceStore((s) => s.duplicateFreeformElement)
  const updateFreeformElementContent = useInvoiceStore((s) => s.updateFreeformElementContent)
  const updateFreeformElementStyle = useInvoiceStore((s) => s.updateFreeformElementStyle)
  const updateSectionStyle = useInvoiceStore((s) => s.updateSectionStyle)
  const resetWatermark = useInvoiceStore((s) => s.resetWatermark)
  const resetSectionOffsets = useInvoiceStore((s) => s.resetSectionOffsets)
  const updateFrom = useInvoiceStore((s) => s.updateFrom)
  const updateTo = useInvoiceStore((s) => s.updateTo)
  const updateField = useInvoiceStore((s) => s.updateField)
  const updateItem = useInvoiceStore((s) => s.updateItem)
  const addItem = useInvoiceStore((s) => s.addItem)
  const removeItem = useInvoiceStore((s) => s.removeItem)
  const setColumnLabel = useInvoiceStore((s) => s.setColumnLabel)
  const setCustomColumnLabel = useInvoiceStore((s) => s.setCustomColumnLabel)
  const setItemCustomValue = useInvoiceStore((s) => s.setItemCustomValue)
  const setLogo = useInvoiceStore((s) => s.setLogo)
  const [selectedId, setSelectedId] = useState<string | null>(null)
  useUndoRedoShortcuts()
  // The editor is a tool, not content: keep it out of search results (the home page is what ranks).
  usePageMeta({ title: 'Invoice editor – Invoice Generator', description: SEO_DESCRIPTION, robots: ROBOTS_NOINDEX, canonicalPath: null })

  const template = getTemplate(invoice.templateId)
  const isFreeform = template.layoutId === 'freeform'
  // Section offsets only exist on the fixed layouts — Freeform Canvas
  // positions every block itself, so there's nothing to reset there.
  const styleSelection = resolveStyleSelection({
    selectedId,
    layoutId: template.layoutId,
    watermarkIsImage: !!invoice.watermarkImage,
    isFreeform,
    freeformLayout: invoice.freeformLayout,
    sectionStyles: invoice.sectionStyles,
  })
  // A section's overrides live in `sectionStyles`; a canvas element's live on the element itself.
  const updateStyle: typeof updateFreeformElementStyle = (id, patch) =>
    styleSelection?.id === id && styleSelection.target === 'section' ? updateSectionStyle(id, patch) : updateFreeformElementStyle(id, patch)
  // The logo's look (shape / fit / position) lives where its size does: on the Freeform logo element, or in
  // `sectionStyles.logo` on a fixed layout. The Business drawer reads and writes it from either.
  const logoElement = isFreeform ? invoice.freeformLayout.find((el) => el.kind === 'logo') : undefined
  const logoStyle: LogoLook = (isFreeform ? logoElement?.style : invoice.sectionStyles.logo) ?? {}
  const updateLogoStyle = (patch: LogoLook) => {
    if (!isFreeform) updateSectionStyle('logo', patch)
    else if (logoElement) updateFreeformElementStyle(logoElement.id, patch)
  }
  // Pressing the business name opens the Business drawer: the "brand" block (name + email beside the logo)
  // on the fixed layouts, the From block on Freeform Canvas, which has no separate brand block.
  const businessId = isFreeform ? 'from' : 'brand'
  // Text on the page (a label, the invoice number, a footer paragraph…) is edited where it is: `ItemText` calls
  // `editText` with what was typed. A picture is edited on the left — pressing the logo opens the Business
  // drawer, pressing an Image element or the watermark opens the item drawer (`openItem`).
  const [item, setItem] = useState<PictureTarget | null>(null)
  const openItem = (target: PictureTarget) => {
    setItem(target)
    setLeftPanel('item')
  }
  const setLabel = useInvoiceStore((s) => s.setLabel)
  const editText = (target: TextTarget, text: string | undefined) => {
    if (target.kind === 'label') setLabel(target.key, text)
    else if (target.kind === 'field') updateField(target.field, text ?? '')
    else (target.which === 'from' ? updateFrom : updateTo)({ [target.field]: text ?? '' })
  }
  function handleSelect(id: string | null) {
    setSelectedId(id)
    if (id === businessId || id === 'logo') setLeftPanel('business')
    else if (id === 'watermark') openItem({ kind: 'watermark' })
    else if (id && invoice.freeformLayout.some((el) => el.id === id && el.kind === 'image')) openItem({ kind: 'image', elementId: id })
  }
  const canResetPositions = !isFreeform && Object.keys(invoice.sectionOffsets).length > 0
  const previewRef = useRef<HTMLDivElement>(null)
  const [exporting, setExporting] = useState<ExportFormat | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [pickerOpen, setPickerOpen] = useState(false)
  // The Elements panel starts open when there's room for it beside the page, closed on a narrow window.
  // Elements and Uploads share the one spot, so opening either closes the other.
  const [leftPanel, setLeftPanel] = useState<LeftPanel | null>(() =>
    typeof window === 'undefined' || window.innerWidth >= 1100 ? 'elements' : null,
  )
  const panelOpen = leftPanel !== null
  // Draw mode: the page takes drags as drawing, and the draw bar stands in for the style pill. The look of
  // the next shape is remembered across visits to the mode.
  const [drawing, setDrawing] = useState(false)
  const [drawSettings, setDrawSettings] = useState<DrawSettings>(DEFAULT_DRAW_SETTINGS)
  useEffect(() => {
    if (!drawing) return
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setDrawing(false)
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [drawing])

  function handlePickTemplate(templateId: string) {
    startNewInvoice(templateId, true)
    setPickerOpen(false)
  }

  async function handleExport(format: ExportFormat) {
    setError(null)
    setExporting(format)
    try {
      // Dynamically imported: jsPDF and html-to-image are large and only ever needed once someone
      // actually exports, not on first page load.
      const node = previewRef.current
      if (!node) throw new Error('Preview is not ready yet.')
      if (format === 'image') {
        const { exportToImage } = await import('../export/exportToImage')
        await exportToImage(node, invoice.invoiceNumber)
      } else {
        const { exportToPdf } = await import('../export/exportToPdf')
        await exportToPdf(node, invoice.invoiceNumber)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Export failed — please try again.')
    } finally {
      setExporting(null)
    }
  }

  return (
    <LineItemsDragProvider value={{ onReorder: reorderItems }}>
      <CanvasEditProvider
        value={{
          updateFrom,
          updateTo,
          updateField,
          updateItem,
          addItem,
          removeItem,
          setColumnLabel,
          setCustomColumnLabel,
          setItemCustomValue,
          setLogo,
          editText,
          accentColor: invoice.theme.accentColor,
        }}
      >
        <FreeformBlockProvider
          value={{
            onMoveOrResize: setElementRect,
            selectedId,
            onSelect: handleSelect,
            onDelete: removeFreeformElement,
            onDuplicate: duplicateFreeformElement,
            onUpdateContent: updateFreeformElementContent,
            onUpdateStyle: updateStyle,
            onAddElement: addFreeformElement,
          }}
        >
          <div className="flex h-screen flex-col bg-paper">
            <TopBar designName={template.name} exporting={exporting} error={error} onExport={handleExport} />

            {/* The workspace is one surface. The page scrolls on it; the panel, style pill and dock
                float over it, so opening or closing any of them never reflows the page. */}
            <div className="relative min-h-0 flex-1">
              <main
                className="bg-workspace scroll-thin absolute inset-0 overflow-y-auto pb-36 pr-6 pt-20 transition-[padding] duration-200"
                style={{ paddingLeft: panelOpen ? PANEL_INSET : 24 }}
              >
                <div className="mx-auto max-w-[794px]">
                  <ZoomToFit contentWidth={PAGE_WIDTH}>
                    <div className="shadow-[0_2px_6px_rgb(21_23_26/0.08),0_18px_48px_rgb(21_23_26/0.16)]">
                      <InvoicePreview ref={previewRef} draw={drawing ? drawSettings : null} />
                    </div>
                  </ZoomToFit>
                </div>
              </main>

              {panelOpen && (
                <div className="absolute left-4 top-4 z-30 flex max-h-[calc(100%-8rem)]">
                  {leftPanel === 'uploads' ? (
                    <UploadsDrawer onClose={() => setLeftPanel(null)} />
                  ) : leftPanel === 'business' ? (
                    <BusinessDrawer
                      name={invoice.from.name}
                      email={invoice.from.email}
                      logo={invoice.logoDataUrl}
                      logoStyle={logoStyle}
                      onNameChange={(name) => updateFrom({ name })}
                      onEmailChange={(email) => updateFrom({ email })}
                      onLogoChange={setLogo}
                      onLogoStyleChange={updateLogoStyle}
                      onClose={() => setLeftPanel(null)}
                    />
                  ) : leftPanel === 'details' ? (
                    <DetailsDrawer onClose={() => setLeftPanel(null)} />
                  ) : leftPanel === 'item' && item ? (
                    <ItemDrawer key={itemKey(item)} target={item} onClose={() => setLeftPanel(null)} />
                  ) : (
                    <ElementsDrawer
                      canResetPositions={canResetPositions}
                      onResetPositions={resetSectionOffsets}
                      onClose={() => setLeftPanel(null)}
                    />
                  )}
                </div>
              )}

              <div
                className="pointer-events-none absolute inset-x-0 top-4 z-30 flex justify-center pr-4 transition-[padding] duration-200"
                style={{ paddingLeft: panelOpen ? PANEL_INSET : 16 }}
              >
                {drawing ? (
                  <DrawBar
                    settings={drawSettings}
                    onChange={(patch) => setDrawSettings((current) => ({ ...current, ...patch }))}
                    onDone={() => setDrawing(false)}
                  />
                ) : (
                  <ElementStyleToolbar
                    selection={styleSelection}
                    onDrawingChange={(patch) => {
                      if (styleSelection?.drawing) updateFreeformElementContent(styleSelection.id, { drawing: { ...styleSelection.drawing, ...patch } })
                    }}
                    logo={{ image: invoice.logoDataUrl, onImageChange: setLogo }}
                    watermark={{
                      text: invoice.watermarkText ?? defaultWatermarkText(invoice.from.name),
                      image: invoice.watermarkImage ?? null,
                      overridden: invoice.watermarkText !== undefined || !!invoice.watermarkImage,
                      onTextChange: (text) => updateField('watermarkText', text),
                      onImageChange: (dataUrl) => updateField('watermarkImage', dataUrl ?? undefined),
                      onReset: resetWatermark,
                    }}
                  />
                )}
              </div>

              <Dock
                leftPanel={leftPanel}
                onToggleLeftPanel={(panel) => setLeftPanel((current) => (current === panel ? null : panel))}
                onOpenDesigns={() => setPickerOpen(true)}
                drawing={drawing}
                onToggleDraw={() => {
                  setSelectedId(null)
                  setDrawing((on) => !on)
                }}
                showWatermark={template.layoutId === 'watermark'}
              />

              {/* Outside the invoice page, so it is never part of an exported invoice. */}
              <Credit className="absolute bottom-5 right-5 z-20 hidden rounded-full bg-white/85 px-3.5 py-2 shadow-sm ring-1 ring-black/5 backdrop-blur lg:block" />
            </div>

            <TemplatePickerDialog
              open={pickerOpen}
              onClose={() => setPickerOpen(false)}
              onSelect={handlePickTemplate}
              currentId={invoice.templateId}
            />
          </div>
        </FreeformBlockProvider>
      </CanvasEditProvider>
    </LineItemsDragProvider>
  )
}
