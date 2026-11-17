import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { createId } from '../lib/id'

/** Most images the library keeps; the oldest drop off. Each is already downscaled, but localStorage is small (~5MB) and shared with the invoice. */
export const MAX_UPLOADS = 24

export interface UploadedImage {
  id: string
  name: string
  /** A downscaled data URL (see `resizeImageFile`). */
  dataUrl: string
}

interface UploadsState {
  items: UploadedImage[]
  /** Adds to the front. Throws if the browser has no storage left for it (and leaves the library as it was). */
  add: (image: Omit<UploadedImage, 'id'>) => UploadedImage
  remove: (id: string) => void
}

/**
 * Images the user has uploaded for reuse — logos, stamps, photos — kept in the
 * browser across invoices, so the Uploads drawer still has them next time.
 * A separate store from the invoice on purpose: it's a personal library, not
 * part of any one document (starting a new invoice must not clear it, and
 * undo must not touch it).
 */
export const useUploadsStore = create<UploadsState>()(
  persist(
    (set, get) => ({
      items: [],

      add: (image) => {
        const item: UploadedImage = { ...image, id: createId('up') }
        const previous = get().items
        try {
          set({ items: [item, ...previous].slice(0, MAX_UPLOADS) })
        } catch {
          // The write to localStorage failed (quota). `persist` has already updated memory, so put it back.
          set({ items: previous })
          throw new Error('There is not enough browser storage left for this image. Remove some uploads and try again.')
        }
        return item
      },

      remove: (id) => set((state) => ({ items: state.items.filter((item) => item.id !== id) })),
    }),
    { name: 'invoice-generator/uploads', partialize: (state) => ({ items: state.items }) },
  ),
)
