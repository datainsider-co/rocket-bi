import { DirectoryId, DirectoryType, Widget } from '@core/common/domain';

export class CreateQueryRequest {
  public name: string;
  public parentDirectoryId: DirectoryId;
  public directoryType: string;
  public widgets: Widget[];

  constructor(data: any = {}) {
    this.name = data.name || void 0;
    this.parentDirectoryId = data.parentDirectoryId || void 0;
    this.directoryType = DirectoryType.Query;
    this.widgets = data.widgets || [];
  }
}
