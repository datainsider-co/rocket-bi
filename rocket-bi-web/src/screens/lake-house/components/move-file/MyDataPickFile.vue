<template>
  <ContextMenu
    id="my-data-file-picker"
    ref="filePickerContext"
    tag="div"
    minWidth="314px"
    :ignoreOutsideClass="listIgnoreClassForContextMenu"
    :close-on-click="true"
    :z-index="10"
  >
    <div class="move-file-container">
      <PickFile
        ref="pickFile"
        :parentDirectoryName="currentDirectory.name"
        :directories="directories"
        :files-max-height="236"
        submit-title="Select"
        :select-directory="selectedFile"
        :showBackAtParentDirectory="!isRootDirectory"
        @directoryClick="handleClickDirectory"
        @back="handleBackDirectory(parentDirectory.id)"
        @submit="handlePickFolder(selectedFile)"
      />
    </div>
  </ContextMenu>
</template>
<script lang="ts">
import { Component, Ref, Vue } from 'vue-property-decorator';
import { Log } from '@core/utils';
import { PopupUtils } from '@/utils/PopupUtils';
import { DashboardId, DIException, Directory, DirectoryId, DirectoryPagingRequest, DirectoryType } from '@core/common/domain';
import { ApiExceptions } from '@/shared';
import ContextMenu from '@/shared/components/ContextMenu.vue';
import { DirectoryListingHandler } from '@/screens/directory/views/mydata/directory-listing-handler/DirectoryListingHandler';
import { MyDataDirectoryListingHandler } from '@/screens/directory/views/mydata/directory-listing-handler/MyDataDirectoryListingHandler';
import { DefaultDirectoryId } from '@/screens/directory/views/mydata/DefaultDirectoryId';
import { DirectoryModule } from '@/screens/directory/store/DirectoryStore';
import PickFile from '@/screens/lake-house/components/move-file/PickFile.vue';
import { Inject } from 'typescript-ioc';
import { DirectoryService } from '@core/common/services';

@Component({
  components: { PickFile, ContextMenu }
})
export default class MyDataPickFile extends Vue {
  private listIgnoreClassForContextMenu = ['action-more'];
  private parentDirectory: { id: DirectoryId; name: string } = { id: DefaultDirectoryId.MyData, name: 'My data' };
  private currentDirectory: { id: DirectoryId; name: string } = { id: DefaultDirectoryId.MyData, name: 'My data' };
  private rootId: DirectoryId = DefaultDirectoryId.MyData;
  private selectedFile: DashboardId | null = null;
  private loadHandler: DirectoryListingHandler = new MyDataDirectoryListingHandler();

  @Ref()
  private readonly pickFile!: PickFile;
  @Inject
  private readonly directoryService!: DirectoryService;

  @Ref()
  private readonly filePickerContext!: ContextMenu;

  private get directories(): Directory[] {
    return this.loadHandler.directories.filter(directory => directory.directoryType);
  }

  private async handleBackDirectory(id: DirectoryId) {
    if (id !== DefaultDirectoryId.MyData) {
      await DirectoryModule.getDirectory(id)
        .then(directory => this.handleClickDirectory(directory))
        .catch(ex => Log.error(ex));
    }
  }

  private async loadDirectoryListing(id: DirectoryId, pagination: DirectoryPagingRequest) {
    this.$nextTick(async () => {
      try {
        this.pickFile.showLoading();
        await this.loadHandler.loadDirectoryListing(id, pagination);
        this.pickFile.showLoaded();
      } catch (e) {
        Log.error('MyDataPickFile::loadDirectoryListing::error::', e.message);
        this.pickFile.showError(e.message);
      }
    });
  }

  private showContextMenu(event: Event) {
    this.filePickerContext.show(event, []);
  }

  private closeContextMenu() {
    this.filePickerContext.hide();
  }

  async show(event: Event) {
    setTimeout(async () => {
      try {
        // event.stopPropagation();
        this.showContextMenu(event);
        await this.initData();
        const pagination = DirectoryPagingRequest.default();
        await this.loadDirectoryListing(this.currentDirectory.id, pagination);
      } catch (e) {
        Log.error('LakeExplorerMoveFile::handleShowPopover::error::', e.message);
      }
    }, 150);
  }

  private async initData() {
    this.pickFile.showLoading();
    const root = await this.directoryService.getRootDir();
    this.parentDirectory = { id: root.parentId, name: 'My data' };
    this.currentDirectory = { id: root.id, name: 'My data' };
    this.rootId = root.id;
    this.selectedFile = null;
  }

  private async handleClickDirectory(directory: Directory) {
    try {
      const isRoot = directory.id === this.rootId;
      const isDirectory = directory.directoryType === DirectoryType.Directory;
      if (!isRoot && isDirectory) {
        const pagination = DirectoryPagingRequest.default();
        await this.loadDirectoryListing(directory.id, pagination);
        this.updateCurrentDirectory(directory);
      } else if (!isRoot && !isDirectory) {
        Log.debug('handleClickDirectory::', directory.dashboardId);
        this.selectedFile = directory.dashboardId!;
      }
    } catch (e) {
      Log.error('LakeExplorerMoveFile::handleClickDirectory::error::', e.message);
    }
  }

  private async handlePickFolder(id: DirectoryId | null) {
    try {
      if (id !== null) {
        this.$emit('selectDirectory', id);
      }
    } catch (e) {
      const ex = DIException.fromObject(e);
      this.showError(ex);
    } finally {
      this.closeContextMenu();
      this.pickFile.setSubmitLoading(false);
    }
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

  private updateCurrentDirectory(directory: Directory) {
    this.parentDirectory = { id: directory.parentId, name: '' };
    Log.debug('updateCurrentDirectory::', directory.id);
    const isRoot = directory.id === this.rootId;
    this.currentDirectory = { id: directory.id, name: isRoot ? 'My Data' : directory.name };
    this.selectedFile = null;
  }

  private get isRootDirectory(): boolean {
    return this.currentDirectory.id === DefaultDirectoryId.MyData || this.parentDirectory.id === DefaultDirectoryId.MyData;
  }
}
</script>
