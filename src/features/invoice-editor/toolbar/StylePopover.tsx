import { Palette } from 'lucide-react'
import { Field } from '@/components/ui/Field'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { DockButton } from './DockButton'
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { FONT_OPTIONS } from '../../../types/invoice'
import type { FontId } from '../../../types/invoice'
import { useInvoiceStore } from '../../../store/invoiceStore'
import { getLayoutGroups, getTemplate } from '../../../templates/registry'

const PRESET_COLORS = ['#2563eb', '#7c3aed', '#f43f5e', '#16a34a', '#0b3d91', '#a16207', '#0f172a', '#22d3ee']

/** Design switcher + accent color + font + padding. */
export function StylePopover() {
  const templateId = useInvoiceStore((s) => s.invoice.templateId)
  const theme = useInvoiceStore((s) => s.invoice.theme)
  const setTemplate = useInvoiceStore((s) => s.setTemplate)
  const setAccentColor = useInvoiceStore((s) => s.setAccentColor)
  const setFont = useInvoiceStore((s) => s.setFont)
  const setPadding = useInvoiceStore((s) => s.setPadding)
  const resetPaddingToDefault = useInvoiceStore((s) => s.resetPaddingToDefault)
  const layoutGroups = getLayoutGroups()
  const isFreeform = getTemplate(templateId).layoutId === 'freeform'

  function handlePaddingChange(side: 'top' | 'right' | 'bottom' | 'left', raw: string) {
    const value = Math.max(0, Number(raw) || 0)
    setPadding({ [side]: value })
  }

  return (
    <Popover>
      <PopoverTrigger asChild>
        <DockButton icon={Palette} label="Style" />
      </PopoverTrigger>
      <PopoverContent side="top" align="center" sideOffset={14} className="w-80 rounded-2xl p-4 shadow-xl">
        <h3 className="text-sm font-bold text-foreground">Style</h3>
        <div className="space-y-4">
          <Field label="Design">
            <Select value={templateId} onValueChange={setTemplate}>
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {layoutGroups.map((group) => (
                  <SelectGroup key={group.layoutId}>
                    <SelectLabel>{group.layoutName}</SelectLabel>
                    {group.presets.map((t) => (
                      <SelectItem key={t.id} value={t.id}>
                        {t.name}
                      </SelectItem>
                    ))}
                  </SelectGroup>
                ))}
              </SelectContent>
            </Select>
          </Field>
          <Field label="Accent color">
            <div className="flex items-center gap-2">
              <input
                type="color"
                value={theme.accentColor}
                onChange={(e) => setAccentColor(e.target.value)}
                className="h-9 w-9 shrink-0 cursor-pointer rounded-md border border-input bg-white p-1"
                aria-label="Accent color"
              />
              <Input
                value={theme.accentColor}
                onChange={(e) => setAccentColor(e.target.value)}
                className="font-mono uppercase"
              />
            </div>
            <div className="mt-2 flex flex-wrap gap-1.5">
              {PRESET_COLORS.map((color) => (
                <button
                  key={color}
                  type="button"
                  onClick={() => setAccentColor(color)}
                  className="h-6 w-6 rounded-full border border-black/10"
                  style={{ backgroundColor: color }}
                  aria-label={`Use ${color}`}
                />
              ))}
            </div>
          </Field>
          <Field label="Font">
            <Select value={theme.font} onValueChange={(value) => setFont(value as FontId)}>
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {FONT_OPTIONS.map((f) => (
                  <SelectItem key={f.id} value={f.id}>
                    {f.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>
          {/* Freeform Canvas places every block itself, so it has no page padding to set. */}
          {!isFreeform && (
          <Field
            label="Page padding (px)"
            action={
              <Button type="button" variant="link" size="sm" className="h-auto p-0 text-xs" onClick={resetPaddingToDefault}>
                Reset
              </Button>
            }
          >
            <div className="grid grid-cols-4 gap-2">
              <label className="block">
                <span className="mb-1 block text-center text-[10px] text-muted-foreground">Top</span>
                <Input
                  type="number"
                  min={0}
                  value={theme.padding.top}
                  onChange={(e) => handlePaddingChange('top', e.target.value)}
                  className="text-center"
                />
              </label>
              <label className="block">
                <span className="mb-1 block text-center text-[10px] text-muted-foreground">Right</span>
                <Input
                  type="number"
                  min={0}
                  value={theme.padding.right}
                  onChange={(e) => handlePaddingChange('right', e.target.value)}
                  className="text-center"
                />
              </label>
              <label className="block">
                <span className="mb-1 block text-center text-[10px] text-muted-foreground">Bottom</span>
                <Input
                  type="number"
                  min={0}
                  value={theme.padding.bottom}
                  onChange={(e) => handlePaddingChange('bottom', e.target.value)}
                  className="text-center"
                />
              </label>
              <label className="block">
                <span className="mb-1 block text-center text-[10px] text-muted-foreground">Left</span>
                <Input
                  type="number"
                  min={0}
                  value={theme.padding.left}
                  onChange={(e) => handlePaddingChange('left', e.target.value)}
                  className="text-center"
                />
              </label>
            </div>
          </Field>
          )}
        </div>
      </PopoverContent>
    </Popover>
  )
}
