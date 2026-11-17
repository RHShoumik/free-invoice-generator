import { DEFAULT_STROKE_COLOR, DEFAULT_STROKE_WIDTH } from '../../lib/drawing'
import type { DrawingFill, DrawingTool } from '../../types/invoice'

/** What the next thing drawn will look like. Kept by the editor between visits to draw mode. */
export interface DrawSettings {
  tool: DrawingTool
  color: string
  strokeWidth: number
  fill: DrawingFill
}

export const DEFAULT_DRAW_SETTINGS: DrawSettings = {
  tool: 'pencil',
  color: DEFAULT_STROKE_COLOR,
  strokeWidth: DEFAULT_STROKE_WIDTH,
  fill: 'none',
}

/** Only these have an inside to fill. */
export const canFill = (tool: DrawingTool) => tool === 'rectangle' || tool === 'ellipse'
