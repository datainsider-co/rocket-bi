<template>
  <div :class="{ updating: isUpdating }" class="file-browser">
    <StatusWidget :error="msg" :status="status" @retry="handleLoadFile(pathFile)">
      <FileHolder
        v-if="hasFileInfo"
        :file-info="fileInfo"
        :path="pathFile"
        @onClickDelete="handleClickDelete"
        @onClickProperties="handleClickProperties"
        @onClickRename="handleClickRename"
        @onError="setError"
        @onLoaded="setLoaded"
        @onLoading="setLoading"
        @onUpdating="setUpdating"
        @onClickDownload="emitDownload"
      />
    </StatusWidget>
    <DiRenameModal ref="diRenameModal"></DiRenameModal>
    <ViewPropertiesModal ref="viewPropertiesModal"></ViewPropertiesModal>
  </div>
</template>

<script lang="ts">
import { Component, Ref, Vue } from 'vue-property-decorator';
import RightPanel from '@/screens/lake-house/components/file-browser/RightPanel.vue';
import { Status } from '@/shared';
import DetailFile from '@/screens/lake-house/components/file-browser/DetailFile.vue';
import ViewPropertiesModal from '@/screens/lake-house/components/file-browser/ViewPropertiesModal.vue';
import { Log } from '@core/utils';
import { FileBrowserService } from '@core/lake-house/service';
import { Inject } from 'typescript-ioc';
import { DeleteRequest, FileAction, FileInfo, GetInfoResponse } from '@core/lake-house/domain';
import { DIException } from '@core/common/domain';
import StatusWidget from '@/shared/components/StatusWidget.vue';
import { Modals } from '@/utils/Modals';
import { PopupUtils } from '@/utils/PopupUtils';
import DiRenameModal from '@/shared/components/DiRenameModal.vue';
import { RenameRequest } from '@core/lake-house/domain/request/RenameRequest';
import { RouterUtils } from '@/utils/RouterUtils';
import FileHolder from '@/screens/lake-house/components/file-browser/FileHolder.vue';
import { Track } from '@/shared/anotation/TrackingAnotation';
import { TrackEvents } from '@core/tracking/enum/TrackEvents';
import LakeExplorer from '@/screens/lake-house/views/lake-explorer/LakeExplorer.vue';
import { TrackingUtils } from '@core/tracking/TrackingUtils';

@Component({
  components: {
    DiRenameModal,
    StatusWidget,
    RightPanel,
    DetailFile,
    FileHolder,
    ViewPropertiesModal
  }
})
export default class FileBrowser extends Vue {
  private status = Status.Loading;
  private msg = '';

  private fileInfo: FileInfo | null = null;

  @Inject
  private readonly fileBrowserService!: FileBrowserService;
  @Ref()
  private readonly viewPropertiesModal!: ViewPropertiesModal;

  @Ref()
  private readonly diRenameModal?: DiRenameModal;

  private get pathFile(): string | undefined {
    return this.$route.query.path as string;
  }

  private get isUpdating(): boolean {
    return this.status == Status.Updating;
  }

  private get hasFileInfo() {
    return !!this.fileInfo;
  }

  setLoaded() {
    Log.debug('Browser::onLoaded');
    this.status = Status.Loaded;
  }

  setLoading() {
    this.status = Status.Loading;
  }

  async handleLoadFile(path: string) {
    try {
      this.setLoading();
      await this.loadFileInfo(path);
      this.setLoaded();
    } catch (ex) {
      Log.error('handleLoadFile::', ex);
      const exception = DIException.fromObject(ex);
      this.status = Status.Error;
      this.msg = exception.message;
    }
  }

  @Track(TrackEvents.LakeDirectoryMoveToTrash, {
    path: (_: FileBrowser, args: any) => _.pathFile
  })
  private handleClickDelete(): void {
    Modals.showConfirmationModal(`Are you sure to delete file '${this.fileInfo?.name ?? ''}' ?`, {
      onOk: () => this.handleDeleteFile(this.pathFile!)
    });
  }

  @Track(TrackEvents.DirectoryViewProperties, { path: (_: FileBrowser, args: any) => _.pathFile })
  private handleClickProperties(): void {
    this.viewPropertiesModal.show(this.pathFile!);
  }

  @Track(TrackEvents.LakeDirectoryRename, {
    path: (_: FileBrowser, args: any) => _.pathFile,
    file_name: (_: FileBrowser, args: any) => _.fileInfo?.name
  })
  private handleClickRename(): void {
    //
    this.diRenameModal?.show(this.fileInfo?.name ?? '', (newName: string) => {
      this.handleRenameFile(newName);
    });
  }

  private async handleRenameFile(newName: string) {
    try {
      this.diRenameModal?.setLoading(true);
      await this.fileBrowserService.action(FileAction.Rename, new RenameRequest(this.pathFile!, newName));
      this.diRenameModal?.setLoading(false);
      this.diRenameModal?.hide();
      const newPath = RouterUtils.join(RouterUtils.parentPath(this.pathFile!), newName);
      // await this.loadFileInfo(newpath)
      Log.debug('newPath::');
      this.$emit('renamed', newPath);
      TrackingUtils.track(TrackEvents.DirectoryRenameOk, {
        path: this.pathFile,
        directory_new_name: newName,
        directory_old_name: this.fileInfo?.name
      });
    } catch (ex) {
      Log.error('handleRenameFile::', ex);
      this.diRenameModal?.setLoading(false);
      this.diRenameModal?.setError(ex.message);
      TrackingUtils.track(TrackEvents.DirectoryRenameFail, {
        path: this.pathFile,
        directory_new_name: newName,
        directory_old_name: this.fileInfo?.name,
        error: ex.message
      });
    }
  }

  private async loadFileInfo(path: string) {
    const fileInfo: GetInfoResponse = await this.fileBrowserService.getPathInfo(path);
    this.fileInfo = fileInfo.data;
  }

  @Track(TrackEvents.DirectoryMoveToTrash, { path: (_: FileBrowser) => _.pathFile })
  private async handleDeleteFile(path: string) {
    const previousStatus = this.status;
    try {
      this.status = Status.Loading;
      await this.fileBrowserService.action(FileAction.Delete, DeleteRequest.moveToTrash(path));
      // LakeHouseResponse.ensureValidResponse(response);
      // await RouterUtils.to(Routers.LakeExplorer);
      this.$emit('deleted', RouterUtils.parentPath(this.pathFile!));
      TrackingUtils.track(TrackEvents.DirectoryMoveToTrashOk, { path: path });
    } catch (ex) {
      const exception = DIException.fromObject(ex);
      this.status = previousStatus;
      PopupUtils.showError(exception.message);
      TrackingUtils.track(TrackEvents.DirectoryMoveToTrashFail, { path: path, error: exception.message });
    }
  }

  private setError(exception: DIException) {
    this.status = Status.Error;
    this.msg = exception.message;
  }

  private setUpdating() {
    this.status = Status.Updating;
  }
  private get isLoading() {
    return this.status == Status.Loading;
  }

  private emitDownload() {
    this.$emit('download', this.pathFile);
  }
}
</script>

<style lang="scss">
.file-browser.updating {
  position: relative;

  .update-background {
    height: calc(100% - 56px) !important;
    top: 56px;
  }
}
</style>
