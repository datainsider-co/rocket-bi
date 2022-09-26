import { Widget, Position, DashboardId } from '@core/domain/Model';

export interface WidgetPosition {
  widget: Widget;
  position: Position;
  dashboardId?: DashboardId;
}
