/*
 * @author: tvc12 - Thien Vi
 * @created: 1/20/21, 5:26 PM
 */

import { WidgetRenderer } from '@chart/widget-renderer/WidgetRenderer';
import { StringUtils } from '@/utils/StringUtils';
import TreeSelection from '@/shared/components/TreeSelection.vue';
import DiSearchInput from '@/shared/components/DiSearchInput.vue';
import TreeFilter from '@chart/TreeFilter';

export class DefaultTreeFilter implements WidgetRenderer<TreeFilter> {
  render(widget: TreeFilter, h: any): any {
    const enableTitle = widget.setting.options.title?.enabled ?? true;
    const title = enableTitle && (
      <div class="filter-chart single-line" title={widget.title} style={widget.titleStyle}>
        {widget.title}
      </div>
    );
    const scrollClass = 'scroll-column';
    return (
      <div class={widget.containerClass} style={widget.containerStyle}>
        <div class={widget.infoClass}>{title}</div>
        <vuescroll class={['tab-filter-scroller', scrollClass]} style="position: unset">
          <div id={widget.nprocessParentId} class="h-100">
            {this.renderFilter(widget, h)}
          </div>
        </vuescroll>
      </div>
    );
  }

  private renderSearch(widget: TreeFilter, h: any) {
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

  private renderTitle(widget: TreeFilter, h: any) {
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

  private renderSubtitle(widget: TreeFilter, h: any) {
    const enableSubTitle = widget.setting.options.subtitle?.enabled ?? true;
    if (!!widget.subTitle && StringUtils.isNotEmpty(widget.subTitle) && enableSubTitle) {
      return <img class={'ml-2'} src={require('@/assets/icon/ic_help.svg')} alt="subtitle" title={widget.subTitle} />;
    }
    return '';
  }

  private renderFilter(widget: TreeFilter, h: any) {
    return (
      <TreeSelection
        treeData={widget.treeData}
        selectedKeys={widget.selectedKeys}
        expandedKeys={widget.expandedKeys}
        isSingleChoice={widget.isSingleChoice}
        options={widget.options}
        onCheck={widget.onCheck}
        onExpand={widget.onExpand}
        onSelect={widget.onCheck}
      />
    );
  }
}
