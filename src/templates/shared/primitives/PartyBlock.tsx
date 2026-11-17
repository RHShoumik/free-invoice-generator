import { useCanvasEdit } from '../CanvasEditContext'
import { useMovableSection } from '../SectionOffsetsContext'
import { InlineField } from './InlineField'
import { Label } from './Label'
import type { Party } from '../../../types/invoice'

interface PartyBlockProps {
  label: string
  party: Party
  /** Which side of the invoice this instance renders — picks `updateFrom`/`updateTo` from the edit context. */
  which: 'from' | 'to'
  className?: string
  labelClassName?: string
  nameClassName?: string
  lineClassName?: string
}

/**
 * Renders a Party (business or client) with a small label above it, e.g.
 * "From" / "Bill To". Click-to-edit across all 21 layouts via
 * `CanvasEditContext` (opt-in, gated on null — see that file for why); when
 * the context isn't provided (a design-picker thumbnail), every field
 * renders read-only, matching the old plain-text behavior exactly.
 */
export function PartyBlock({ label, party, which, className, labelClassName, nameClassName, lineClassName }: PartyBlockProps) {
  const edit = useCanvasEdit()
  const movable = useMovableSection(which)
  const readOnly = !edit
  const set = (patch: Partial<Party>) => (which === 'from' ? edit?.updateFrom(patch) : edit?.updateTo(patch))

  return (
    <div className={className} style={movable.style} {...movable.attrs}>
      <p className={labelClassName}>
        <Label id={which === 'from' ? 'from' : 'billTo'}>{label}</Label>
      </p>
      <InlineField
        value={party.name}
        onChange={(v) => set({ name: v })}
        placeholder="Business name"
        className={nameClassName}
        readOnly={readOnly}
        ariaLabel={`${label} name`}
      />
      <InlineField
        as="textarea"
        value={party.address}
        onChange={(v) => set({ address: v })}
        placeholder="Address"
        className={lineClassName}
        readOnly={readOnly}
        hideWhenEmptyOnExport
        ariaLabel={`${label} address`}
      />
      <InlineField
        value={party.email}
        onChange={(v) => set({ email: v })}
        placeholder="Email"
        className={lineClassName}
        readOnly={readOnly}
        hideWhenEmptyOnExport
        ariaLabel={`${label} email`}
      />
      <InlineField
        value={party.phone}
        onChange={(v) => set({ phone: v })}
        placeholder="Phone"
        className={lineClassName}
        readOnly={readOnly}
        hideWhenEmptyOnExport
        ariaLabel={`${label} phone`}
      />
      <InlineField
        value={party.taxId}
        onChange={(v) => set({ taxId: v })}
        placeholder="Tax ID"
        className={lineClassName}
        readOnly={readOnly}
        hideWhenEmptyOnExport
        ariaLabel={`${label} tax ID`}
      />
    </div>
  )
}
