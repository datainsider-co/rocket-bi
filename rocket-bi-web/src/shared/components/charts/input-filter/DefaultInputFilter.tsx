/*
 * @author: tvc12 - Thien Vi
 * @created: 1/20/21, 5:26 PM
 */

import { WidgetRenderer } from '@chart/widget-renderer/WidgetRenderer';
import InputFilter from '@chart/input-filter/InputFilter';
import InputSetting from '@/shared/settings/common/InputSetting.vue';
export class DefaultInputFilter implements WidgetRenderer<InputFilter> {
  render(widget: InputFilter, h: any): any {
    const enableTitle = widget.setting.options.title?.enabled ?? true;
    const enableSubTitle = widget.setting.options.subtitle?.enabled ?? true;
    return (
      <div class={widget.containerClass} style={widget.containerStyle}>
        {enableTitle && <div class={widget.titleClass}>{widget.title}</div>}
        {this.renderFilter(widget, h)}
      </div>
    );
  }

  private renderFilter(widget: InputFilter, h: any) {
    return (
      <InputSetting
        id={widget.idAsString}
        value={widget.currentValue}
        suggestions={widget.suggestTexts}
        placeholder={widget.placeHolder}
        type={widget.isNumber ? 'number' : 'text'}
        applyFormatNumber={widget.isNumber}
        onOnChanged={widget.handleFilterChange}
      />
    );
  }
}
