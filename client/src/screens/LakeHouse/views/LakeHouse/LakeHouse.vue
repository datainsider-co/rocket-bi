<template>
  <LayoutWrapper>
    <LayoutSidebar :items="navItems">
      <template v-slot:top>
        <PopoverV2 class="dropdown" placement="bottom-start" auto-hide>
          <DiShadowButton id="create-new" class="shadow-button explorer-create-new" title="New">
            <i class="regular-icon-16 di-icon-add"></i>
          </DiShadowButton>
          <template v-slot:menu>
            <div class="dropdown-menu">
              <a @click.prevent="showCreateDirectoryModal" class="dropdown-item" href="#">Directory</a>
              <a @click.prevent="showUploadFileModal" class="dropdown-item" href="#">File</a>
            </div>
          </template>
        </PopoverV2>
      </template>
    </LayoutSidebar>
    <router-view ref="lakeExplorer" class="my-data-listing"></router-view>
    <DirectoryCreate ref="mdCreateDirectory" />
    <FolderCreationModal ref="folderCreationModal" @createDirectory="handleCreateDirectory" />
    <LakeBrowserFileModal ref="uploadModal" />
  </LayoutWrapper>
</template>

<script lang="ts">
import { Component, Ref, Watch } from 'vue-property-decorator';
import HeaderBar from '@/shared/components/HeaderBar.vue';
import DataIngestionHeader from '@/screens/DataIngestion/components/DataIngestionHeader.vue';
import { LoggedInScreen } from '@/shared/components/VueHook/LoggedInScreen';
import { NavigationItem } from '@/shared/components/Common/NavigationPanel.vue';
import { ContextMenuItem, Routers } from '@/shared';
import { Log } from '@core/utils';
import DiShadowButton from '@/shared/components/Common/DiShadowButton.vue';
import ContextMenu from '@/shared/components/ContextMenu.vue';
import { Directory } from '@core/domain';
import DirectoryCreate from '@/screens/Directory/components/DirectoryCreate.vue';
import { HtmlElementRenderUtils } from '@/utils/HtmlElementRenderUtils';
import FolderCreationModal from '@/screens/LakeHouse/Components/FolderCreationModal.vue';
import LakeExplorer from '@/screens/LakeHouse/views/LakeExplorer/LakeExplorer.vue';
import { Inject } from 'typescript-ioc';
import { FileAction, FileBrowserService, FileInfo } from '@core/LakeHouse';
import { CreateDirectoryRequest } from '@core/LakeHouse/Domain/Request/CreateDirectoryRequest';
import { LakeExplorerModule } from '@/screens/LakeHouse/store/LakeExplorerStore';
import { BFormFile } from 'bootstrap-vue';
import { LakeHouseResponse } from '@core/LakeHouse/Domain/Response/LakeHouseResponse';
import { LayoutSidebar, LayoutWrapper } from '@/shared/components/LayoutWrapper';
import PopoverV2 from '@/shared/components/Common/PopoverV2/PopoverV2.vue';
import LakeBrowserFileModal from '@/screens/LakeHouse/Components/LakeUpload/LakeBrowserFileModal.vue';

@Component({
  components: {
    FolderCreationModal,
    DiShadowButton,
    DataIngestionHeader,
    HeaderBar,
    DirectoryCreate,
    LayoutWrapper,
    LayoutSidebar,
    PopoverV2,
    LakeBrowserFileModal
  }
})
export default class LakeHouse extends LoggedInScreen {
  content = '';
  @Ref()
  private readonly diContextMenu!: ContextMenu;

  @Ref()
  private mdCreateDirectory?: DirectoryCreate;

  @Ref()
  private readonly lakeExplorer?: LakeExplorer;

  @Ref()
  private readonly uploadModal!: LakeBrowserFileModal;

  @Ref()
  private readonly folderCreationModal?: FolderCreationModal;

  @Ref()
  private readonly myFile?: BFormFile;

  @Inject
  private readonly fileBrowserService!: FileBrowserService;

  private get navItems(): NavigationItem[] {
    return [
      {
        id: 'allFiles',
        displayName: 'All Files',
        icon: 'di-icon-my-data',
        to: { name: Routers.LakeExplorer }
      },
      {
        id: 'lakeHouseExplorerTrash',
        displayName: 'Trash',
        icon: 'di-icon-delete',
        to: { name: Routers.LakeExplorerTrash }
      }
    ];
  }

  showContextMenu(items: ContextMenuItem[], target: string, event: Event) {
    const buttonEvent = HtmlElementRenderUtils.fixMenuOverlap(event, target);
    this.diContextMenu?.show(buttonEvent, items);
  }

  showMenuCreateDirectory(event: MouseEvent) {
    Log.debug('LakeHouse::showMenuCreateDirectory::');
    const items = this.getCreateMenuItem();
    this.showContextMenu(items, 'create-new', event);
  }

  private getCreateMenuItem(): ContextMenuItem[] {
    return [
      {
        text: 'Directory',
        click: () => {
          this.showCreateDirectoryModal();
        }
      },
      {
        text: 'File',
        click: () => {
          this.showUploadFileModal();
        }
      }
    ];
  }

  private showUploadFileModal() {
    // DiUploadDocumentActions.showUploadDocument();
    this.uploadModal.show(this.lakeExplorer?.currentPath ?? '/');
  }

  private showCreateDirectoryModal() {
    this.diContextMenu?.hide();
    this.folderCreationModal?.show();
  }

  private async handleCreateDirectory(directoryName: string, groupName: string) {
    try {
      this.folderCreationModal?.showLoading();
      const response = await this.fileBrowserService.action(
        FileAction.NewFolder,
        new CreateDirectoryRequest(this.lakeExplorer?.currentPath ?? '/', directoryName)
      );
      LakeHouseResponse.ensureValidResponse(response);
      LakeExplorerModule.updateListingOnCreateNew(response.data as FileInfo);
      this.folderCreationModal?.hide();
      this.folderCreationModal?.showLoaded();
    } catch (e) {
      Log.error('LakeHouse::handleCreateDirectory::error::', e.message);
      this.folderCreationModal?.showError(e.message);
    }
  }

  private handleUploadTextFile() {
    this.$nextTick(() => {
      this.myFile?.click();
    });
  }
}
</script>

<style lang="scss">
@import '~@/themes/scss/mixin.scss';

.lake-house {
  display: flex;
  flex-direction: column;
  height: 100vh;

  &--body {
    display: flex;
    flex: 1;
    padding: 24px 32px 24px 16px;

    > * {
      overflow: hidden;
    }

    > .my-data-listing {
      flex: 1;
    }
  }

  #create-new {
    width: fit-content;
    margin-bottom: 16px;

    @media screen and (max-width: 800px) {
      .title {
        display: none !important;
      }
      i {
        margin: 0;
      }
    }
  }

  .form-file {
    top: 0;
    height: 40.67px;
    display: none;
  }
}
</style>
