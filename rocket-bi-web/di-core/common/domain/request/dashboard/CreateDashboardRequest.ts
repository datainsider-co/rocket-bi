import { DIMap, Position, Widget, DateFilter, DirectoryId } from '@core/common/domain/model';

export class CreateDashboardRequest {
  name: string;
  parentDirectoryId: DirectoryId;
  mainDateFilter?: DateFilter;
  widgets?: Widget[];
  widgetPositions?: DIMap<Position>;

  constructor(name: string, parentDirectoryId: DirectoryId, mainDateFilter?: DateFilter, widgets?: Widget[], positions?: DIMap<Position>) {
    this.name = name;
    this.parentDirectoryId = parentDirectoryId;
    this.mainDateFilter = mainDateFilter;
    this.widgets = widgets;
    this.widgetPositions = positions;
  }
}
