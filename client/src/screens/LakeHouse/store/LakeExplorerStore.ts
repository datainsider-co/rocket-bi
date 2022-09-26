import { Action, getModule, Module, Mutation, VuexModule } from 'vuex-module-decorators';
import store from '@/store';
import { Stores } from '@/shared';
import { FileInfo } from '@core/LakeHouse/Domain/FileInfo/FileInfo';
import { Inject } from 'typescript-ioc';
import { FileBrowserService } from '@core/LakeHouse/Service';
import { GetListFileRequest } from '@core/LakeHouse/Domain';
import { Log } from '@core/utils';
import { findIndex } from 'lodash';
import { RouterUtils } from '@/utils/RouterUtils';

@Module({ dynamic: true, namespaced: true, store: store, name: Stores.LakeExplorer })
class LakeExplorerStore extends VuexModule {
  fileListing: FileInfo[] = [];
  totalRecord = 0;

  @Inject
  private fileBrowserService!: FileBrowserService;

  @Action
  loadFileListing(payload: { getListFileRequest: GetListFileRequest; root: string }): Promise<FileInfo[]> {
    return this.fileBrowserService.listFile(payload.getListFileRequest).then(response => {
      const fileInfos = response.data;
      if (!RouterUtils.isSamePath(payload.getListFileRequest.path, payload.root)) {
        const parentDirectory: FileInfo = FileInfo.parentDirectory();
        fileInfos.unshift(parentDirectory);
      }
      this.setFileListing(fileInfos);
      this.setTotalData(response.total);
      return response.data;
    });
  }

  @Action
  updateListingOnRename(payload: { renamedFileInfo: FileInfo; newName: string }) {
    const updatedFileListing = [...this.fileListing];
    const updatedIndex = updatedFileListing.findIndex(file => file.name === payload.renamedFileInfo.name);
    if (updatedIndex >= 0) {
      updatedFileListing[updatedIndex].name = payload.newName;
    }
    Log.debug('updatedFileListing::', updatedFileListing, payload.newName);
    this.setFileListing(updatedFileListing);
  }

  @Action
  updateListingOnCreateNew(fileInfo: FileInfo) {
    const updatedFileListing = [...this.fileListing];
    if (this.fileListing.some(file => file.name === '..')) {
      const parentFileInfo = FileInfo.parentDirectory();
      updatedFileListing.splice(0, 1);
      updatedFileListing.unshift(fileInfo);
      updatedFileListing.unshift(parentFileInfo);
    } else {
      updatedFileListing.unshift(fileInfo);
    }
    this.setFileListing(updatedFileListing);
  }

  @Action
  getPathInfo(path: string): Promise<FileInfo> {
    return this.fileBrowserService.getPathInfo(path).then(response => response.data);
  }

  @Mutation
  setFileListing(fileListing: FileInfo[]) {
    this.fileListing = fileListing;
  }

  @Mutation
  setTotalData(total: number) {
    this.totalRecord = total;
  }

  @Mutation
  reset() {
    this.fileListing = [];
    this.totalRecord = 0;
  }
}

export const LakeExplorerModule = getModule(LakeExplorerStore);
