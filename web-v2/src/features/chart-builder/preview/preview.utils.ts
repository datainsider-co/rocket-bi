import { chartSizeOf } from '@/core/chart-builder/chartWidget';
import type { JsonObject } from '@/core/json/json';

/** v1 `PreviewPanel`: a grid column is 27.5px wide in the preview, a row 32px tall, and the card gives up 16px of each. */
const CELL_WIDTH = 27.5;
const CELL_HEIGHT = 32;
const CARD_GAP = 16;

/** The preview card's size in pixels: the size the chart gets when added to a dashboard (v1 `chartHolderStyle`). */
export function previewCardSize(setting: JsonObject): { width: number; height: number } {
  const [columns, rows] = chartSizeOf(setting);
  return { width: columns * CELL_WIDTH - CARD_GAP, height: rows * CELL_HEIGHT - CARD_GAP };
}
