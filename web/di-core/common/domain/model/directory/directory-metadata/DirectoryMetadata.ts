import { Directory, DirectoryType } from '@core/common/domain';
import { UnsupportedException } from '@core/common/domain/exception/UnsupportedException';
import { DashboardMetaData } from '@core/common/domain/model/directory/directory-metadata/DashboardMetaData';
export abstract class DirectoryMetadata {
  static fromObject(obj: any) {
    switch (obj.directoryType) {
      case DirectoryType.Dashboard:
      case DirectoryType.Query:
        return DashboardMetaData.fromObject(obj);
      default:
        throw new UnsupportedException(`Unsupported DirectoryType ${obj.directoryType}`);
    }
  }

  static default(directoryType: DirectoryType) {
    switch (directoryType) {
      case DirectoryType.Dashboard:
      case DirectoryType.Query:
        return DashboardMetaData.default();
    }
  }
}
