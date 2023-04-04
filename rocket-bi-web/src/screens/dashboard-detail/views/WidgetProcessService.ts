import { ChartInfo, ChartInfoType, DynamicValues, FunctionControl, TextWidget, Widget } from '@core/common/domain';
import { DashboardControllerModule, FilterModule } from '@/screens/dashboard-detail/stores';
import { isEqual } from 'lodash';

// export abstract class WidgetProcessService {
//   abstract async onAdd(widget: Widget): Promise<void>;
//
//   abstract async onUpdate(widget: Widget): Promise<void>;
// }

export class ChartProcessor {
  handlers: ChartHandler[];

  constructor(handler: ChartHandler[]) {
    this.handlers = handler;
  }

  async onAdd(widget: ChartInfo) {
    const handler = this.handlers.find(handle => handle.canHandle(widget));
    return handler ? handler.onAdd(widget) : Promise.resolve();
  }

  async onUpdate(widget: ChartInfo) {
    const handler = this.handlers.find(handle => handle.canHandle(widget));
    return handler ? handler.onUpdate(widget) : Promise.resolve();
  }
}

export abstract class ChartHandler {
  abstract canHandle(widget: ChartInfo): boolean;

  abstract async onUpdate(widget: ChartInfo): Promise<void>;

  abstract async onAdd(widget: ChartInfo): Promise<void>;
}

export class DynamicValuesChartHandler extends ChartHandler {
  canHandle(widget: ChartInfo): boolean {
    return widget.getChartInfoType() === ChartInfoType.dynamicValues;
  }

  async onAdd(widget: ChartInfo): Promise<void> {
    await DashboardControllerModule.setDynamicValues({ id: widget.id, values: ((widget.setting as any) as DynamicValues).getDefaultValues() });
  }

  async onUpdate(widget: ChartInfo): Promise<void> {
    const currentFilterValues = DashboardControllerModule.dynamicFilter.get(widget.id);
    const updateFilterValues = ((widget.setting as any) as DynamicValues).getDefaultValues();
    if (!isEqual(currentFilterValues, updateFilterValues)) {
      await DashboardControllerModule.replaceDynamicValues({ widget: widget, values: updateFilterValues, apply: true });
    }
  }
}

export class DynamicFunctionChartHandler extends ChartHandler {
  canHandle(widget: ChartInfo): boolean {
    return widget.getChartInfoType() === ChartInfoType.dynamicFunction;
  }

  async onAdd(widget: ChartInfo): Promise<void> {
    await DashboardControllerModule.replaceDynamicFunction({
      widget: widget,
      selected: ((widget.setting as any) as FunctionControl).getDefaultFunctions(),
      apply: true
    });
  }

  async onUpdate(widget: ChartInfo): Promise<void> {
    const defaultColumns = DashboardControllerModule.dynamicFunctions.get(widget.id);
    const updateDefaultColumns = ((widget.setting as any) as FunctionControl).getDefaultFunctions();
    if (!isEqual(defaultColumns, updateDefaultColumns)) {
      await DashboardControllerModule.replaceDynamicFunction({ widget: widget, selected: updateDefaultColumns, apply: true });
    }
  }
}

export class FilterChartHandler extends ChartHandler {
  canHandle(widget: ChartInfo): boolean {
    return false;
  }

  async onAdd(widget: ChartInfo): Promise<void> {
    await FilterModule.addFilterWidget(widget);
  }

  async onUpdate(widget: ChartInfo): Promise<void> {
    await FilterModule.addFilterWidget(widget);
  }
}

export class NormalChartHandler extends ChartHandler {
  canHandle(widget: ChartInfo): boolean {
    return widget.getChartInfoType() === ChartInfoType.normal;
  }

  async onAdd(widget: ChartInfo): Promise<void> {
    if (widget.setting.hasDynamicFunction) {
      widget.setting.setDynamicFunctions(DashboardControllerModule.dynamicFunctions);
    }
    if (widget.setting.hasDynamicCondition) {
      widget.setting.setDynamicFilter(DashboardControllerModule.dynamicFilter);
    }
  }

  async onUpdate(widget: ChartInfo): Promise<void> {
    widget.setting = widget.setting.hasDynamicFunction ? DashboardControllerModule.updateDynamicFunctionValue(widget.setting) : widget.setting;
    if (widget.setting.hasDynamicFunction) {
      widget.setting.setDynamicFunctions(DashboardControllerModule.dynamicFunctions);
    }
    if (widget.setting.hasDynamicCondition) {
      widget.setting.setDynamicFilter(DashboardControllerModule.dynamicFilter);
    }
  }
}
