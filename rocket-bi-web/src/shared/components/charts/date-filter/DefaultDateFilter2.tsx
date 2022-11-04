/*
 * @author: tvc12 - Thien Vi
 * @created: 1/20/21, 5:26 PM
 */

import { WidgetRenderer } from '@chart/widget-renderer/WidgetRenderer';
import DateFilter2 from '@chart/date-filter/DateFilter2';
import { StringUtils } from '@/utils/StringUtils';
import DateSelectFilter2 from '@chart/date-filter/DateSelectFilter2.vue';

export class DefaultDateFilter2 implements WidgetRenderer<DateFilter2> {
  render(widget: DateFilter2, h: any): any {
    const enableTitle = (widget.setting.options.title?.enabled ?? true) && (widget.setting.options.title?.text?.length ?? 0) > 0;
    const enableSubTitle = (widget.setting.options.subtitle?.enabled ?? true) && (widget.setting.options.subtitle?.text?.length ?? 0) > 0;
    return (
      <div class={widget.containerClass} style={widget.containerStyle}>
        {(enableTitle || enableSubTitle) && (
          <div class="tab-filter-info">
            {enableTitle && (
              <div class={widget.titleClass} title={widget.title} style={widget.titleStyle}>
                {widget.title}
              </div>
            )}
            {enableSubTitle && this.renderSubtitle(widget, h)}
          </div>
        )}
        {this.renderFilter(widget, h)}
      </div>
    );
  }

  private renderSubtitle(widget: DateFilter2, h: any) {
    if (!!widget.subTitle && StringUtils.isNotEmpty(widget.subTitle)) {
      // eslint-disable-next-line no-console
      return (
        <div class={widget.subtitleClass} style={widget.subtitleStyle}>
          <div>{widget.subTitle}</div>
        </div>
      );
    }
    return <div></div>;
  }

  private renderFilter(widget: DateFilter2, h: any) {
    return <DateSelectFilter2 filterData={widget.filterData} onSelected={widget.handleDatesSelected} />;
  }
}
