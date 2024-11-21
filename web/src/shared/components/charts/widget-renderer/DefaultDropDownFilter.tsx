/*
 * @author: tvc12 - Thien Vi
 * @created: 1/20/21, 5:26 PM
 */

import { WidgetRenderer } from '@chart/widget-renderer/WidgetRenderer';
import DropdownFilter from '@chart/DropdownFilter';
import { IdGenerator } from '@/utils/IdGenerator';
import DiDropdown from '@/shared/components/common/di-dropdown/DiDropdown';

/**
 * @deprecated
 */
export class DefaultDropDownFilter implements WidgetRenderer<DropdownFilter> {
  render(widget: DropdownFilter, h: any): any {
    return (
      <DiDropdown
        data={widget.dropdownOptions}
        // @ts-ignore
        id={IdGenerator.generateDropdownId('dropdown-filter', widget.id)}
        // @ts-ignore
        valueProps={widget.valueProps}
        class={widget.filterClass}
        label-props={widget.labelProps}
        onSelected={widget.handleFilterChanged}
        value={widget.currentValue}
        style={widget.colorStyle}
        appendAtRoot={true}></DiDropdown>
    );
  }
}
