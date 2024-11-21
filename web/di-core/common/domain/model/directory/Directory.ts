/*
 * @author: tvc12 - Thien Vi
 * @created: 5/30/21, 10:11 PM
 */

import { DashboardId, DDate, DirectoryId, UserId } from '../DefinedType';
import { DirectoryType, UserProfile } from '@core/common/domain/model';
import { DefaultDirectoryId } from '@/screens/directory/views/mydata/DefaultDirectoryId';
import { DirectoryMetadata } from '@core/common/domain/model/directory/directory-metadata/DirectoryMetadata';

export class Directory {
  public id: DirectoryId;
  public name: string;
  public owner?: UserProfile;
  public createdDate: DDate;
  public updatedDate: DDate;
  public ownerId: UserId;
  public parentId: DirectoryId;
  public directoryType: DirectoryType;
  public data?: DirectoryMetadata;
  public dashboardId?: DashboardId;
  public isStarred: boolean;

  constructor(
    id: DirectoryId,
    name: string,
    owner: UserProfile,
    createdDate: DDate,
    ownerId: UserId,
    parentDirectoryId: DirectoryId,
    directoryType: DirectoryType,
    updatedDate: DDate,
    data?: DirectoryMetadata,
    dashboardId?: DashboardId,
    isStar?: boolean
  ) {
    this.id = id;
    this.name = name;
    this.owner = owner;
    this.createdDate = createdDate;
    this.ownerId = ownerId;
    this.parentId = parentDirectoryId;
    this.directoryType = directoryType;
    this.dashboardId = dashboardId;
    this.data = data;
    this.updatedDate = updatedDate;
    this.isStarred = isStar ?? false;
  }

  static fromObject(obj: Directory): Directory {
    const owner = obj.owner ? UserProfile.fromObject(obj.owner) : UserProfile.unknown();
    return new Directory(
      obj.id,
      obj.name,
      owner as UserProfile,
      obj.createdDate,
      obj.ownerId,
      obj.parentId,
      obj.directoryType,
      obj.updatedDate,
      obj?.data ? DirectoryMetadata.fromObject(obj as Directory) : undefined,
      obj.dashboardId,
      obj.isStarred
    );
  }

  static default(directoryType: DirectoryType) {
    return new Directory(-100, '', UserProfile.unknown(), Date.now(), '-1', -1, directoryType, Date.now(), DirectoryMetadata.default(directoryType), -1, false);
  }

  get isUpdateDirectory() {
    return this.id >= DefaultDirectoryId.Trash;
  }
}
