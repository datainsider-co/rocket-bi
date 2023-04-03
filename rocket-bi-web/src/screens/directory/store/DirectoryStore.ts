/*
 * @author: tvc12 - Thien Vi
 * @created: 2/4/21, 2:28 PM
 */

import { Action, getModule, Module, Mutation, VuexModule } from 'vuex-module-decorators';
import { DashboardService, DirectoryService } from '@core/common/services';
import { Dashboard, Directory, DirectoryId } from '@core/common/domain/model';
import { CreateDashboardRequest, CreateDirectoryRequest, DirectoryPagingRequest } from '@core/common/domain/request';
import { ListParentsResponse } from '@core/common/domain/response';
import { Breadcrumbs } from '@/shared/models';
import { Routers } from '@/shared/enums/Routers';
import { LoaderModule } from '@/store/modules/LoaderStore';
import router from '@/router/Router';
import { ClassProfiler, MethodProfiler } from '@/shared/profiler/Annotation';
import store from '@/store';
import { DIException } from '@core/common/domain/exception';
import { ResourceType } from '@/utils/PermissionUtils';
import { Log } from '@core/utils';
import { BreadcrumbMode, BreadCrumbUtils } from '@/utils/BreadCrumbUtils';
import { Status } from '@/shared';
import { Di } from '@core/common/modules';
import { RouterUtils } from '@/utils/RouterUtils';
import { TrackingUtils } from '@core/tracking/TrackingUtils';
import { TrackEvents } from '@core/tracking/enum/TrackEvents';

@Module({ store, name: 'directoryStore', dynamic: true, namespaced: true })
@ClassProfiler({ prefix: 'DirectoryStore', getIncluded: false })
export default class DirectoryStore extends VuexModule {
  // state
  public directories: Directory[] = [];
  public parents: ListParentsResponse | null = null;
  public errorMessage = '';
  public screenName = '';
  public status = Status.Loading;

  private static getDirectoryService(): DirectoryService {
    return Di.get(DirectoryService);
  }

  private static getDashboardService(): DashboardService {
    return Di.get(DashboardService);
  }

  get getBreadcrumbs(): Breadcrumbs[] {
    if (!this.parents) {
      return [];
    }
    const breadcrumbMode = BreadCrumbUtils.getBreadcrumbMode(this.parents);
    switch (breadcrumbMode) {
      case BreadcrumbMode.Fully:
        return BreadCrumbUtils.getFullyBreadcrumbs(this.parents, this.screenName);
      case BreadcrumbMode.Shortly:
        return BreadCrumbUtils.getShortlyBreadcrumbs(this.parents, this.screenName);
    }
  }

  @Mutation
  public setDirectories(directories: Directory[]): void {
    this.directories = directories;
  }

  @Mutation
  public setScreenName(name: string): void {
    this.screenName = name;
  }

  @Mutation
  public setParents(parents: ListParentsResponse | null): void {
    this.parents = parents;
  }

  // actions
  @MethodProfiler({ prefix: 'DirectoryStore', name: 'getDirectoryList' })
  @Action({ rawError: true })
  async list(payload: { directoryId: any; sort: DirectoryPagingRequest }): Promise<void> {
    LoaderModule.startLoading();
    try {
      const directories = await DirectoryStore.getDirectoryService().list(payload.directoryId, payload.sort);
      this.setDirectories(directories);
    } catch (ex) {
      Log.debug('render error', ex);
      this.renderError(ex);
    } finally {
      LoaderModule.finishLoading();
    }
  }

  // actions
  @MethodProfiler({ prefix: 'DirectoryStore', name: 'getDirectoryList' })
  @Action({ rawError: true })
  async listSharedWithMe(payload: { directoryId: any; sort: DirectoryPagingRequest }): Promise<void> {
    LoaderModule.startLoading();
    try {
      const directories = await DirectoryStore.getDirectoryService().listSharedWithMe(payload.directoryId, payload.sort);
      this.setDirectories(directories);
    } catch (ex) {
      Log.debug('render error', ex);
      this.renderError(ex);
    } finally {
      LoaderModule.finishLoading();
    }
  }

  @Action({ rawError: true })
  async createFolder(payload: CreateDirectoryRequest): Promise<Directory> {
    try {
      const directory = await DirectoryStore.getDirectoryService().create(payload);
      TrackingUtils.track(TrackEvents.CreateFolderOk, {
        directory_id: directory.id,
        parent_directory_id: payload.parentId,
        folder_name: payload.name
      });
      return directory;
    } catch (error) {
      Log.debug('create Folder Error');
      TrackingUtils.track(TrackEvents.CreateFolderFail, {
        directory_id: 0,
        parent_directory_id: payload.parentId,
        folder_name: payload.name,
        error: error.message
      });
      throw DIException.fromObject(error);
    }
  }

  @Action({ rawError: true })
  async createDashboard(request: CreateDashboardRequest): Promise<Dashboard> {
    try {
      const dashboard = await DirectoryStore.getDashboardService().create(request);
      TrackingUtils.track(TrackEvents.CreateDashboardOk, {
        dashboard_id: dashboard.id,
        dashboard_name: dashboard.name,
        parent_directory_id: request.parentDirectoryId,
        dashboard_type: request.directoryType
      });
      return dashboard;
    } catch (error) {
      TrackingUtils.track(TrackEvents.CreateDashboardFail, {
        dashboard_name: request.name,
        error: error.message,
        parent_directory_id: request.parentDirectoryId,
        dashboard_type: request.directoryType
      });
      throw DIException.fromObject(error);
    }
  }

  @Action({ rawError: true })
  async renameFolder(payload: { id: number; name: string; oldName: string }) {
    const { id, name, oldName } = payload;
    try {
      const result = await DirectoryStore.getDirectoryService().rename(id, name);
      this.handleRename({ id: id, name: name, resourceType: ResourceType.directory });
      if (result) {
        TrackingUtils.track(TrackEvents.RenameFolderOk, {
          directory_id: id,
          folder_old_name: oldName,
          folder_new_name: name
        });
      } else {
        TrackingUtils.track(TrackEvents.RenameFolderFail, {
          directory_id: id,
          folder_old_name: oldName,
          folder_new_name: name,
          error: 'rename folder fail'
        });
      }
    } catch (error) {
      TrackingUtils.track(TrackEvents.RenameFolderFail, {
        directory_id: id,
        folder_old_name: oldName,
        folder_new_name: name,
        error: error.message
      });
      throw DIException.fromObject(error);
    }
  }

  @Action({ rawError: true })
  async renameDashboard(payload: { id: number; name: string; oldName: string }) {
    const { id, name: newName, oldName } = payload;
    try {
      const result = await DirectoryStore.getDashboardService().rename(id, newName);
      this.handleRename({ id: id, name: newName, resourceType: ResourceType.dashboard });
      if (result) {
        TrackingUtils.track(TrackEvents.RenameDashboardOk, {
          directory_id: id,
          dashboard_old_name: oldName,
          dashboard_new_name: name
        });
      } else {
        TrackingUtils.track(TrackEvents.RenameDashboardFail, {
          directory_id: id,
          directory_old_name: oldName,
          directory_new_name: name,
          error: 'rename dashboard fail'
        });
      }
    } catch (error) {
      TrackingUtils.track(TrackEvents.RenameDashboardFail, {
        directory_id: id,
        dashboard_old_name: oldName,
        dashboard_new_name: name,
        error: error.message
      });
      throw DIException.fromObject(error);
    }
  }

  @Action
  async handleRename(payload: { id: number; name: string; resourceType: ResourceType }) {
    const updatedDirectories = [...this.directories];
    const updatedIndex = await this.getDirectoryIndexById({ id: payload.id, directories: updatedDirectories, resourceType: payload.resourceType });
    const updatedDirectory = Directory.fromObject({ ...updatedDirectories[updatedIndex], name: payload.name } as Directory);
    updatedDirectories.splice(updatedIndex, 1, updatedDirectory);
    Log.debug('DirectoryStore::handleRenameFolder::updatedDirectories::', updatedDirectories);
    Log.debug('DirectoryStore::handleRenameFolder::updatedDirectory::', updatedDirectory, updatedIndex);
    this.setDirectories(updatedDirectories);
  }
  @Action
  getDirectoryIndexById(payload: { id: number; directories: Directory[]; resourceType: ResourceType }): Promise<number> {
    switch (payload.resourceType) {
      case ResourceType.dashboard:
        return Promise.resolve(payload.directories.findIndex(item => item.dashboardId === payload.id));
      default:
        return Promise.resolve(payload.directories.findIndex(item => item.id === payload.id));
    }
  }

  @Action({ rawError: true })
  async softDelete(id: DirectoryId) {
    try {
      const result = await DirectoryStore.getDirectoryService().softDelete(id);
      this.handleRemove({ id: id });

      if (result) {
        TrackingUtils.track(TrackEvents.DirectoryMoveToTrashOk, {
          directory_id: id
        });
      } else {
        TrackingUtils.track(TrackEvents.DirectoryMoveToTrashFail, {
          directory_id: id,
          error: 'move to trash fail'
        });
      }
    } catch (error) {
      TrackingUtils.track(TrackEvents.DirectoryMoveToTrashFail, {
        directory_id: id,
        error: error.message
      });
      throw DIException.fromObject(error);
    }
  }

  //todo:  add function handleRemove
  @Action
  handleRemove(payload: { id: number }) {
    const updatedDirectories = [...this.directories];
    const updatedIndex = updatedDirectories.findIndex(item => item.id === payload.id);
    updatedDirectories.splice(updatedIndex, 1);
    Log.debug('DirectoryStore::handleRenameFolder::updatedDirectories::', updatedDirectories);
    this.setDirectories(updatedDirectories);
  }

  @Action({ rawError: true })
  getListParents(id: DirectoryId): Promise<void> {
    LoaderModule.startLoading();
    return DirectoryStore.getDirectoryService()
      .getParents(id)
      .then(response => this.setParents(response))
      .finally(() => LoaderModule.finishLoading());
  }

  @Action({ rawError: true })
  getDirectory(id: DirectoryId): Promise<Directory> {
    LoaderModule.startLoading();
    return DirectoryStore.getDirectoryService()
      .get(id)
      .finally(() => LoaderModule.finishLoading());
  }

  @Action({ rawError: true })
  public getIdRootDirectory(): Promise<number> {
    LoaderModule.startLoading();
    return DirectoryStore.getDirectoryService()
      .getRootDir()
      .then(directory => directory.id)
      .finally(() => LoaderModule.finishLoading());
  }

  @Action
  async moveDirectory(payload: { id: DirectoryId; parentId: DirectoryId }) {
    LoaderModule.startLoading();
    await DirectoryStore.getDirectoryService().move(payload.id, payload.parentId);
    LoaderModule.finishLoading();
  }

  @Mutation
  setErrorMessage(newMessage: string) {
    this.errorMessage = newMessage;
    this.status = Status.Error;
  }

  @Mutation
  setStatus(status: Status) {
    this.status = status;
  }

  @Mutation
  private renderError(ex: any) {
    Log.debug('render Error:: ', ex);
    const apiException = DIException.fromObject(ex);
    this.errorMessage = apiException.message ?? 'Load directory error.';
  }

  @Mutation
  reset() {
    this.directories = [];
    this.parents = null;
    this.errorMessage = '';
    this.screenName = '';
  }

  @Action
  async star(id: DirectoryId): Promise<void> {
    try {
      this.updateStar({ isStarred: true, id: id });
      await DirectoryStore.getDirectoryService().star(id);
      TrackingUtils.track(TrackEvents.DirectoryStarOk, {
        directory_id: id || 0
      });
    } catch (ex) {
      this.updateStar({ isStarred: false, id: id });
      TrackingUtils.track(TrackEvents.DirectoryStarFail, {
        directory_id: id || 0,
        error: ex.message
      });
      throw ex;
    }
  }

  @Action
  async removeStar(id: DirectoryId): Promise<void> {
    try {
      this.updateStar({ isStarred: false, id: id });
      await DirectoryStore.getDirectoryService().removeStar(id);
      TrackingUtils.track(TrackEvents.DirectoryRemoveStarOk, {
        directory_id: id || 0
      });
    } catch (ex) {
      this.updateStar({ isStarred: true, id: id });
      TrackingUtils.track(TrackEvents.DirectoryRemoveStarFail, {
        directory_id: id || 0,
        error: ex.message
      });
      throw ex;
    }
  }

  @Action
  async restore(id: DirectoryId): Promise<void> {
    try {
      await DirectoryStore.getDirectoryService().restore(id);
      TrackingUtils.track(TrackEvents.DirectoryRestoreOk, {
        directory_id: id || 0
      });
    } catch (ex) {
      TrackingUtils.track(TrackEvents.DirectoryRestoreFail, {
        directory_id: id || 0,
        error: ex.message
      });
      throw ex;
    }
  }

  @Mutation
  updateStar(payload: { id: DirectoryId; isStarred: boolean }): void {
    const { id, isStarred } = payload;
    const index = this.directories.findIndex(directory => directory.id == id);
    if (index > -1) {
      const directories = Array.from(this.directories);
      const updatedDirectory = Directory.fromObject({ ...directories[index], isStarred: isStarred } as Directory);
      directories.splice(index, 1, updatedDirectory);
      this.directories = directories;
    }
  }

  @Action
  async hardDelete(id: DirectoryId): Promise<void> {
    try {
      await DirectoryStore.getDirectoryService().hardDelete(id);
      TrackingUtils.track(TrackEvents.DirectoryHardRemoveOk, {
        directory_id: id || 0
      });
    } catch (ex) {
      TrackingUtils.track(TrackEvents.DirectoryHardRemoveFail, {
        directory_id: id || 0,
        error: ex.message
      });
      throw ex;
    }
  }
}
export const DirectoryModule = getModule(DirectoryStore);
