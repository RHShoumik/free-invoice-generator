import { Checkbox } from './checkbox'
import { Label } from './label'

interface SectionToggleProps {
  checked: boolean
  onChange: (checked: boolean) => void
  label: string
}

/** A small "show on invoice" checkbox — used to toggle optional sections on/off. */
export function SectionToggle({ checked, onChange, label }: SectionToggleProps) {
  return (
    <Label className="text-xs font-medium text-muted-foreground">
      <Checkbox checked={checked} onCheckedChange={(value) => onChange(value === true)} />
      {label}
    </Label>
  )
}
