import { Directory } from '@core/common/domain/model';

export class ListParentsResponse {
  // root of user directory
  public rootDirectory: Directory;
  public isAll: boolean;
  public parentDirectories: Directory[];

  constructor(data: any) {
    this.rootDirectory = data.rootDirectory || {};
    this.isAll = data.isAll || false;
    this.parentDirectories = data.parentDirectories || [];
  }
}
