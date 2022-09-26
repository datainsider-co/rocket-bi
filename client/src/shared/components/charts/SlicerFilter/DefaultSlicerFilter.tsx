/*
 * @author: tvc12 - Thien Vi
 * @created: 1/20/21, 5:26 PM
 */

import { WidgetRenderer } from '@chart/WidgetRenderer/WidgetRenderer';
import SlicerFilter from '@chart/SlicerFilter/SlicerFilter';
import { StringUtils } from '@/utils/string.utils';
import NumberSlicer from '@chart/SlicerFilter/NumberSlicer.vue';

export class DefaultSlicerFilter implements WidgetRenderer<SlicerFilter> {
  render(widget: SlicerFilter, h: any): any {
    const enableTitle = widget.setting.options.title?.enabled ?? true;
    return (
      <div class={widget.containerClass} style={widget.containerStyle}>
        {enableTitle && (
          <div class={widget.titleClass} title={widget.title} style={widget.titleStyle}>
            {widget.title}
          </div>
        )}
        {this.renderSlicer(widget, h)}
      </div>
    );
  }

  private renderSlicer(widget: SlicerFilter, h: any) {
    return (
      <NumberSlicer
        class="input-filter"
        range={widget.range}
        min={widget.min}
        max={widget.max}
        step={widget.setting.options.step}
        isDate={widget.isDate}
        useFormat={widget.useFormat}
        isPreview={widget.isPreview}
        onChange={widget.handleSlicerChanged}
      />
    );
  }
}
