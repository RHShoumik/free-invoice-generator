import { LABEL_TITLES } from '../../lib/labels'
import type { LabelKey, Party } from '../../types/invoice'

/**
 * A piece of the invoice the user can click to change.
 *
 * Text is edited *in place* on the page (see `ItemText`):
 *  - `label`   a printed label ("Issue Date", "Total"…). `fallback` is the
 *              layout's own wording, which only the clicked text knows — it
 *              prints until the user types something of their own.
 *  - `field`   a value with no editor of its own: the invoice number, and the
 *              notes / payment terms / bank details paragraphs.
 *  - `party`   one line of the business or client that a layout prints in its
 *              own markup rather than through `PartyBlock` (a colored strip).
 *
 * Pictures open the left item drawer (see `ItemDrawer`):
 *  - `image`   an Image element added to the page.
 *  - `watermark` the Watermark design's watermark picture.
 */
export type ItemTarget =
  | { kind: 'label'; key: LabelKey; fallback: string }
  | { kind: 'field'; field: 'invoiceNumber' | 'notes' | 'paymentTerms' | 'bankDetails' }
  | { kind: 'party'; which: 'from' | 'to'; field: 'name' | 'address' | 'email' | 'phone' | 'taxId' }
  | { kind: 'image'; elementId: string }
  | { kind: 'watermark' }

/** The targets that are text edited in place on the page. */
export type TextTarget = Extract<ItemTarget, { kind: 'label' | 'field' | 'party' }>

/** The targets that are pictures, edited in the left drawer. */
export type PictureTarget = Extract<ItemTarget, { kind: 'image' | 'watermark' }>

/** A stable name for a target: the `data-item` on the clickable text, and what the drawer is keyed by. */
export function itemKey(target: ItemTarget): string {
  switch (target.kind) {
    case 'label':
      return `label:${target.key}`
    case 'field':
      return `field:${target.field}`
    case 'party':
      return `party:${target.which}.${target.field}`
    case 'image':
      return `image:${target.elementId}`
    case 'watermark':
      return 'watermark'
  }
}

const FIELD_TITLES = {
  invoiceNumber: 'Invoice number',
  notes: 'Notes',
  paymentTerms: 'Payment terms',
  bankDetails: 'Bank details',
} as const

const PARTY_TITLES = { from: 'From', to: 'Bill to' } as const
const PARTY_FIELD_TITLES: Record<keyof Party, string> = {
  name: 'name',
  address: 'address',
  email: 'email',
  phone: 'phone',
  taxId: 'tax ID',
}

/** What a person would call the target — its accessible name while it is being edited ("Issue date label", "From address"). */
export function itemTitle(target: ItemTarget): string {
  switch (target.kind) {
    case 'label':
      return `${LABEL_TITLES[target.key]} label`
    case 'field':
      return FIELD_TITLES[target.field]
    case 'party':
      return `${PARTY_TITLES[target.which]} ${PARTY_FIELD_TITLES[target.field]}`
    case 'image':
      return 'Image'
    case 'watermark':
      return 'Watermark'
  }
}
