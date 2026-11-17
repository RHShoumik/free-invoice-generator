import type { ComponentType } from 'react'
import type { FontId, PagePadding } from '../types/invoice'
import { uniformPadding } from '../types/invoice'
import { ClassicTemplate } from './01-classic/ClassicTemplate'
import { ModernMinimalTemplate } from './02-modern-minimal/ModernMinimalTemplate'
import { BoldGradientTemplate } from './03-bold-gradient/BoldGradientTemplate'
import { CorporateBlueTemplate } from './04-corporate-blue/CorporateBlueTemplate'
import { CreativeAgencyTemplate } from './05-creative-agency/CreativeAgencyTemplate'
import { DarkModeTemplate } from './06-dark-mode/DarkModeTemplate'
import { ElegantSerifTemplate } from './07-elegant-serif/ElegantSerifTemplate'
import { StartupTechTemplate } from './08-startup-tech/StartupTechTemplate'
import { MinimalMonoTemplate } from './09-minimal-mono/MinimalMonoTemplate'
import { ConsultantCleanTemplate } from './10-consultant-clean/ConsultantCleanTemplate'
import { LedgerTemplate } from './11-ledger/LedgerTemplate'
import { BoardingPassTemplate } from './12-boarding-pass/BoardingPassTemplate'
import { EditorialTemplate } from './13-editorial/EditorialTemplate'
import { WatermarkTemplate } from './14-watermark/WatermarkTemplate'
import { SidebarAccentTemplate } from './15-sidebar-accent/SidebarAccentTemplate'
import { PostcardTemplate } from './16-postcard/PostcardTemplate'
import { TimelineTemplate } from './17-timeline/TimelineTemplate'
import { TwoToneSplitTemplate } from './18-two-tone-split/TwoToneSplitTemplate'
import { StampSealTemplate } from './19-stamp-seal/StampSealTemplate'
import { BlueprintTemplate } from './20-blueprint/BlueprintTemplate'
import { FreeformTemplate } from './21-freeform/FreeformTemplate'
import type { InvoiceTemplateProps } from './shared/InvoiceTemplateProps'

export interface TemplateDefinition {
  id: string
  name: string
  description: string
  /** Groups presets that share one Layout component — used by the picker UI to section/group entries. */
  layoutId: string
  /** Sensible starting theme when a user picks this design from the gallery. */
  defaultAccentColor: string
  defaultFont: FontId
  defaultPadding: PagePadding
  component: ComponentType<InvoiceTemplateProps>
}

interface PresetInput {
  /** 'signature' becomes the bare layoutId (kept stable for backward compatibility); anything else becomes `${layoutId}-${suffix}`. */
  suffix: string
  /** Preset display name, e.g. "Forest" — combined with the layout name as "Layout Name — Forest". Ignored for 'signature'. */
  name: string
  accentColor: string
  font?: FontId
  padding?: PagePadding
}

/**
 * One Layout (a hand-built component) is offered as several style Presets —
 * see "Layout × Preset" in docs/ARCHITECTURE.md for why. This is what turns
 * ~20 hand-built components into a 100-entry catalog without 100 hand-built
 * components: each layout contributes one call here with its curated presets.
 */
function buildPresets(
  layoutId: string,
  layoutName: string,
  description: string,
  component: ComponentType<InvoiceTemplateProps>,
  basePadding: PagePadding,
  baseFont: FontId,
  presets: PresetInput[],
): TemplateDefinition[] {
  return presets.map((p) => ({
    id: p.suffix === 'signature' ? layoutId : `${layoutId}-${p.suffix}`,
    name: p.suffix === 'signature' ? layoutName : `${layoutName} — ${p.name}`,
    description,
    layoutId,
    defaultAccentColor: p.accentColor,
    defaultFont: p.font ?? baseFont,
    defaultPadding: p.padding ?? basePadding,
    component,
  }))
}

/**
 * The single extensibility point for new designs. Two ways to contribute:
 *  - A new *preset* of an existing layout: add one object to that layout's
 *    `buildPresets(...)` call below. Cheap, no new component needed.
 *  - A whole new *layout*: create a folder under src/templates/, build a
 *    component that implements InvoiceTemplateProps, then add a new
 *    `buildPresets(...)` block here with its own presets.
 * See docs/ADDING_A_TEMPLATE.md.
 */
export const TEMPLATES: TemplateDefinition[] = [
  ...buildPresets(
    'classic',
    'Classic',
    'Traditional centered header with ruled sections — familiar and safe.',
    ClassicTemplate,
    uniformPadding(56),
    'inter',
    [
      { suffix: 'signature', name: 'Royal Blue', accentColor: '#1d4ed8' },
      { suffix: 'forest', name: 'Forest', accentColor: '#15803d' },
      { suffix: 'wine', name: 'Wine', accentColor: '#9f1239' },
      { suffix: 'slate', name: 'Slate', accentColor: '#334155' },
      { suffix: 'amber', name: 'Amber', accentColor: '#b45309' },
    ],
  ),
  ...buildPresets(
    'modern-minimal',
    'Modern Minimal',
    'Generous whitespace, thin dividers, small-caps labels.',
    ModernMinimalTemplate,
    uniformPadding(64),
    'inter',
    [
      { suffix: 'signature', name: 'Ink', accentColor: '#0f172a' },
      { suffix: 'sage', name: 'Sage', accentColor: '#4d7c62' },
      { suffix: 'blush', name: 'Blush', accentColor: '#be5a83' },
      { suffix: 'ocean', name: 'Ocean', accentColor: '#0e7490' },
      { suffix: 'charcoal', name: 'Charcoal', accentColor: '#57534e' },
    ],
  ),
  ...buildPresets(
    'bold-gradient',
    'Bold Gradient',
    'Full-width gradient header band that puts your brand color front and center.',
    BoldGradientTemplate,
    uniformPadding(56),
    'plus-jakarta-sans',
    [
      { suffix: 'signature', name: 'Violet', accentColor: '#7c3aed' },
      { suffix: 'sunset', name: 'Sunset', accentColor: '#ea580c' },
      { suffix: 'ocean', name: 'Ocean', accentColor: '#0891b2' },
      { suffix: 'berry', name: 'Berry', accentColor: '#db2777' },
      { suffix: 'midnight', name: 'Midnight', accentColor: '#1e3a8a' },
    ],
  ),
  ...buildPresets(
    'corporate-blue',
    'Corporate Blue',
    'Structured, boxed sections with a banded header — formal and financial.',
    CorporateBlueTemplate,
    uniformPadding(56),
    'inter',
    [
      { suffix: 'signature', name: 'Navy', accentColor: '#0b3d91' },
      { suffix: 'emerald', name: 'Emerald', accentColor: '#065f46' },
      { suffix: 'burgundy', name: 'Burgundy', accentColor: '#7f1d1d' },
      { suffix: 'graphite', name: 'Graphite', accentColor: '#1e293b' },
      { suffix: 'teal', name: 'Teal', accentColor: '#0f766e' },
    ],
  ),
  ...buildPresets(
    'creative-agency',
    'Creative Agency',
    'Asymmetric layout with oversized type — for design and creative studios.',
    CreativeAgencyTemplate,
    uniformPadding(56),
    'plus-jakarta-sans',
    [
      { suffix: 'signature', name: 'Rose', accentColor: '#f43f5e' },
      { suffix: 'lime', name: 'Lime', accentColor: '#65a30d' },
      { suffix: 'cobalt', name: 'Cobalt', accentColor: '#2563eb' },
      { suffix: 'tangerine', name: 'Tangerine', accentColor: '#ea580c' },
      { suffix: 'grape', name: 'Grape', accentColor: '#7c3aed' },
    ],
  ),
  ...buildPresets(
    'dark-mode',
    'Dark Mode',
    'Dark canvas with a bright accent — a modern, tech-forward look.',
    DarkModeTemplate,
    uniformPadding(56),
    'inter',
    [
      { suffix: 'signature', name: 'Cyan', accentColor: '#22d3ee' },
      { suffix: 'neon-green', name: 'Neon Green', accentColor: '#4ade80' },
      { suffix: 'magenta', name: 'Magenta', accentColor: '#f472b6' },
      { suffix: 'amber', name: 'Amber', accentColor: '#fbbf24' },
      { suffix: 'violet', name: 'Violet', accentColor: '#a78bfa' },
    ],
  ),
  ...buildPresets(
    'elegant-serif',
    'Elegant Serif',
    'Ivory background, serif display type, thin gold rules — boutique and refined.',
    ElegantSerifTemplate,
    uniformPadding(64),
    'playfair-display',
    [
      { suffix: 'signature', name: 'Gold', accentColor: '#a16207' },
      { suffix: 'rose-quartz', name: 'Rose Quartz', accentColor: '#b76e79' },
      { suffix: 'sage', name: 'Sage', accentColor: '#6b7f5e' },
      { suffix: 'champagne', name: 'Champagne', accentColor: '#a8935f' },
      { suffix: 'charcoal', name: 'Charcoal', accentColor: '#44403c' },
    ],
  ),
  ...buildPresets(
    'startup-tech',
    'Startup / Tech',
    'Rounded cards, soft shadows, friendly bright accent — product-company feel.',
    StartupTechTemplate,
    uniformPadding(48),
    'plus-jakarta-sans',
    [
      { suffix: 'signature', name: 'Indigo', accentColor: '#6366f1' },
      { suffix: 'mint', name: 'Mint', accentColor: '#10b981' },
      { suffix: 'coral', name: 'Coral', accentColor: '#fb7185' },
      { suffix: 'sky', name: 'Sky', accentColor: '#0ea5e9' },
      { suffix: 'sunshine', name: 'Sunshine', accentColor: '#f59e0b' },
    ],
  ),
  ...buildPresets(
    'minimal-mono',
    'Minimal Mono',
    'Monospace type throughout — a developer / indie-hacker aesthetic.',
    MinimalMonoTemplate,
    uniformPadding(56),
    'jetbrains-mono',
    [
      { suffix: 'signature', name: 'Terminal Green', accentColor: '#16a34a' },
      { suffix: 'amber', name: 'Amber', accentColor: '#d97706' },
      { suffix: 'cyan', name: 'Cyan', accentColor: '#0891b2' },
      { suffix: 'magenta', name: 'Magenta', accentColor: '#c026d3' },
      { suffix: 'blue', name: 'Blue', accentColor: '#2563eb' },
    ],
  ),
  ...buildPresets(
    'consultant-clean',
    'Consultant Clean',
    'Plain, left-aligned, letter-style layout — high readability, minimal color.',
    ConsultantCleanTemplate,
    uniformPadding(64),
    'inter',
    [
      { suffix: 'signature', name: 'Slate', accentColor: '#334155' },
      { suffix: 'ink', name: 'Ink', accentColor: '#1e293b' },
      { suffix: 'forest', name: 'Forest', accentColor: '#166534' },
      { suffix: 'burgundy', name: 'Burgundy', accentColor: '#881337' },
      { suffix: 'bronze', name: 'Bronze', accentColor: '#92400e' },
    ],
  ),
  ...buildPresets(
    'ledger',
    'Ledger',
    'Ruled accounting-ledger lines throughout — a "paper ledger book" feel.',
    LedgerTemplate,
    uniformPadding(56),
    'jetbrains-mono',
    [
      { suffix: 'signature', name: 'Ledger Green', accentColor: '#2d6a4f' },
      { suffix: 'ink', name: 'Ink Blue', accentColor: '#1e3a8a' },
      { suffix: 'rust', name: 'Rust', accentColor: '#9a3412' },
      { suffix: 'charcoal', name: 'Charcoal', accentColor: '#292524' },
      { suffix: 'burgundy', name: 'Burgundy', accentColor: '#7f1d1d' },
    ],
  ),
  ...buildPresets(
    'boarding-pass',
    'Boarding Pass',
    'Ticket-stub layout with a perforated divider — for a fun, memorable invoice.',
    BoardingPassTemplate,
    uniformPadding(48),
    'plus-jakarta-sans',
    [
      { suffix: 'signature', name: 'Airline Blue', accentColor: '#0f4c81' },
      { suffix: 'sunset', name: 'Sunset', accentColor: '#ea580c' },
      { suffix: 'emerald', name: 'Emerald', accentColor: '#059669' },
      { suffix: 'crimson', name: 'Crimson', accentColor: '#be123c' },
      { suffix: 'violet', name: 'Violet', accentColor: '#7c3aed' },
    ],
  ),
  ...buildPresets(
    'editorial',
    'Editorial',
    'Newspaper-masthead nameplate and rules — a bold editorial statement.',
    EditorialTemplate,
    uniformPadding(64),
    'playfair-display',
    [
      { suffix: 'signature', name: 'Headline Red', accentColor: '#b91c1c' },
      { suffix: 'navy', name: 'Navy', accentColor: '#1e3a8a' },
      { suffix: 'forest', name: 'Forest', accentColor: '#166534' },
      { suffix: 'mustard', name: 'Mustard', accentColor: '#a16207' },
      { suffix: 'charcoal', name: 'Charcoal', accentColor: '#292524' },
    ],
  ),
  ...buildPresets(
    'watermark',
    'Watermark',
    'A large faint background watermark behind a clean modern foreground.',
    WatermarkTemplate,
    uniformPadding(56),
    'inter',
    [
      { suffix: 'signature', name: 'Indigo', accentColor: '#4338ca' },
      { suffix: 'slate', name: 'Slate', accentColor: '#334155' },
      { suffix: 'teal', name: 'Teal', accentColor: '#0f766e' },
      { suffix: 'rose', name: 'Rose', accentColor: '#be123c' },
      { suffix: 'amber', name: 'Amber', accentColor: '#b45309' },
    ],
  ),
  ...buildPresets(
    'sidebar-accent',
    'Sidebar Accent',
    'A solid-color vertical sidebar holds your identity; content flows beside it.',
    SidebarAccentTemplate,
    uniformPadding(48),
    'plus-jakarta-sans',
    [
      { suffix: 'signature', name: 'Teal', accentColor: '#0f766e' },
      { suffix: 'indigo', name: 'Indigo', accentColor: '#4338ca' },
      { suffix: 'maroon', name: 'Maroon', accentColor: '#7f1d1d' },
      { suffix: 'charcoal', name: 'Charcoal', accentColor: '#1e293b' },
      { suffix: 'coral', name: 'Coral', accentColor: '#ea580c' },
    ],
  ),
  ...buildPresets(
    'postcard',
    'Postcard',
    'A dashed card border and a playful stamp-style total badge.',
    PostcardTemplate,
    uniformPadding(40),
    'plus-jakarta-sans',
    [
      { suffix: 'signature', name: 'Coral', accentColor: '#f97316' },
      { suffix: 'turquoise', name: 'Turquoise', accentColor: '#0891b2' },
      { suffix: 'grape', name: 'Grape', accentColor: '#7c3aed' },
      { suffix: 'sunshine', name: 'Sunshine', accentColor: '#eab308' },
      { suffix: 'berry', name: 'Berry', accentColor: '#db2777' },
    ],
  ),
  ...buildPresets(
    'timeline',
    'Timeline',
    'Line items as a vertical dotted timeline instead of a table.',
    TimelineTemplate,
    uniformPadding(56),
    'inter',
    [
      { suffix: 'signature', name: 'Indigo', accentColor: '#4f46e5' },
      { suffix: 'emerald', name: 'Emerald', accentColor: '#059669' },
      { suffix: 'sky', name: 'Sky', accentColor: '#0284c7' },
      { suffix: 'amber', name: 'Amber', accentColor: '#d97706' },
      { suffix: 'rose', name: 'Rose', accentColor: '#e11d48' },
    ],
  ),
  ...buildPresets(
    'two-tone-split',
    'Two-Tone Split',
    'The page splits into two vertical color blocks — a bold graphic statement.',
    TwoToneSplitTemplate,
    uniformPadding(56),
    'plus-jakarta-sans',
    [
      { suffix: 'signature', name: 'Electric Blue', accentColor: '#2563eb' },
      { suffix: 'emerald', name: 'Emerald', accentColor: '#059669' },
      { suffix: 'crimson', name: 'Crimson', accentColor: '#be123c' },
      { suffix: 'violet', name: 'Violet', accentColor: '#7c3aed' },
      { suffix: 'amber', name: 'Amber', accentColor: '#d97706' },
    ],
  ),
  ...buildPresets(
    'stamp-seal',
    'Stamp & Seal',
    'Formal parchment feel with a circular seal badge near the total.',
    StampSealTemplate,
    uniformPadding(64),
    'dm-serif-display',
    [
      { suffix: 'signature', name: 'Wax Red', accentColor: '#7f1d1d' },
      { suffix: 'navy', name: 'Navy', accentColor: '#1e3a8a' },
      { suffix: 'forest', name: 'Forest', accentColor: '#166534' },
      { suffix: 'gold', name: 'Gold', accentColor: '#a16207' },
      { suffix: 'charcoal', name: 'Charcoal', accentColor: '#292524' },
    ],
  ),
  ...buildPresets(
    'blueprint',
    'Blueprint',
    'Technical engineering-drawing aesthetic with a subtle grid background.',
    BlueprintTemplate,
    uniformPadding(48),
    'jetbrains-mono',
    [
      { suffix: 'signature', name: 'Blueprint Blue', accentColor: '#1e40af' },
      { suffix: 'slate', name: 'Slate', accentColor: '#334155' },
      { suffix: 'rust', name: 'Rust', accentColor: '#9a3412' },
      { suffix: 'forest', name: 'Forest', accentColor: '#166534' },
      { suffix: 'graphite', name: 'Graphite', accentColor: '#1c1917' },
    ],
  ),
  ...buildPresets(
    'freeform',
    'Freeform Canvas',
    'Drag, resize, and edit every section directly on the page.',
    FreeformTemplate,
    uniformPadding(48),
    'inter',
    [
      { suffix: 'signature', name: 'Ink', accentColor: '#2563eb' },
      { suffix: 'forest', name: 'Forest', accentColor: '#15803d' },
      { suffix: 'wine', name: 'Wine', accentColor: '#9f1239' },
      { suffix: 'slate', name: 'Slate', accentColor: '#334155' },
      { suffix: 'amber', name: 'Amber', accentColor: '#b45309' },
    ],
  ),
]

export function getTemplate(id: string): TemplateDefinition {
  return TEMPLATES.find((t) => t.id === id) ?? TEMPLATES[0]
}

/** Layout groups in registry order, for UI that sections the picker by layout. */
export function getLayoutGroups(): { layoutId: string; layoutName: string; presets: TemplateDefinition[] }[] {
  const groups: { layoutId: string; layoutName: string; presets: TemplateDefinition[] }[] = []
  for (const t of TEMPLATES) {
    const signatureName = t.name.split(' — ')[0]
    let group = groups.find((g) => g.layoutId === t.layoutId)
    if (!group) {
      group = { layoutId: t.layoutId, layoutName: signatureName, presets: [] }
      groups.push(group)
    }
    group.presets.push(t)
  }
  return groups
}
