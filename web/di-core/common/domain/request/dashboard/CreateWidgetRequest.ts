import { DashboardId, Position, Widget } from '@core/common/domain/model';

export class CreateWidgetRequest {
  id: DashboardId;
  widget: Widget;
  position: Position;
  constructor(id: DashboardId, widget: Widget, position: Position) {
    this.id = id;
    this.widget = widget;
    this.position = position;
  }
}
