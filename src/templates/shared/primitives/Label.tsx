import { resolveLabel } from '../../../lib/labels'
import type { LabelKey } from '../../../types/invoice'
import { useLabels } from '../LabelsContext'
import { ItemText } from './ItemText'

interface LabelProps {
  id: LabelKey
  /** The layout's own wording for this label — what prints until the user types something of their own. */
  children: string
}

/**
 * A printed label — "Invoice", "Issue Date", "Bill To", "Subtotal"… — as a
 * drop-in for the literal text it replaces: `<p>Issue Date</p>` becomes
 * `<p><Label id="issueDate">Issue Date</Label></p>`, and the layout keeps its
 * look. The user's wording (`invoice.labels`, one key per role, shared by all
 * layouts) wins over `children`; clicking it edits it in place. An emptied
 * label prints nothing and stays out of an export, but keeps a click target in
 * the editor so it can be brought back.
 */
export function Label({ id, children }: LabelProps) {
  const text = resolveLabel(useLabels(), id, children)
  return (
    <ItemText target={{ kind: 'label', key: id, fallback: children }} empty={text === ''}>
      {text}
    </ItemText>
  )
}
