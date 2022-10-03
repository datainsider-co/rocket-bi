import { Widget, Position, DashboardId } from '@core/common/domain/model';

export interface WidgetPosition {
  widget: Widget;
  position: Position;
  dashboardId?: DashboardId;
}
