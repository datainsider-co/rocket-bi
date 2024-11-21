import { Component, Inject, Vue } from 'vue-property-decorator';
import { WidgetRenderer } from '@chart/widget-renderer';
import { ChartInfo, Condition, ExportType, FilterRequest, TableColumn, ValueControlType, WidgetId } from '@core/common/domain';
import { SelectOption } from '@/shared';
import { _ThemeStore } from '@/store/modules/ThemeStore';
import { ColorUtils } from '@/utils';

/**
 * @deprecated will remove as soon as
 */
export interface Zoomable {
  isHorizontalZoomIn(): boolean;

  isHorizontalZoomOut(): boolean;
}

// @ts-ignore
@Component
export abstract class BaseWidget extends Vue {
  protected abstract renderer: WidgetRenderer<BaseWidget>;

  abstract resize(): void;

  abstract export(type: ExportType): Promise<void>;

  @Inject({ default: void 0 })
  readonly onChangeDynamicFunction?: (tableColumns: TableColumn[]) => Promise<void>;

  @Inject({ default: void 0 })
  readonly getCurrentValues?: (id: WidgetId) => string[];

  /**
   * Apply direct filter value, force render related widget
   */
  @Inject({ default: () => Promise.resolve() })
  readonly applyDirectCrossFilter!: (valueMap: Map<ValueControlType, string[]> | undefined) => Promise<void>;

  /**
   * method apply filter, if filterRequest is undefined will remove filter otherwise apply filter
   * if valueMap is undefined will remove cross filter otherwise apply cross filter
   */
  @Inject({ default: () => Promise.resolve() })
  readonly applyFilterRequest!: (data: { filterRequest?: FilterRequest; filterValueMap?: Map<ValueControlType, string[]> }) => Promise<void>;

  @Inject({ default: () => Promise.resolve() })
  readonly saveChart!: (chartInfo: ChartInfo) => Promise<void>;

  render(h: any): any {
    return this.renderer.render(this, h);
  }

  updateChart(chartInfo: ChartInfo) {
    // FIXME: handle update chart when chart info change
  }

  get baseThemeColor(): string {
    return _ThemeStore.baseDashboardTheme;
  }

  abstract copyToAssistant(): Promise<void>;

  abstract summarize(): Promise<void>;
}
