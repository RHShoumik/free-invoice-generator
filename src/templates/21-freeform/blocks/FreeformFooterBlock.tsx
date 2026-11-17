import { InlineField } from '../../shared/primitives'
import { useCanvasEdit } from '../../shared/CanvasEditContext'
import type { Invoice } from '../../../types/invoice'

interface FreeformFooterBlockProps {
  invoice: Pick<Invoice, 'sections' | 'paymentTerms' | 'bankDetails' | 'notes'>
}

/**
 * Payment terms / bank details / notes, combined into one block like every
 * other layout. Deliberately does NOT use `hasFooterContent()` to decide
 * whether to render — that helper requires a toggle to be on *and* have
 * content, which is right for read-only layouts but creates a chicken-and-
 * egg bug here: toggle "Notes" on with nothing typed yet, and the block
 * would never render, so there'd be no way to click into it to start
 * typing. The caller (FreeformTemplate) gates the whole block on any
 * section toggle being on regardless of content; each field here is gated
 * only on its own toggle, independent of the others.
 */
export function FreeformFooterBlock({ invoice }: FreeformFooterBlockProps) {
  const edit = useCanvasEdit()
  const readOnly = !edit

  return (
    <div className="space-y-2 text-sm text-slate-500">
      {invoice.sections.paymentTerms && (
        <InlineField
          as="textarea"
          value={invoice.paymentTerms}
          onChange={(v) => edit?.updateField('paymentTerms', v)}
          placeholder="Payment terms"
          readOnly={readOnly}
          ariaLabel="Payment terms"
        />
      )}
      {invoice.sections.bankDetails && (
        <InlineField
          as="textarea"
          value={invoice.bankDetails}
          onChange={(v) => edit?.updateField('bankDetails', v)}
          placeholder="Bank / payment details"
          readOnly={readOnly}
          ariaLabel="Bank details"
        />
      )}
      {invoice.sections.notes && (
        <InlineField
          as="textarea"
          value={invoice.notes}
          onChange={(v) => edit?.updateField('notes', v)}
          placeholder="Notes"
          readOnly={readOnly}
          ariaLabel="Notes"
        />
      )}
    </div>
  )
}
