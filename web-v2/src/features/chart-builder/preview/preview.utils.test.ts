import { describe, expect, it } from 'vitest';
import { previewCardSize } from './preview.utils';

describe('previewCardSize', () => {
  it("sizes a series chart's card as v1 did (16 by 10 cells)", () => {
    expect(previewCardSize({ class_name: 'series_chart_setting' })).toEqual({ width: 424, height: 304 });
  });

  it('follows the size of the chart type', () => {
    expect(previewCardSize({ class_name: 'pie_chart_setting' })).toEqual({ width: 259, height: 304 });
    expect(previewCardSize({ class_name: 'number_chart_setting' })).toEqual({ width: 424, height: 240 });
  });

  it('falls back to the default size for an unknown setting', () => {
    expect(previewCardSize({})).toEqual({ width: 424, height: 304 });
  });
});
