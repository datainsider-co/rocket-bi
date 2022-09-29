<template>
  <ContextMenu ref="vueContext" tag="div" minWidth="314px" :ignoreOutsideClass="listIgnoreClassForContextMenu" :close-on-click="false" :z-index="1">
    <div class="move-file-container">
      <MoveFile
        ref="moveFile"
        display-key="name"
        :parentDirectoryName="parentDirectoryName"
        :directories="directories"
        :files-max-height="236"
        :submit-title="submitTitle"
        :showBackAtParentDirectory="!isSameExplorerAllFilesPath"
        @directoryClick="handleClickDirectory"
        @back="handleClickBack"
        @createDirectory="handleCreateDirectory"
        @submit="handleSubmitActionWithMode(folderActionMode, destinationPath, moveFileNames, movePaths)"
      />
    </div>
  </ContextMenu>
</template>
<script lang="ts">
import { Component, Prop, Ref, Vue, Watch } from 'vue-property-decorator';
import MoveFile from '@/screens/lake-house/components/move-file/MoveFile.vue';
import { Inject } from 'typescript-ioc';
import { CheckNameRequest, FileAction, FileBrowserService, FileInfo, FileType, GetInfoResponse, MultiCopyRequest } from '@core/lake-house';
import { RouterUtils } from '@/utils/RouterUtils';
import { Log } from '@core/utils';
import { xor } from 'lodash';
import { ListUtils } from '@/utils';
import { UnsupportedException } from '@core/common/domain/exception/UnsupportedException';
import { CreateDirectoryRequest } from '@core/lake-house/domain/request/CreateDirectoryRequest';
import { LakeExplorerModule } from '@/screens/lake-house/store/LakeExplorerStore';
import { PopupUtils } from '@/utils/PopupUtils';
import { DIException } from '@core/common/domain';
import { ApiExceptions, Routers } from '@/shared';
import { LakeExplorerAllFilesPath, LakeExplorerTrashPath } from '@/screens/lake-house/LakeHouseConstant';
import ContextMenu from '@/shared/components/ContextMenu.vue';
import { TrackEvents } from '@core/tracking/enum/TrackEvents';
import { TrackingUtils } from '@core/tracking/TrackingUtils';
import { Track } from '@/shared/anotation';

export enum FolderActionMode {
  Move = 'Move',
  Copy = 'Copy'
}

@Component({
  components: { MoveFile, ContextMenu }
})
export default class LakeExplorerMoveFile extends Vue {
  private listIgnoreClassForContextMenu = ['action-more'];
  private directories: FileInfo[] = [];
  private readonly allFileName = 'All Files';
  private parentDirectoryName = this.allFileName;
  private moveFileNames: string[] = [];
  private movePaths: string[] = [];
  private folderActionMode = FolderActionMode.Move;

  @Inject
  private readonly fileBrowserService!: FileBrowserService;

  @Ref()
  private readonly moveFile!: MoveFile;

  @Ref()
  private readonly vueContext!: ContextMenu;

  @Prop({ required: true })
  private readonly currentPath!: string;

  private get destinationPath(): string {
    if (this.$router.currentRoute.name === Routers.LakeExplorerTrash) {
      const path = this.$route.query.movePath ?? LakeExplorerTrashPath;
      return RouterUtils.normalizePath(path as string);
    } else {
      const path = this.$route.query.movePath ?? LakeExplorerAllFilesPath;
      return RouterUtils.normalizePath(path as string);
    }
  }

  private get isSameExplorerAllFilesPath(): boolean {
    return this.destinationPath === LakeExplorerAllFilesPath;
  }

  private get submitTitle() {
    switch (this.folderActionMode) {
      case FolderActionMode.Move:
        return 'MOVE';
      case FolderActionMode.Copy:
        return 'COPY';
      default:
        throw new UnsupportedException(`Unsupported folder action mode ${this.folderActionMode}`);
    }
  }

  private async loadDirectoryListing(currentPath: string) {
    this.$nextTick(async () => {
      try {
        this.moveFile.showLoading();
        const response = await this.fileBrowserService.listFile({ path: currentPath, search: '', sortBy: 'name', type: FileType.Folder.toString() });
        this.directories = response.data;
        this.moveFile.showLoaded();
      } catch (e) {
        Log.error('LakeExplorerMoveFile::loadDirectoryListing::error::', e.message);
        this.moveFile.showError(e.message);
      }
    });
  }

  private showContextMenu(event: Event) {
    this.vueContext.show(event, []);
  }

  private closeContextMenu() {
    this.vueContext.hide();
  }

  private initData(fileNames: string[], paths: string[], folderActionMode: FolderActionMode) {
    this.moveFileNames = fileNames;
    this.movePaths = paths;
    this.folderActionMode = folderActionMode;
  }

  async show(event: Event, fileNames: string[], paths: string[], folderActionMode = FolderActionMode.Move) {
    setTimeout(async () => {
      try {
        // event.stopPropagation();
        this.showContextMenu(event);
        this.initData(fileNames, paths, folderActionMode);
        await this.redirectToAllFiles();
        await this.initParentDirectory();
        await this.loadDirectoryListing(LakeExplorerAllFilesPath);
      } catch (e) {
        Log.error('LakeExplorerMoveFile::handleShowPopover::error::', e.message);
      }
    }, 150);
  }

  private async redirectToAllFiles() {
    if (!this.isSameExplorerAllFilesPath) {
      await RouterUtils.to(Routers.CurrentRoute, { query: { ...this.$router.currentRoute.query, movePath: LakeExplorerAllFilesPath } });
    }
  }

  private async initParentDirectory() {
    if (this.isSameExplorerAllFilesPath) {
      this.updateParentDirectoryName(this.allFileName);
    } else {
      this.updateParentDirectoryName(RouterUtils.currentFile(this.destinationPath));
    }
    Log.debug('handleClickParentDirectory::initParentDirectionOnShow::', this.parentDirectoryName);
  }

  private async handleClickDirectory(fileInfo: FileInfo) {
    try {
      this.updateParentDirectoryName(fileInfo.name);
      await this.redirectToDirectory(RouterUtils.nextPath(this.destinationPath, fileInfo.name));
    } catch (e) {
      Log.error('LakeExplorerMoveFile::handleClickDirectory::error::', e.message);
    }
  }

  private async redirectToDirectory(path: string) {
    await RouterUtils.to(Routers.CurrentRoute, {
      query: { ...this.$router.currentRoute.query, movePath: path }
    });
  }

  private async handleClickBack(fileInfo: FileInfo) {
    try {
      const path = RouterUtils.parentPath(this.destinationPath);
      if (this.isValidRedirect(path, this.destinationPath)) {
        this.updateParentDirectoryName(RouterUtils.getParentDirectoryName(this.destinationPath, this.allFileName));
        await this.redirectToDirectory(path);
      }
    } catch (e) {
      Log.error('LakeExplorerMoveFile::handleClickParentDirectory::error::', e.message);
    }
  }

  private isValidRedirect(oldPath: string, newPath: string) {
    return !RouterUtils.isSamePath(oldPath, newPath);
  }

  private async ensureExistFilesInPath(fileNames: string[], path: string) {
    const checkExistResponse = await this.fileBrowserService.action(FileAction.CheckExistName, new CheckNameRequest(path, fileNames));
    const diff = xor(checkExistResponse.data.sort(), fileNames.sort());
    if (ListUtils.isNotEmpty(diff)) {
      throw new DIException(
        `You folders '${this.getIntersectionFiles(diff, fileNames)}' exist in ${path}. You need rename before.`,
        void 0,
        ApiExceptions.alreadyExisted
      );
    }
  }

  private async handleSubmitActionWithMode(folderActionMode: FolderActionMode, destinationPath: string, moveFileNames: string[], movePaths: string[]) {
    try {
      Log.debug('handleSubmitActionWithMode::MovePaths::', movePaths, moveFileNames);
      //todo: update void 0 if add screen replace data
      const isOverwrite = false;
      const newNames = void 0;
      this.checkRecursiveDirectory(movePaths, destinationPath);
      this.moveFile.setSubmitLoading(true);
      await this.ensureExistFilesInPath(moveFileNames, destinationPath);
      switch (folderActionMode) {
        case FolderActionMode.Copy: {
          await this.copy(movePaths, destinationPath, isOverwrite, newNames);
          break;
        }
        case FolderActionMode.Move: {
          await this.move(movePaths, destinationPath, isOverwrite, newNames);
          break;
        }
        default:
          throw new UnsupportedException(`Unsupported folder action mode ${folderActionMode}`);
      }
      await this.redirectToDestinationDirectory(destinationPath);
      this.closeContextMenu();
    } catch (e) {
      this.closeContextMenu();
      const ex = DIException.fromObject(e);
      this.showError(ex);
      this.trackMoveFail(folderActionMode, destinationPath, moveFileNames, ex.message);
    } finally {
      this.moveFile.setSubmitLoading(false);
    }
  }

  private trackMoveFail(folderActionMode: FolderActionMode, destinationPath: string, moveFileNames: string[], message: string) {
    switch (folderActionMode) {
      case FolderActionMode.Move:
        TrackingUtils.track(TrackEvents.DirectoryMoveFail, { dest_path: destinationPath, path: this.currentPath, file_names: moveFileNames, error: message });
        break;
      case FolderActionMode.Copy:
        TrackingUtils.track(TrackEvents.DirectoryCopyFail, { dest_path: destinationPath, path: this.currentPath, file_names: moveFileNames, error: message });
    }
  }

  private async redirectToDestinationDirectory(destinationPath: string) {
    await RouterUtils.to(this.resultRouter, { query: { ...this.$router.currentRoute.query, path: destinationPath } });
  }

  private get resultRouter(): Routers {
    return this.destinationPath.includes(LakeExplorerTrashPath) ? Routers.LakeExplorerTrash : Routers.LakeExplorer;
  }

  private showError(ex: DIException) {
    if (ex.reason === ApiExceptions.alreadyExisted) {
      //@ts-ignored
      this.$alert.fire({
        icon: 'error',
        title: 'Can not complete action',
        html: ex.message
      });
    } else {
      Log.error('LakeExplorerMoveFile::handleMoveFile::error::', ex.message);
      PopupUtils.showError(ex.message);
    }
  }

  private checkRecursiveDirectory(movePaths: string[], destinationPath: string) {
    if (movePaths.includes(destinationPath)) {
      throw new DIException(`Can't move folders ${RouterUtils.currentFile(destinationPath)} into itself`, void 0, ApiExceptions.alreadyExisted);
    }
  }

  private async copy(movePaths: string[], destinationPath: string, isOverwrite: boolean, newNames: string[] | undefined) {
    TrackingUtils.track(TrackEvents.DirectoryCopy, { dest_path: destinationPath, path: this.currentPath, file_names: newNames?.join(',') });
    await this.fileBrowserService.multiCopy(new MultiCopyRequest(movePaths, destinationPath, isOverwrite, newNames));
    TrackingUtils.track(TrackEvents.DirectoryCopyOk, { dest_path: destinationPath, path: this.currentPath, file_names: newNames?.join(',') });
  }

  private async move(movePaths: string[], destinationPath: string, isOverwrite: boolean, newNames: string[] | undefined) {
    TrackingUtils.track(TrackEvents.DirectoryMove, { dest_path: destinationPath, path: this.currentPath, file_names: newNames?.join(',') });
    await this.fileBrowserService.multiMove(new MultiCopyRequest(movePaths, destinationPath, isOverwrite, newNames));
    TrackingUtils.track(TrackEvents.DirectoryMoveOk, { dest_path: destinationPath, path: this.currentPath, file_names: newNames?.join(',') });
  }

  private getIntersectionFiles(files1: string[], files2: string[]): string[] {
    const intersectionFile: string[] = [];
    files2.forEach(name => {
      if (files1.includes(name)) intersectionFile.push(name);
    });
    return intersectionFile;
  }

  @Watch('destinationPath')
  async onMovePathChanged(currentPath: string) {
    await this.loadDirectoryListing(currentPath);
  }

  private updateParentDirectoryName(directoryName: string) {
    this.parentDirectoryName = directoryName;
  }

  private get isSameExplorerPath() {
    const explorerPath = this.currentPath;
    return RouterUtils.isSamePath(this.destinationPath, explorerPath);
  }

  @Track(TrackEvents.LakeDirectoryCreate, {
    path: (_: LakeExplorerMoveFile, args: any) => _.destinationPath
  })
  private async handleCreateDirectory(folderName: string) {
    try {
      const request = new CreateDirectoryRequest(this.destinationPath, folderName);
      const response = await this.createDirectory(request);
      this.directories.unshift(response.data);
      this.moveFile.toggleCreateFolder();
      if (this.isSameExplorerPath) {
        LakeExplorerModule.updateListingOnCreateNew(response.data);
      }
      TrackingUtils.track(TrackEvents.CreateFolderOk, { folder_name: folderName, path: this.destinationPath });
    } catch (e) {
      Log.error('LakeExplorerMoveFile::handleCreateDirectory::error::', e.message);
      this.moveFile.showErrorCreateFolder(e.message);
      TrackingUtils.track(TrackEvents.CreateFolderFail, { folder_name: folderName, path: this.destinationPath, error: e.message });
    }
  }

  private createDirectory(request: CreateDirectoryRequest): Promise<GetInfoResponse> {
    return this.fileBrowserService.newFolder(request);
  }
}
</script>
