<template>
  <RightPanel class="source-selection">
    <template #header>
      <header class="w-100">
        <div class="data-source-title">
          <div class="root-title cursor-pointer" @click="redirectToRoot">
            <i class="di-icon-datasource"></i>
            <span>All Files</span>
          </div>
          <BreadcrumbComponent :breadcrumbs="breadcrumbs" :max-item="2" />
          <div class="ml-1 action-bar d-flex ml-auto">
            <SearchInput class="search-file-input" hint-text="Search file or folder name" @onTextChanged="handleKeywordChange" />
          </div>
        </div>
      </header>
    </template>
    <template #default>
      <div class="source-select--body">
        <DiTable
          id="data-source-listing"
          ref="fileTable"
          totalRowTitle="file"
          :error-msg="tableErrorMessage"
          :headers="headers"
          :isShowPagination="true"
          :records="records"
          :status="tableStatus"
          :total="totalRecord"
          @onClickRow="onClickRow"
          @onPageChange="handlePageChange"
          @onRetry="loadFileListing"
        >
          <!--          <template #empty>-->
          <!--            <div class="h-100 select-datasource-type-panel d-flex justify-content-center flex-column align-items-center">-->
          <!--              <div>-->
          <!--                <DataSourceIcon :size="39" color="#9799AC"></DataSourceIcon>-->
          <!--              </div>-->
          <!--              <div class="action d-flex flex-column">-->
          <!--                <span>Your file and folder is empty</span>-->
          <!--              </div>-->
          <!--            </div>-->
          <!--          </template>-->
        </DiTable>
      </div>
    </template>
  </RightPanel>
</template>

<script lang="ts">
import { Component, Ref, Vue, Watch } from 'vue-property-decorator';
import { Breadcrumbs, CustomCell, HeaderData, Pagination, RowData } from '@/shared/models';
import { DefaultPaging, Status } from '@/shared';
import { Log } from '@core/utils';
import StatusWidget from '@/shared/components/StatusWidget.vue';
import { DIException } from '@core/domain';
import { UserAvatarCell } from '@/shared/components/Common/DiTable/CustomCell';
import { LakeExplorerModule } from '@/screens/LakeHouse/store/LakeExplorerStore';
import { FileInfo, FileType } from '@core/LakeHouse/Domain/FileInfo/FileInfo';
import RightPanel from '@/screens/LakeHouse/Components/FileBrowser/RightPanel.vue';
import FolderCreationModal from '@/screens/LakeHouse/Components/FolderCreationModal.vue';
import DiIconTextButton from '@/shared/components/Common/DiIconTextButton.vue';
import { SizeDataCell } from '@/shared/components/Common/DiTable/CustomCell/SizeDataCell';
import { FileCell } from '@/shared/components/Common/DiTable/CustomCell/FileCell';
import { GetListFileRequest } from '@core/LakeHouse/Domain';
import BreadcrumbComponent from '@/screens/Directory/components/BreadcrumbComponent.vue';
import { StringUtils } from '@/utils/string.utils';
import SearchInput from '@/shared/components/SearchInput.vue';
import FileBrowser from '@/screens/LakeHouse/views/LakeExplorer/FileBrowser.vue';
import ViewPropertiesModal from '@/screens/LakeHouse/Components/FileBrowser/ViewPropertiesModal.vue';
import DiRenameModal from '@/shared/components/DiRenameModal.vue';
import { RouterUtils } from '@/utils/RouterUtils';
import { HtmlElementRenderUtils } from '@/utils/HtmlElementRenderUtils';
import DiTable from '@/shared/components/Common/DiTable/DiTable.vue';
import { ListUtils } from '@/utils';
import { AtomicAction } from '@/shared/anotation/AtomicAction';
import { MethodProfiler } from '@/shared/profiler/annotation';

@Component({
  components: {
    FileBrowser,
    BreadcrumbComponent,
    DiIconTextButton,
    DiRenameModal,
    FolderCreationModal,
    ViewPropertiesModal,
    RightPanel,
    StatusWidget
  }
})
export default class SourceSelection extends Vue {
  // @Prop({ required: true, type: String })
  root = '/';
  private selectedPaths: Set<string> = new Set<string>();
  private keyword = '';
  private sortMode = 1;
  private sortBy = 'name';
  private from = 0;
  private size = DefaultPaging.DefaultPageSize;
  private tableErrorMessage = '';
  private tableStatus: Status = Status.Loading;
  private breadcrumbs: Breadcrumbs[] = [];

  @Ref()
  private readonly searchInput?: SearchInput;

  @Ref()
  private readonly fileTable?: DiTable;

  get currentPath(): string {
    const path = this.$route.query.path ?? this.root;
    return RouterUtils.normalizePath(path as string);
  }

  private get headers(): HeaderData[] {
    return [
      {
        key: 'radio',
        label: '',
        disableSort: true,
        width: 45,
        customRenderBodyCell: new CustomCell(rowData => {
          if (FileInfo.isParentDirectory(rowData.name)) {
            return document.createElement('div');
          } else {
            const pathFile = this.toPathFile((rowData as any) as FileInfo);
            const radio = document.createElement('input');
            radio.setAttribute('type', 'checkbox');
            radio.checked = this.selectedPaths.has(pathFile) ?? false;
            radio.addEventListener('click', e => this.onClickRadioDirectory(e, rowData));
            const radioContent: HTMLElement = document.createElement('div');
            const container = document.createElement('div');
            container.appendChild(radio);
            container.appendChild(radioContent);
            HtmlElementRenderUtils.addClass(container, 'radio-cell');
            return container;
          }
        })
      },
      {
        key: 'name',
        label: 'Name',
        disableSort: true,
        customRenderBodyCell: new FileCell('name', 'type')
      },
      {
        key: 'sizeInByte',
        label: 'Size',
        disableSort: true,
        customRenderBodyCell: new SizeDataCell('sizeInByte')
      },
      {
        key: 'creator',
        label: 'User',
        disableSort: true,
        customRenderBodyCell: new UserAvatarCell('owner.avatar', ['creator'], false, false)
      },
      {
        key: 'group',
        label: 'Group',
        disableSort: true
      }
    ];
  }

  private get totalRecord(): number {
    return LakeExplorerModule.totalRecord;
  }

  private get records(): FileInfo[] {
    return LakeExplorerModule.fileListing;
  }

  private get isLoaded() {
    return this.tableStatus === Status.Loaded;
  }

  private get dataSourceListing(): RowData[] {
    // return []
    return this.records.map(file => {
      return {
        ...file,
        isExpanded: false,
        children: [],
        depth: 0
      };
    });
  }

  private get getListFileRequest(): GetListFileRequest {
    return new GetListFileRequest(this.currentPath, this.keyword, this.from, this.size, this.sortBy, this.sortMode);
  }

  private get queryFromListFileRequest() {
    return {
      ...this.getListFileRequest,
      from: this.from.toString(),
      size: this.size.toString(),
      sortMode: this.sortMode.toString(),
      sortBy: this.sortBy
    };
  }

  async created() {
    // this.initBreadcrumbs(this.currentPath);
    // await this.loadFileListing(this.getListFileRequest);
    await this.onPathChanged(this.currentPath);
  }

  isLoading() {
    return this.tableStatus === Status.Loading || this.tableStatus === Status.Updating;
  }

  @AtomicAction()
  @Watch('currentPath')
  async onPathChanged(currentPath: string) {
    try {
      this.showLoading();
      this.initBreadcrumbs(currentPath);
      const fileInfo = await LakeExplorerModule.getPathInfo(currentPath);
      if (fileInfo.type === FileType.Folder) {
        await LakeExplorerModule.loadFileListing({ getListFileRequest: this.getListFileRequest, root: this.root });
      }
      this.showLoaded();
      Log.debug('onChangePath::', currentPath);
    } catch (e) {
      this.showError(e.message);
    }
  }

  reset() {
    this.selectedPaths.clear();
    this.keyword = '';
    this.from = 0;
    this.breadcrumbs = [];
    this.tableErrorMessage = '';
  }

  setPaths(paths: string[]) {
    this.selectedPaths = new Set(paths);
    Log.debug('setPaths:', this.selectedPaths);
  }

  private nextPath(fileName: string): string {
    if (FileInfo.isParentDirectory(fileName)) {
      const folderNames = this.currentPath.replace(this.root, '').split('/');
      folderNames.pop();
      return RouterUtils.join(this.root, folderNames.join('/'));
    } else {
      return RouterUtils.normalizePath(RouterUtils.join(this.currentPath, fileName));
    }
  }

  private redirectToRoot() {
    this.redirectTo(this.root);
  }

  private onClickRadioDirectory(e: MouseEvent, rowData: RowData) {
    e.stopPropagation();
    const fileInfo = FileInfo.fromObject(rowData);
    this.toggleFile(fileInfo);
    Log.debug('LakeExplorer::onClickRadioDirectory::selectedPaths::', this.selectedPaths);
  }

  @AtomicAction()
  private onClickRow(rowData: RowData) {
    const fileInfo = FileInfo.fromObject(rowData);
    if (fileInfo.type === FileType.Folder) {
      this.redirectTo(this.nextPath(rowData.name));
    } else {
      this.toggleFile(fileInfo);
    }
  }

  @AtomicAction()
  private toggleFile(file: FileInfo) {
    const pathFile = this.toPathFile(file);
    const checked = this.selectedPaths.has(pathFile);
    if (checked) {
      this.selectedPaths.delete(pathFile);
    } else {
      this.selectedPaths.add(pathFile);
    }
    this.$emit('selectedFilesChanged', Array.from(this.selectedPaths.values()));
    this.fileTable?.reRender();
  }
  @MethodProfiler({ name: 'SourceSelection:redirectTo' })
  private redirectTo(path: string) {
    Log.debug('path ne::', path);
    this.initBreadcrumbs(path);
    this.resetOnRedirect();
    // this.loadFileListing({ ...this.getListFileRequest, path: path });
    //todo: check here
    this.$router.push({
      query: {
        ...this.$route.query,
        ...this.queryFromListFileRequest,
        path: path
      }
    });
  }

  private resetOnRedirect() {
    // this.selectedPaths.clear();
    this.from = 0;
    this.size = DefaultPaging.DefaultPageSize;
    this.keyword = '';
    this.searchInput?.setTextInput('');
  }

  private handleKeywordChange(keyword: string) {
    this.keyword = keyword;
    this.loadFileListing(this.getListFileRequest);
  }

  private async loadFileListing(getListFileRequest: GetListFileRequest) {
    try {
      this.showLoading();
      await LakeExplorerModule.loadFileListing({ getListFileRequest: getListFileRequest, root: this.root });
      this.showLoaded();
    } catch (e) {
      const exception = DIException.fromObject(e);
      this.showError(exception.message);
      Log.error('LakeExplorer::loadFileListing::exception::', exception.message);
      throw new DIException(exception.message);
    }
  }

  private async reloadFileListing() {
    await LakeExplorerModule.loadFileListing({ getListFileRequest: this.getListFileRequest, root: this.root });
  }

  private showLoading() {
    const fileIsEmpty = ListUtils.isEmpty(this.records);
    if (fileIsEmpty) {
      this.tableStatus = Status.Loading;
    } else {
      this.tableStatus = Status.Updating;
    }
  }

  private showLoaded() {
    this.tableStatus = Status.Loaded;
  }

  private showError(message: string) {
    this.tableStatus = Status.Error;
    this.tableErrorMessage = message;
  }

  private async handlePageChange(pagination: Pagination) {
    try {
      this.showLoading();
      this.from = (pagination.page - 1) * pagination.rowsPerPage;
      this.size = pagination.rowsPerPage;
      await this.reloadFileListing();
      this.showLoaded();
    } catch (e) {
      Log.error(`UserProfile paging getting an error: ${e?.message}`);
      this.showError(e.message);
    }
  }

  private initBreadcrumbs(fullPath: string) {
    const folderNames = fullPath.replace(this.root, '').split('/');

    const breadcrumbs: Breadcrumbs[] = [];
    let path = this.root;
    folderNames.map(folderName => {
      path = RouterUtils.join(path, folderName);
      if (StringUtils.isNotEmpty(folderName)) {
        const breadcrumb = new Breadcrumbs({
          text: folderName,
          to: { query: { ...this.queryFromListFileRequest, path: RouterUtils.normalizePath(path) }, disabled: false }
        });
        breadcrumbs.push(breadcrumb);
      }
    });
    this.breadcrumbs = breadcrumbs;
  }

  private toPathFile(file: FileInfo) {
    const { name, type } = file;
    const isFolder = type === FileType.Folder;
    const fileName = isFolder ? FileInfo.ALL_FILE_PATH : '';
    // Log.debug('toPathFile', this.currentPath, name, fileName);
    return RouterUtils.normalizePath(`${this.currentPath}/${name}${fileName}`);
  }
}
</script>

<style lang="scss">
@import '~@/themes/scss/mixin';

.source-selection.di-right-panel {
  height: 420px !important;
  max-height: 420px;
}

.source-selection {
  header {
    > .data-source-title {
      align-items: center;
      display: flex;
      flex: 1;
      font-size: 24px;
      font-stretch: normal;
      font-style: normal;
      font-weight: 500;
      letter-spacing: 0.2px;
      line-height: 1.17;
      overflow: hidden;

      > .root-title {
        align-items: center;
        display: flex;

        > i {
          color: var(--directory-header-icon-color);
          margin-right: 16px;
        }
      }
    }

    .search-file-input {
      .form-control {
        background: var(--secondary);
        padding-right: 0;
        width: 175px;

        @media screen and (max-width: 500px) {
          width: 100px;
        }
      }
    }

    .icon {
      font-size: 16px;
      opacity: 1;
    }

    .btn-icon-text {
      margin-right: 12px;
    }

    > #create-data-source {
      padding: 0;

      &.hide {
        display: none !important;
      }

      &:hover,
      &:active {
        background: unset !important;
      }
    }
  }

  .source-select--body {
    height: 100%;
    overflow: hidden;
    .di-table {
      height: 100%;
      overflow: hidden;
    }
  }
}
</style>
