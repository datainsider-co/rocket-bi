<template>
  <LayoutContent>
    <LakeExplorerHeader
      ref="explorerHeader"
      :title="title"
      :icon="icon"
      :breadcrumbs="breadcrumbs"
      :delete-title="deleteTitle"
      :enable-delete="haveSelectedFile"
      :enable-move="haveSelectedFile"
      :enable-refresh="!isShowFileDetail"
      :enable-search="!isShowFileDetail"
      class="header-container"
      @onDelete="handleClickDeleteOnActionBar"
      @onMove="handleClickMoveActionBar"
      @onRefresh="handleRefresh(currentPath)"
      @onSearch="handleKeywordChange"
    ></LakeExplorerHeader>
    <FileBrowser
      v-show="isShowFileDetail"
      ref="fileBrowser"
      class="h-100 w-100 layout-content-panel"
      @deleted="handleFileDeleted"
      @renamed="handleFileRenamed"
      @download="handleDownloadFile"
    />
    <div v-show="!isShowFileDetail" class="h-100 w-100 layout-content-panel">
      <!--          v-else-->
      <DiTable
        id="data-source-listing"
        ref="fileExplore"
        :error-msg="tableErrorMessage"
        :headers="fileListingHeader"
        :isShowPagination="true"
        :defaultRowPerPage="size"
        :records="fileListing"
        :status="tableStatus"
        :total="record"
        class="data-source-table w-100"
        @onClickRow="onClickRow"
        @onPageChange="handlePageChange"
        @onRetry="onPathChanged(currentPath)"
        @onRightClickRow="handleRightClick"
        @onSortChanged="handleSortChanged"
      >
        <template #empty>
          <div class="h-100 select-datasource-type-panel d-flex justify-content-center flex-column align-items-center">
            <div v-if="isSearchMode" class="action justify-content-center d-flex flex-column">
              <img src="@/assets/icon/ic_search.svg" style="width: 39px; margin: auto" />
              <div class="action d-flex flex-column">
                <span>No files found</span>
              </div>
            </div>
            <div v-else>
              <EmptyLakeExplorerIcon />
              <div v-if="root === '/'" class="action d-flex flex-column">
                <span>Your file and folder is empty</span>
                <span>
                  <a href="#" @click="openFileCreationModal">Click here</a>
                  to create new file or folder
                </span>
              </div>
              <div v-else class="action d-flex flex-column">
                <span>Your trash is empty</span>
              </div>
            </div>
          </div>
        </template>
      </DiTable>
      <FolderCreationModal ref="folderCreationModal" @createDirectory="handleCreateDirectory"></FolderCreationModal>
      <ContextMenu
        id="lake-explorer-menu"
        ref="diContextMenu"
        :ignoreOutsideClass="listIgnoreClassForContextMenu"
        minWidth="168px"
        textColor="var(--text-color)"
      />
      <LakeExplorerMoveFile ref="lakeExplorerMoveFile" :current-path="currentPath" />
      <ViewPropertiesModal ref="viewPropertiesModal"></ViewPropertiesModal>
      <DiRenameModal ref="diRenameModal" @rename="handleRenameFile"></DiRenameModal>
    </div>
  </LayoutContent>
</template>

<script lang="ts">
import { Component, Prop, Ref, Vue, Watch } from 'vue-property-decorator';
import { Breadcrumbs, CustomCell, CustomHeader, HeaderData, IndexedHeaderData, Pagination, RowData } from '@/shared/models';
import DiButton from '@/shared/components/Common/DiButton.vue';
import { ContextMenuItem, DefaultPaging, Routers, Status } from '@/shared';
import { Log } from '@core/utils';
import StatusWidget from '@/shared/components/StatusWidget.vue';
import { PopupUtils } from '@/utils/popup.utils';
import { HtmlElementRenderUtils } from '@/utils/HtmlElementRenderUtils';
import { ListUtils } from '@/utils';
import { DIException, SortDirection } from '@core/domain';
import { DateTimeCell, UserAvatarCell } from '@/shared/components/Common/DiTable/CustomCell';
import { LakeExplorerModule } from '@/screens/LakeHouse/store/LakeExplorerStore';
import { FileInfo, FileType } from '@core/LakeHouse/Domain/FileInfo/FileInfo';
import RightPanel from '@/screens/LakeHouse/Components/FileBrowser/RightPanel.vue';
import FolderCreationModal from '@/screens/LakeHouse/Components/FolderCreationModal.vue';
import DiIconTextButton from '@/shared/components/Common/DiIconTextButton.vue';
import ContextMenu from '@/shared/components/ContextMenu.vue';
import { SizeDataCell } from '@/shared/components/Common/DiTable/CustomCell/SizeDataCell';
import { FileCell } from '@/shared/components/Common/DiTable/CustomCell/FileCell';
import { DeleteMode, DeleteRequest, FileAction, GetListFileRequest } from '@core/LakeHouse/Domain';
import BreadcrumbComponent from '@/screens/Directory/components/BreadcrumbComponent.vue';
import { StringUtils } from '@/utils/string.utils';
import FileBrowser from '@/screens/LakeHouse/views/LakeExplorer/FileBrowser.vue';
import { Inject } from 'typescript-ioc';
import { FileBrowserService } from '@core/LakeHouse';
import { Modals } from '@/utils/modals';
import ViewPropertiesModal from '@/screens/LakeHouse/Components/FileBrowser/ViewPropertiesModal.vue';
import DiRenameModal from '@/shared/components/DiRenameModal.vue';
import { RenameRequest } from '@core/LakeHouse/Domain/Request/RenameRequest';
import { RouterUtils } from '@/utils/RouterUtils';
import { CreateDirectoryRequest } from '@core/LakeHouse/Domain/Request/CreateDirectoryRequest';
import EmptyDataIcon from '@/shared/components/Icon/EmptyDataIcon.vue';
import EmptyLakeExplorerIcon from '@/shared/components/Icon/EmptyLakeExplorerIcon.vue';
import LakeExplorerMoveFile, { FolderActionMode } from '@/screens/LakeHouse/Components/MoveFile/LakeExplorerMoveFile.vue';
import { LakeExplorerTrashPath } from '@/screens/LakeHouse/LakeHouseConstant';
import DiTable from '@/shared/components/Common/DiTable/DiTable.vue';
import LakeExplorerHeader from '@/screens/LakeHouse/views/LakeHouse/LakeExplorerHeader.vue';
import { LayoutContent } from '@/shared/components/LayoutWrapper';
import { Track } from '@/shared/anotation/TrackingAnotation';
import { TrackEvents } from '@core/tracking/enum/TrackEvents';
import { TrackingUtils } from '@core/tracking/TrackingUtils';

@Component({
  components: {
    LakeExplorerMoveFile,
    ContextMenu,
    EmptyLakeExplorerIcon,
    EmptyDataIcon,
    FileBrowser,
    BreadcrumbComponent,
    DiIconTextButton,
    DiRenameModal,
    FolderCreationModal,
    ViewPropertiesModal,
    RightPanel,
    StatusWidget,
    DiButton,
    LakeExplorerHeader,
    LayoutContent
  }
})
export default class LakeExplorer extends Vue {
  private static readonly cellWidthUnit = 150;
  private static readonly moreContextMenuXPosition = 37;
  @Prop()
  router!: Routers;
  @Prop({ required: true, type: String })
  root!: string;
  // private readonly root = '/';
  private listIgnoreClassForContextMenu = ['action-more'];
  private selectedFilesAsMap: Map<string, FileInfo> = new Map<string, FileInfo>();
  private haveSelectedFile = false;
  private keyword = '';
  private sortDirection: SortDirection = SortDirection.Asc;
  private sortBy = '';
  private isShowFileDetail = false;
  private from = 0;
  private size = DefaultPaging.DefaultLakePageSize;
  private tableErrorMessage = '';
  private tableStatus: Status = Status.Loaded;
  private breadcrumbs: Breadcrumbs[] = [];
  @Ref()
  private readonly folderCreationModal?: FolderCreationModal;
  @Ref()
  private readonly diContextMenu?: ContextMenu;
  @Ref()
  private readonly explorerHeader!: LakeExplorerHeader;
  @Ref()
  private readonly viewPropertiesModal?: ViewPropertiesModal;
  @Ref()
  private readonly fileBrowser!: FileBrowser;
  @Ref()
  private readonly diRenameModal?: DiRenameModal;
  @Ref()
  private readonly lakeExplorerMoveFile!: LakeExplorerMoveFile;
  @Ref()
  private readonly moveFileButton!: DiIconTextButton;

  @Ref()
  private readonly fileExplore!: DiTable;
  @Inject
  private readonly fileBrowserService!: FileBrowserService;

  get currentPath(): string {
    const path = this.$route.query.path ?? RouterUtils.normalizePath(this.root);
    return RouterUtils.normalizePath(path as string);
  }

  private get title() {
    return this.isLakeExplorer ? 'All Files' : 'Trash';
  }

  private get icon() {
    return this.isLakeExplorer ? 'di-icon-user' : 'di-icon-delete';
  }

  private get fileListingHeader(): HeaderData[] {
    return [
      {
        key: 'radio',
        label: '',
        disableSort: true,
        width: LakeExplorer.cellWidthUnit / 3,
        customRenderHeader: new CustomHeader(header => {
          return HtmlElementRenderUtils.renderCheckBox(this.isFileSelectAll(), e => {
            this.handleCheckAll(e);
          });
        }),
        customRenderBodyCell: new CustomCell((rowData: RowData, rowIndex: number, header: IndexedHeaderData, columnIndex: number) => {
          const fileInfo = FileInfo.fromObject(rowData);
          if (FileInfo.isParentDirectory(fileInfo.name)) {
            return '';
          }
          return HtmlElementRenderUtils.renderCheckBox(this.isFileSelected(fileInfo), e => {
            e.stopPropagation();
            PopupUtils.hideAllPopup();
            Log.debug('Radio::RowData::', rowData);
            this.onClickRadioDirectory(e, rowData);
          });
        })
      },
      {
        key: 'name',
        label: 'Name',
        customRenderBodyCell: new FileCell('name', 'type')
      },

      {
        key: 'user',
        label: 'User',
        width: LakeExplorer.cellWidthUnit * 2,
        customRenderBodyCell: new UserAvatarCell('owner.avatar', ['creator'], false, false)
      },
      // {
      //   key: 'group',
      //   label: 'Group',
      //   width: LakeExplorer.cellWidthUnit * 1.5,
      //   disableSort: true
      // },
      // {
      //   key: 'permission',
      //   label: 'Permission',
      //   disableSort: true,
      //   width: LakeExplorer.cellWidthUnit
      // },
      {
        key: 'date',
        label: 'Date Time',
        customRenderBodyCell: new DateTimeCell(),
        width: LakeExplorer.cellWidthUnit * 1.5
      },
      {
        key: 'size',
        label: 'Size',
        width: LakeExplorer.cellWidthUnit,
        customRenderBodyCell: new SizeDataCell('sizeInByte')
      },
      {
        key: 'action',
        label: '',
        disableSort: true,
        width: LakeExplorer.cellWidthUnit / 3,
        customRenderBodyCell: new CustomCell(this.renderDataSourceAction)
      }
    ];
  }

  private get isSearchMode(): boolean {
    return StringUtils.isNotEmpty(this.keyword);
  }

  private get isLakeExplorer() {
    return this.router === Routers.LakeExplorer;
  }

  private get record(): number {
    return LakeExplorerModule.totalRecord;
  }

  private get fileListing(): FileInfo[] {
    return LakeExplorerModule.fileListing;
    // return [];
  }

  private get isLoaded() {
    return this.tableStatus === Status.Loaded;
  }

  private get isLoading() {
    return this.tableStatus === Status.Loading || this.tableStatus === Status.Updating;
  }

  private get isEmptyData(): boolean {
    return ListUtils.isEmpty(this.fileListing);
    // return true;
  }

  private get isTrashPath() {
    const trashPath = LakeExplorerTrashPath;
    return RouterUtils.isSamePath(trashPath, this.currentPath);
  }

  private get getListFileRequest(): GetListFileRequest {
    return GetListFileRequest.fromSortDirection(this.currentPath, this.keyword, this.from, this.size, this.sortBy, this.sortDirection);
  }

  private get queryFromListFileRequest() {
    return {
      ...this.getListFileRequest,
      from: this.from.toString(),
      size: this.size.toString(),
      sortMode: this.sortDirection.toString(),
      sortBy: this.sortBy
    };
  }

  private get deleteTitle(): string {
    return this.isTrashPath ? 'Delete forever' : 'Move to trash';
  }

  async created() {
    // this.initBreadcrumbs(this.currentPath);
    // await this.loadFileListing(this.getListFileRequest);
    await this.onPathChanged(this.currentPath);
  }

  @Track(TrackEvents.LakeSelectDirectory, { path: (_: LakeExplorer, args: any) => args[0] })
  @Watch('currentPath')
  async onPathChanged(currentPath: string) {
    this.$nextTick(async () => {
      try {
        this.showLoading();
        this.fileBrowser.setLoading();
        this.reset();
        this.initBreadcrumbs(currentPath);
        const fileInfo = await LakeExplorerModule.getPathInfo(currentPath);
        if (fileInfo.type === FileType.File) {
          this.showFileDetail(currentPath);
        } else {
          this.isShowFileDetail = false;
          await LakeExplorerModule.loadFileListing({
            getListFileRequest: this.getListFileRequest,
            root: RouterUtils.normalizePath(this.root)
          });
        }
        this.showLoaded();
        Log.debug('onChangePath::', currentPath);
      } catch (e) {
        this.showError(e.message);
        Log.error('LakeExplorer::onChangePath::error::', e.message);
      }
    });
  }

  @Track(TrackEvents.LakeExplorerRefresh, { path: (_: LakeExplorer, args: any) => args[0] })
  async handleRefresh(currentPath: string) {
    this.$nextTick(async () => {
      try {
        this.showUpdating();
        this.resetOnRefresh();
        this.isShowFileDetail = false;
        await LakeExplorerModule.loadFileListing({
          getListFileRequest: this.getListFileRequest,
          root: RouterUtils.normalizePath(this.root)
        });
        this.showLoaded();
        Log.debug('handleRefresh::', currentPath);
      } catch (e) {
        this.showError(e.message);
        Log.error('LakeExplorer::handleRefresh::error::', e.message);
      }
    });
  }

  @Watch('selectedFilesAsMap.size')
  onChangeSize(size: number) {
    if (size === 0) {
      this.haveSelectedFile = false;
    }
  }

  showAction() {
    this.haveSelectedFile = true;
  }

  hideAction() {
    this.haveSelectedFile = false;
  }

  private containFile(): boolean {
    return this.selectedFilesAsMap.size > 0;
  }

  private isFileSelectAll(): boolean {
    return this.selectedFilesAsMap.size == this.fileListing.filter(file => file.name !== FileInfo.PARENT_DIRECTORY_NAME).length;
  }

  private getActionMoreMenuItem(fileInfo: FileInfo, event: Event): ContextMenuItem[] {
    let actionMoreMenu: ContextMenuItem[] = [
      {
        text: 'Rename',
        click: () => {
          this.diContextMenu?.hide();
          this.showDiRenameModal(fileInfo);
        }
      },
      {
        text: 'Copy',
        click: () => {
          this.diContextMenu?.hide();
          this.handleClickCopy(event, fileInfo);
        }
      },
      {
        text: 'Move to',
        click: () => {
          this.diContextMenu?.hide();
          this.handleClickMoveActionMore(event, fileInfo);
        }
      },
      {
        text: 'Download',
        click: () => {
          this.diContextMenu?.hide();
          this.handleDownloadFile(this.nextPath(fileInfo.name));
        }
      },
      {
        text: 'Move to trash',
        click: () => {
          Log.debug('Delete::FileInfo::', fileInfo);
          this.diContextMenu?.hide();
          this.handleClickDelete(fileInfo, DeleteMode.MoveTrash);
        }
      },
      {
        text: 'Delete forever',
        click: () => {
          Log.debug('Delete::FileInfo::', fileInfo);
          this.diContextMenu?.hide();
          this.handleClickDelete(fileInfo, DeleteMode.DeleteForever);
        }
      },
      {
        text: 'Properties',
        click: () => {
          this.diContextMenu?.hide();
          this.handleClickProperties(this.nextPath(fileInfo.name));
        }
      }
    ];
    if (fileInfo.isFolder) {
      actionMoreMenu = ListUtils.remove(actionMoreMenu, item => item.text === 'Download');
    }

    if (this.router === Routers.LakeExplorerTrash) {
      actionMoreMenu = ListUtils.remove(actionMoreMenu, item => item.text === 'Move to trash');
    }
    return actionMoreMenu;
  }

  private nextPath(fileName: string): string {
    if (FileInfo.isParentDirectory(fileName)) {
      const folderNames = this.currentPath.replace(RouterUtils.normalizePath(this.root), '').split('/');
      folderNames.pop();
      return RouterUtils.join(RouterUtils.normalizePath(this.root), folderNames.join('/'));
    } else {
      return RouterUtils.normalizePath(RouterUtils.join(this.currentPath, fileName));
    }
  }

  @Track(TrackEvents.DirectoryViewProperties, { path: (_: LakeExplorer, args: any) => args[0] })
  private handleClickProperties(pathFile: string): void {
    this.viewPropertiesModal?.show(pathFile);
  }

  private redirectToRoot() {
    // if (!RouterUtils.comparePath(this.currentPath, this.root)) {
    this.redirectTo(RouterUtils.normalizePath(this.root));
    // }
  }

  private handleCheckAll(e: MouseEvent) {
    try {
      e.stopPropagation();
      if (this.isFileSelectAll()) {
        this.clearFileSelected();
      } else {
        this.pickAllFile();
      }
      this.reRenderFileAction(this.containFile());
      this.fileExplore.reRender();
      Log.debug('handleCheckAll', this.selectedFilesAsMap);
    } catch (e) {
      Log.error(e);
    }
  }

  private pickAllFile() {
    this.selectedFilesAsMap = new Map(this.fileListing.filter(file => file.name !== FileInfo.PARENT_DIRECTORY_NAME).map(file => [file.name, file]));
  }

  private clearFileSelected() {
    this.selectedFilesAsMap.clear();
  }

  private onClickRadioDirectory(e: MouseEvent, rowData: RowData) {
    const file = FileInfo.fromObject(rowData);
    const isSelected = this.isFileSelected(file);
    this.toggleFile(isSelected, file);
    this.reRenderRadioButton(e, !isSelected);
    this.reRenderFileAction(this.containFile());
    Log.debug('onClickRadioDirectory::', this.haveSelectedFile);
  }

  private toggleFile(isSelected: boolean, file: FileInfo) {
    if (isSelected) {
      this.selectedFilesAsMap.delete(file.name);
    } else {
      this.selectedFilesAsMap.set(file.name, file);
    }
  }

  private openFileCreationModal() {
    this.folderCreationModal?.show();
  }

  private async handleCreateDirectory(directoryName: string, groupName: string) {
    try {
      this.folderCreationModal?.showLoading();
      const response = await this.fileBrowserService.action(FileAction.NewFolder, new CreateDirectoryRequest(this.currentPath ?? '/', directoryName));
      LakeExplorerModule.updateListingOnCreateNew(response.data as FileInfo);
      this.resetSelectedFiles();
      this.folderCreationModal?.hide();
      this.folderCreationModal?.showLoaded();
    } catch (e) {
      Log.error('LakeExplorer::handleCreateDirectory::error::', e.message);
      this.folderCreationModal?.showError(e.message);
    }
  }

  private renderDataSourceAction(rowData: RowData, rowIndex: number, header: IndexedHeaderData, columnIndex: number): HTMLElement | HTMLElement[] | string {
    //TODO: FIX
    if (rowData.name === '..') {
      return '';
    }
    Log.debug('renderRowData::', rowData);
    const file: FileInfo = FileInfo.fromObject(rowData);
    const id = file.name + rowIndex;
    const moreButton = HtmlElementRenderUtils.renderIcon('di-icon-three-dot-horizontal btn-icon-border action-more icon-action', (e: MouseEvent) =>
      this.showContextMenu(e, file, id)
    );
    moreButton.setAttribute('data-title', 'More');
    moreButton.setAttribute('id', id);
    return moreButton;
  }

  private showContextMenu(event: MouseEvent, fileInfo: FileInfo, targetId: string) {
    event.stopPropagation();
    PopupUtils.hideAllPopup();
    const buttonEvent = HtmlElementRenderUtils.fixMenuOverlap(event, targetId, LakeExplorer.moreContextMenuXPosition);
    const items = this.getActionMoreMenuItem(fileInfo, buttonEvent);
    this.diContextMenu?.show(buttonEvent, items);
  }

  private onClickRow(rowData: RowData) {
    Log.debug('LakeExplorer::onClickRow::', rowData);
    if (rowData.type === FileType.File) {
      this.isShowFileDetail = true;
    } else {
      this.isShowFileDetail = false;
    }
    this.redirectTo(this.nextPath(rowData.name));
  }

  private redirectTo(path: string) {
    RouterUtils.to(this.router, { query: { ...this.queryFromListFileRequest, path: path } });
  }

  private reset() {
    this.selectedFilesAsMap.clear();
    this.haveSelectedFile = false;
    this.isShowFileDetail = false;
    this.from = 0;
    this.size = DefaultPaging.DefaultLakePageSize;
    this.keyword = '';
    this.explorerHeader!.resetSearchInput();
  }

  private resetOnRefresh() {
    this.selectedFilesAsMap.clear();
    this.haveSelectedFile = false;
    this.isShowFileDetail = false;
  }

  private resetSelectedFiles() {
    this.selectedFilesAsMap.clear();
    this.haveSelectedFile = false;
  }

  private handleKeywordChange(keyword: string) {
    this.keyword = keyword;
    this.from = 0;
    this.loadFileListing(this.getListFileRequest);
  }

  private async loadFileListing(getListFileRequest: GetListFileRequest) {
    try {
      this.showLoading();
      await LakeExplorerModule.loadFileListing({
        getListFileRequest: getListFileRequest,
        root: RouterUtils.normalizePath(this.root)
      });
      this.tableStatus = Status.Loaded;
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
    this.tableStatus = Status.Loading;
  }

  private showUpdating() {
    this.tableStatus = Status.Updating;
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
      this.showUpdating();
      this.resetSelectedFiles();
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
    const folderNames = fullPath.replace(RouterUtils.normalizePath(this.root), '').split('/');

    const breadcrumbs: Breadcrumbs[] = [];
    let path = RouterUtils.normalizePath(this.root);
    folderNames.map(folderName => {
      path = RouterUtils.join(path, folderName);
      if (StringUtils.isNotEmpty(folderName)) {
        const breadcrumb = new Breadcrumbs({
          text: folderName,
          to: {
            name: this.router,
            query: { ...this.queryFromListFileRequest, path: RouterUtils.normalizePath(path), from: 0 },
            disabled: false
          }
        });
        breadcrumbs.push(breadcrumb);
      }
    });
    this.breadcrumbs = breadcrumbs;
  }

  private async showFileDetail(currentPath: string) {
    this.isShowFileDetail = true;
    return await this.fileBrowser.handleLoadFile(currentPath);
  }
  private async handleDeleteFiles(fileNames: string[], mode: DeleteMode) {
    try {
      this.showLoading();
      this.trackDirectoryDeleteEvent(fileNames, mode);
      for (let iterator = 0; iterator < fileNames.length; iterator++) {
        const absolutePath = this.nextPath(fileNames[iterator]);
        const deleteRequest = this.createDeleteRequest(absolutePath, mode);
        await this.fileBrowserService.action(FileAction.Delete, deleteRequest);
        Log.debug('selectedPath::', this.selectedFilesAsMap);
      }
      this.resetSelectedFiles();
      await this.loadFileListing(this.getListFileRequest);
      this.trackDirectoryDeleteEventOk(fileNames, mode);
      this.showLoaded();
    } catch (ex) {
      Log.error('LakeExplorer::handleDeleteFile::error::', ex.message);
      const exception = DIException.fromObject(ex);
      this.showError(ex.message);
      PopupUtils.showError(exception.message);
      this.trackDirectoryDeleteEventFail(fileNames, mode);
    }
  }

  private trackDirectoryDeleteEvent(fileNames: string[], mode: DeleteMode) {
    switch (mode) {
      case DeleteMode.DeleteForever:
        TrackingUtils.track(TrackEvents.DirectoryHardRemove, {
          file_names: fileNames.join(','),
          path: this.currentPath
        });
        break;
      case DeleteMode.MoveTrash:
        TrackingUtils.track(TrackEvents.DirectoryMoveToTrash, {
          file_names: fileNames.join(','),
          path: this.currentPath
        });
        break;
    }
  }

  private trackDirectoryDeleteEventOk(fileNames: string[], mode: DeleteMode) {
    switch (mode) {
      case DeleteMode.DeleteForever:
        TrackingUtils.track(TrackEvents.DirectoryHardRemoveOk, {
          file_names: fileNames.join(','),
          path: this.currentPath
        });
        break;
      case DeleteMode.MoveTrash:
        TrackingUtils.track(TrackEvents.DirectoryMoveToTrashOk, {
          file_names: fileNames.join(','),
          path: this.currentPath
        });
        break;
    }
  }

  private trackDirectoryDeleteEventFail(fileNames: string[], mode: DeleteMode) {
    switch (mode) {
      case DeleteMode.DeleteForever:
        TrackingUtils.track(TrackEvents.DirectoryHardRemoveFail, {
          file_names: fileNames.join(','),
          path: this.currentPath
        });
        break;
      case DeleteMode.MoveTrash:
        TrackingUtils.track(TrackEvents.DirectoryMoveToTrashFail, {
          file_names: fileNames.join(','),
          path: this.currentPath
        });
        break;
    }
  }

  private createDeleteRequest(path: string, mode: DeleteMode) {
    if (mode === DeleteMode.MoveTrash) {
      return DeleteRequest.moveToTrash(path);
    } else {
      return DeleteRequest.deleteForever(path);
    }
  }

  private handleRightClick(mouseEvent: any) {
    Log.debug('handleRightClick::', mouseEvent);
  }

  @Track(TrackEvents.LakeDirectoryMoveToTrash, { file_name: (_: LakeExplorer, args: any) => args[0].name })
  private handleClickDelete(fileInfo: FileInfo, mode: DeleteMode): void {
    const hasSelected = this.selectedFilesAsMap.has(fileInfo.name);
    const filenames = hasSelected ? [...this.selectedFilesAsMap.keys()] : [fileInfo.name];
    Modals.showConfirmationModal(this.getDeleteMessage(filenames.length, mode), {
      onOk: () => this.handleDeleteFiles(filenames, mode)
    });
  }

  private getDeleteMessage(totalFile: number, mode: DeleteMode): string {
    return mode === DeleteMode.DeleteForever ? `Are you sure to delete ${totalFile} items forever` : `Are you sure to move ${totalFile} items to trash`;
  }

  @Track(TrackEvents.LakeDirectoryMoveToTrash, { files: (_: LakeExplorer, args: any) => [..._.selectedFilesAsMap.keys()].join(',') })
  private handleClickDeleteOnActionBar() {
    const fileNamesToDelete = [...this.selectedFilesAsMap.keys()];
    const mode = this.isTrashPath ? DeleteMode.DeleteForever : DeleteMode.MoveTrash;
    Modals.showConfirmationModal(this.getDeleteMessage(fileNamesToDelete.length, mode), {
      onOk: () => this.handleDeleteFiles(fileNamesToDelete, mode)
    });
  }

  @Track(TrackEvents.LakeDirectoryMove, {
    file_names: (_: LakeExplorer, args: any) => _.selectedFilesAsMap.forEach((value, key) => value.name),
    path: (_: LakeExplorer, args: any) => _.currentPath
  })
  private handleClickMoveActionBar(payload: { event: Event; id: string }) {
    try {
      const { event, id } = payload;
      const fileNames = [...this.selectedFilesAsMap.keys()];
      const eventWithPositions = HtmlElementRenderUtils.fixMenuOverlap(event, id);
      this.showActionModal(eventWithPositions, fileNames, FolderActionMode.Move);
    } catch (e) {
      Log.error(e);
    }
  }

  private showActionModal(event: Event, fileNames: string[], action: FolderActionMode) {
    const paths = fileNames.map(name => this.nextPath(name));
    this.lakeExplorerMoveFile.show(event, fileNames, paths, action);
  }

  private handleFileRenamed(newPath: string) {
    Log.debug('handleFileRenamed::', newPath);
    this.redirectTo(newPath);
  }

  private handleFileDeleted(newPath: string) {
    Log.debug('handleFileDeleted::', newPath);
    this.redirectTo(newPath);
  }

  private showDiRenameModal(fileInfo: FileInfo) {
    this.diRenameModal?.show(fileInfo.name, fileInfo);
  }

  @Track(TrackEvents.LakeDirectoryRename, {
    file_name: (_: LakeExplorer, args: any) => args[1].name,
    path: (_: LakeExplorer, args: any) => _.nextPath(args[1].name)
  })
  private async handleRenameFile(newName: string, fileInfo: FileInfo) {
    try {
      Log.debug('LakeExplorer::handleRenameFile::', newName, fileInfo);
      this.diRenameModal?.setLoading(true);
      await this.fileBrowserService.action(FileAction.Rename, new RenameRequest(this.nextPath(fileInfo.name), newName));
      LakeExplorerModule.updateListingOnRename({ renamedFileInfo: fileInfo, newName: newName });
      this.diRenameModal?.setLoading(false);
      this.resetSelectedFiles();

      this.diRenameModal?.hide();
      TrackingUtils.track(TrackEvents.DirectoryRenameOk, {
        directory_new_name: newName,
        directory_old_name: fileInfo.name,
        path: this.nextPath(fileInfo.name)
      });
    } catch (ex) {
      this.diRenameModal?.setLoading(false);
      Log.error('handleRenameFile::', ex);
      this.diRenameModal?.setError(ex.message);
      TrackingUtils.track(TrackEvents.DirectoryRenameFail, {
        directory_new_name: newName,
        directory_old_name: fileInfo.name,
        path: this.nextPath(fileInfo.name)
      });
    }
  }

  @Track(TrackEvents.LakeDirectoryMove, {
    file_names: (_: LakeExplorer, args: any) => args[1].name,
    path: (_: LakeExplorer, args: any) => _.currentPath
  })
  private handleClickMoveActionMore(event: Event, fileInfo: FileInfo) {
    const hasSelected = this.selectedFilesAsMap.has(fileInfo.name);
    const filenames = hasSelected ? [...this.selectedFilesAsMap.keys()] : [fileInfo.name];
    this.showActionModal(event, filenames, FolderActionMode.Move);
  }

  private handleClickCopy(event: Event, fileInfo: FileInfo) {
    const hasSelected = this.selectedFilesAsMap.has(fileInfo.name);
    const filenames = hasSelected ? [...this.selectedFilesAsMap.keys()] : [fileInfo.name];
    this.showActionModal(event, filenames, FolderActionMode.Copy);
    TrackingUtils.track(TrackEvents.LakeDirectoryCopy, { file_names: filenames.join(',') });
  }

  private isFileSelected(file: FileInfo): boolean {
    return this.selectedFilesAsMap.has(file.name);
  }

  private reRenderRadioButton(e: MouseEvent, isSelected: boolean) {
    if ((e.target as any).firstChild) {
      (e.target as any).firstChild.checked = isSelected;
    }
  }

  private reRenderFileAction(isShow: boolean) {
    if (isShow) {
      this.showAction();
    } else {
      this.hideAction();
    }
  }

  @Track(TrackEvents.FileDownload, { path: (_: FileBrowser, args: any) => args[0] })
  private async handleDownloadFile(path: string) {
    try {
      Log.debug('handleDownloadFile::path::', path);
      await RouterUtils.to(Routers.FileDownload, { query: { path: path } });
    } catch (e) {
      Log.error('LakeExplorer::handleDownloadFile::error::', e.message);
      PopupUtils.showError(e.message);
    }
  }

  private async handleSortChanged(column: HeaderData) {
    try {
      this.sortDirection = this.getSortDirection(this.sortBy, column);
      this.sortBy = StringUtils.toSnakeCase(column.key);
      Log.debug('handleSortChange::', this.sortBy, this.sortDirection);
      this.showUpdating();
      await this.reloadFileListing();
      this.showLoaded();
    } catch (e) {
      Log.error('LakeQueryInfo:: handleSortChange::', e);
      this.showError(e.message);
    }
  }

  private getSortDirection(currentSortedKey: string, column: HeaderData) {
    const { key } = column;
    const newSortKey = StringUtils.toSnakeCase(key);
    if (currentSortedKey === newSortKey) {
      return this.sortDirection === SortDirection.Asc ? SortDirection.Desc : SortDirection.Asc;
    } else {
      return SortDirection.Asc;
    }
  }
}
</script>

<style lang="scss">
@import '~@/themes/scss/mixin';
@import '~bootstrap/scss/bootstrap-grid';

.all-file {
  .header-container {
    .root-title {
      align-items: center;
      display: flex;

      > i {
        margin-right: 16px;
        color: var(--directory-header-icon-color);
      }
    }
  }

  .icon-action {
    padding: 4px;
  }

  .action {
    @include regular-text();
    font-size: 16px;
    margin-top: 26px;

    span {
      color: var(--secondary-text-color);
      line-height: 24px;
    }

    a {
      text-decoration: underline;
    }
  }

  .di-table {
    height: 100%;
  }
}
</style>
