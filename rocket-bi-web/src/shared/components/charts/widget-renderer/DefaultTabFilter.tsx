/*
 * @author: tvc12 - Thien Vi
 * @created: 1/20/21, 5:26 PM
 */

import { WidgetRenderer } from '@chart/widget-renderer/WidgetRenderer';
import TabFilter from '@chart/TabFilter';
import { StringUtils } from '@/utils/StringUtils';
import { Direction, TabFilterDisplay } from '@/shared';
import TabSelection from '@/shared/components/TabSelection.vue';
import DiSearchInput from '@/shared/components/DiSearchInput.vue';

export class DefaultTabFilter implements WidgetRenderer<TabFilter> {
  render(widget: TabFilter, h: any): any {
    const enableTitle = widget.setting.options.title?.enabled ?? true;
    const title = enableTitle && (
      <div class="filter-chart single-line" title={widget.title} style={widget.titleStyle}>
        {widget.title}
      </div>
    );
    const tab = this.renderTabSelection(widget, h);
    const isDropdown = widget.displayAs === TabFilterDisplay.dropDown;
    const scrollClass = widget.direction === Direction.column ? 'scroll-column' : 'scroll-row';
    if (isDropdown) {
      return (
        <div class={widget.containerClass} style={widget.containerStyle}>
          <div class={widget.infoClass}>{title}</div>
          {tab}
        </div>
      );
    } else {
      return (
        <div class={widget.containerClass} style={widget.containerStyle}>
          <div class={widget.infoClass}>{title}</div>
          {this.renderSearch(widget, h)}
          <vuescroll class={['tab-filter-scroller', scrollClass]} style="position: unset">
            {this.renderTabSelection(widget, h)}
          </vuescroll>
        </div>
      );
    }
  }

  private renderSearch(widget: TabFilter, h: any) {
    const enableSearch = widget.setting.options.search?.enabled ?? true;
    const placeholder = widget.setting.options.search?.placeholder ?? 'Search...';
    return (
      enableSearch && (
        <DiSearchInput
          style="background-color:transparent"
          border
          placeholder={placeholder}
          class="mb-2"
          value={widget.keyword}
          onChange={widget.handleChangeKeyword}
        />
      )
    );
  }

  private renderTitle(widget: TabFilter, h: any) {
    const enableTitle = widget.setting.options.title?.enabled ?? true;
    if (enableTitle) {
      return (
        <div className="filter-chart single-line" title={widget.title} style={widget.titleStyle}>
          {widget.title}
        </div>
      );
    }
    return '';
  }

  private renderSubtitle(widget: TabFilter, h: any) {
    const enableSubTitle = widget.setting.options.subtitle?.enabled ?? true;
    if (!!widget.subTitle && StringUtils.isNotEmpty(widget.subTitle) && enableSubTitle) {
      return <img class={'ml-2'} src={require('@/assets/icon/ic_help.svg')} alt="subtitle" title={widget.subTitle} />;
    }
    return '';
  }

  private renderTabSelection(widget: TabFilter, h: any) {
    return (
      <TabSelection {...{ props: widget.tabSelectionData }} class={widget.filterClass} onSelected={widget.handleItemChanged} style={widget.selectionStyle} />
    );
  }
}
