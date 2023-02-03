import { DirectoryId, DirectoryType } from '@core/common/domain/model';

export class CreateDirectoryRequest {
  public name: string;
  public isRemoved: boolean;
  public parentId: DirectoryId;
  public directoryType: DirectoryType;

  constructor(data: any = {}) {
    this.name = data.name || void 0;
    this.isRemoved = data.isRemoved || false;
    this.parentId = data.parentId || void 0;
    this.directoryType = data.directoryType || void 0;
  }
}
