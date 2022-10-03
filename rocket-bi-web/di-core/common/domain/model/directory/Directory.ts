/*
 * @author: tvc12 - Thien Vi
 * @created: 5/30/21, 10:11 PM
 */

import { DashboardId, DDate, DirectoryId, UserId } from '../DefinedType';
import { DirectoryType, UserProfile } from '@core/common/domain/model';

export class Directory {
  public id: DirectoryId;
  public name: string;
  public owner: UserProfile;
  public createdDate: DDate;
  public updatedDate: DDate;
  public ownerId: UserId;
  public parentId: DirectoryId;
  public parentDirectory: Directory;
  public directoryType: DirectoryType;
  public dashboardId?: DashboardId;
  public isStarred: boolean;

  constructor(
    id: DirectoryId,
    name: string,
    owner: UserProfile,
    createdDate: DDate,
    ownerId: UserId,
    parentDirectoryId: DirectoryId,
    parentDirectory: Directory,
    directoryType: DirectoryType,
    updatedDate: DDate,
    dashboardId?: DashboardId,
    isStar?: boolean
  ) {
    this.id = id;
    this.name = name;
    this.owner = owner;
    this.createdDate = createdDate;
    this.ownerId = ownerId;
    this.parentId = parentDirectoryId;
    this.parentDirectory = parentDirectory;
    this.directoryType = directoryType;
    this.dashboardId = dashboardId;
    this.updatedDate = updatedDate;
    this.isStarred = isStar ?? false;
  }

  static fromObject(obj: Directory): Directory {
    const parentDirectory = obj.parentDirectory ? Directory.fromObject(obj.parentDirectory) : {};
    const owner = obj.owner ? UserProfile.fromObject(obj.owner) : {};
    return new Directory(
      obj.id,
      obj.name,
      owner as UserProfile,
      obj.createdDate,
      obj.ownerId,
      obj.parentId,
      parentDirectory as Directory,
      obj.directoryType,
      obj.updatedDate,
      obj.dashboardId,
      obj.isStarred
    );
  }
}
