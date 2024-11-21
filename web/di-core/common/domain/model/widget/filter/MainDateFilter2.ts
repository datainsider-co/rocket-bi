import { ChartControl, MainDateValueController } from '@core/common/domain';
import { ChartControlData, ChartInfoType, MainDateMode, WidgetId } from '@core/common/domain/model';
import { ChartType } from '@/shared';
import { MainDateFilter } from './MainDateFilter';

export class MainDateFilter2 implements ChartControl {
  static readonly MAIN_DATE_ID: number = -99887766;

  readonly id: WidgetId;
  readonly mode: MainDateMode;

  protected constructor(id: WidgetId, mode: MainDateMode) {
    this.id = id;
    this.mode = mode;
  }

  static fromObject(obj: MainDateFilter2): MainDateFilter2 {
    return new MainDateFilter2(obj.id, obj.mode);
  }

  static fromMainDateFilter(mainDateFilter: MainDateFilter): MainDateFilter2 {
    return new MainDateFilter2(MainDateFilter2.MAIN_DATE_ID, mainDateFilter.mode ?? MainDateMode.allTime);
  }

  static fromMode(mode: MainDateMode): MainDateFilter2 {
    return new MainDateFilter2(MainDateFilter2.MAIN_DATE_ID, mode);
  }

  static default(): MainDateFilter2 {
    return new MainDateFilter2(MainDateFilter2.MAIN_DATE_ID, MainDateMode.allTime);
  }

  getChartControlData(): ChartControlData {
    return {
      id: this.getControlId(),
      chartType: ChartType.DateSelectFilter,
      defaultTableColumns: [],
      tableColumns: [],
      chartInfoType: this.getChartInfoType(),
      displayName: 'Main Date Filter'
    };
  }

  getChartInfoType(): ChartInfoType {
    return ChartInfoType.Normal;
  }

  getControlId(): WidgetId {
    return this.id;
  }

  getValueController(): MainDateValueController {
    return new MainDateValueController(this);
  }

  isEnableControl(): boolean {
    return true;
  }

  copyWith(newData: { id?: WidgetId; mode?: MainDateMode }): MainDateFilter2 {
    return new MainDateFilter2(newData.id ?? this.id, newData.mode ?? this.mode);
  }
}
