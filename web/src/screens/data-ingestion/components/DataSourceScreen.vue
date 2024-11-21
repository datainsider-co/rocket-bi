<template>
  <LayoutContent>
    <LayoutHeader title="Data Sources" icon="di-icon-datasource">
      <div class="ml-auto d-flex align-items-center">
        <SearchInput :timeBound="400" class="search-input" hint-text="Search data source" @onTextChanged="handleKeywordChange" />
        <SlideXLeftTransition :duration="animationDuration" :delay="delay">
          <div v-if="enableMultiAction">
            <DiIconTextButton title="Delete" @click="handleConfirmDeleteMultiDataSource()" :event="trackEvents.JobIngestionRefresh">
              <i class="di-icon-delete job-action-icon"></i>
            </DiIconTextButton>
          </div>
        </SlideXLeftTransition>

        <DiIconTextButton title="Refresh" @click="handleRefresh" :event="trackEvents.DataSourceRefresh">
          <i class="di-icon-reset datasource-action-icon"></i>
        </DiIconTextButton>
      </div>
    </LayoutHeader>
    <div class="data-source layout-content-panel">
      <LayoutNoData v-if="isLoaded && isEmptyData" icon="di-icon-datasource">
        <template v-if="isActiveSearch">
          <div class="text-muted">
            No found data sources
          </div>
        </template>
        <template v-else>
          <div class="font-weight-semi-bold">No data yet</div>
          <div class="text-muted">
            <a href="#" @click.stop="openDatabaseSelection">Click here</a>
            to add Data Source
          </div>
        </template>
      </LayoutNoData>
      <DiTable2
        v-else
        id="data-source-listing"
        ref="dataSourceTable"
        :disable-sort="false"
        :error-msg="tableErrorMessage"
        :headers="dataSourceHeaders"
        :isShowPagination="true"
        :records="dataSourceListing"
        :status="tableStatus"
        :total="record"
        class="data-source-table"
        @onClickRow="onClickRow"
        @onPageChange="handlePageChange"
        @onRetry="loadDataSourceTable"
        @onSortChanged="handleSortChange"
        :padding-pagination="40"
      >
        <template #empty>
          <EmptyDirectory class="h-100"></EmptyDirectory>
        </template>
      </DiTable2>
    </div>
    <DataSourceConfigModal
      ref="dataSourceConfigModal"
      :data-source-render.sync="dataSourceFormRender"
      :isShow.sync="isShowDataSourceConfigModal"
      @onClickOk="handleSubmitDataSource"
      @reAuthen="handleReAuthen"
      @reset="handleResetDataSourceFormRender"
    ></DataSourceConfigModal>
    <DataSourceTypeSelection :is-show.sync="isShowDatabaseSelectionModal" @onDataSourceTypeSelected="handleSelectDataSource"></DataSourceTypeSelection>
    <DiUploadGoogleSheetComponent ref="diUp"></DiUploadGoogleSheetComponent>
    <S3SourceConfigModal ref="s3SourceModal" />
    <S3JobConfigModal :is-disabled-select-source="true" ref="s3JobConfigModal" />
    <S3PreviewTableModal ref="s3PreviewModal" />
    <JobConfigModal ref="jobConfigModal" :job-config-form-render="jobFormRenderer" title="Job config"></JobConfigModal>
    <JobCreationModal :is-disabled-select-source="true" ref="jobCreationModal" @submit="redirectToJobScreen"></JobCreationModal>
    <MultiJobCreationModal :is-disabled-select-source="true" ref="multiJobCreationModal" @submit="redirectToJobScreen"></MultiJobCreationModal>
    <DocumentModal ref="documentModal" />
  </LayoutContent>
</template>

<script lang="ts">
import EmptyDirectory from '@/screens/dashboard-detail/components/EmptyDirectory.vue';
import DataIngestionTable from '@/screens/data-ingestion/components/DataIngestionTable.vue';
import DataSourceConfigModal from '@/screens/data-ingestion/components/DataSourceConfigModal.vue';
import DataSourceItem from '@/screens/data-ingestion/components/DataSourceItem.vue';
import DataSourceTypeSelection from '@/screens/data-ingestion/components/DataSourceTypeSelection.vue';
import DiUploadDocumentActions from '@/screens/data-ingestion/components/di-upload-document/DiUploadDocumentActions';
import DiUploadGoogleSheetActions from '@/screens/data-ingestion/components/di-upload-google-sheet/actions';
import JobConfigModal from '@/screens/data-ingestion/components/JobConfigModal.vue';
import { TimeScheduler } from '@/screens/data-ingestion/components/job-scheduler-form/scheduler-time/TimeScheduler';
import S3JobConfigModal from '@/screens/data-ingestion/components/s3-csv/S3JobConfigModal.vue';
import S3SourceConfigModal from '@/screens/data-ingestion/components/s3-csv/S3SourceConfigModal.vue';
import S3PreviewTableModal from '@/screens/data-ingestion/components/S3PreviewTableModal.vue';
import { ALL_DATASOURCE } from '@/screens/data-ingestion/constants/Datasource';
import { DataSourceFormFactory } from '@/screens/data-ingestion/form-builder/DataSourceFormFactory';
import { DataSourceFormRender } from '@/screens/data-ingestion/form-builder/DataSourceFormRender';
import { JobFormRender } from '@/screens/data-ingestion/form-builder/JobFormRender';
import { DataSourceModule } from '@/screens/data-ingestion/store/DataSourceStore';
import { JobModule } from '@/screens/data-ingestion/store/JobStore';
import { ApiExceptions, DefaultPaging, ItemData, Routers, Status, VisualizationItemData } from '@/shared';
import { Track } from '@/shared/anotation';
import { AtomicAction } from '@core/common/misc';
import DiButton from '@/shared/components/common/DiButton.vue';
import DiTable2 from '@/shared/components/common/di-table/DiTable2.vue';
import { LayoutContent, LayoutHeader, LayoutNoData } from '@/shared/components/layout-wrapper';
import StatusWidget from '@/shared/components/StatusWidget.vue';
import { CustomCell, HeaderData, IndexedHeaderData, Pagination, RowData } from '@/shared/models';
import { DateTimeUtils, ListUtils, TimeoutUtils } from '@/utils';
import { HtmlElementRenderUtils } from '@/utils/HtmlElementRenderUtils';

import { Modals } from '@/utils/Modals';
import { PopupUtils } from '@/utils/PopupUtils';
import { StringUtils } from '@/utils/StringUtils';
import { TableTooltipUtils } from '@chart/custom-table/TableTooltipUtils';
import {
  DataSources,
  DataSourceType,
  FormMode,
  GoogleAdsSourceInfo,
  Job,
  S3Job,
  S3SourceInfo,
  SortRequest,
  TiktokAccessTokenResponse,
  TiktokSourceInfo
} from '@core/data-ingestion';
import { DataSourceInfo } from '@core/data-ingestion/domain/data-source/DataSourceInfo';
import { DataSourceResponse } from '@core/data-ingestion/domain/response/DataSourceResponse';
import { DIException, SortDirection, SourceId } from '@core/common/domain';
import { UnsupportedException } from '@core/common/domain/exception/UnsupportedException';
import { TrackEvents } from '@core/tracking/enum/TrackEvents';
import { TrackingUtils } from '@core/tracking/TrackingUtils';
import { Log } from '@core/utils';
import { cloneDeep } from 'lodash';
import { Component, Ref, Vue } from 'vue-property-decorator';
import DocumentModal from './DocumentModal.vue';
import { ThirdPartyType } from '@/shared/components/third-party-authentication/ThirdPartyType';
import { FacebookAdsSourceInfo } from '@core/data-ingestion/domain/data-source/FacebookAdsSourceInfo';
import { Inject } from 'typescript-ioc';
import { DataSourceService } from '@core/common/services/DataSourceService';
import { CheckBoxHeaderController, CheckBoxHeaderData } from '@/shared/components/common/di-table/custom-cell/CheckBoxHeaderData';
import { UserAvatarCell } from '@/shared/components/common/di-table/custom-cell';
import { SlideXLeftTransition } from 'vue2-transitions';
import { GASourceInfo } from '@core/data-ingestion/domain/data-source/GASourceInfo';
import { GA4SourceInfo } from '@core/data-ingestion/domain/data-source/GA4SourceInfo';
import { FacebookResponse, validFacebookResponse } from '@/shared/components/third-party-authentication/fb/FacebookResponse';
import JobCreationModal from '@/screens/data-ingestion/components/JobCreationModal.vue';
import { GoogleSearchConsoleSourceInfo } from '@core/data-ingestion/domain/data-source/GoogleSearchConsoleSourceInfo';
import MultiJobCreationModal from '@/screens/data-ingestion/components/MultiJobCreationModal.vue';
import { GoogleSearchConsoleJob } from '@core/data-ingestion/domain/job/google-search-console';

@Component({
  components: {
    S3JobConfigModal,
    JobConfigModal,
    DataIngestionTable,
    DataSourceItem,
    StatusWidget,
    DataSourceTypeSelection,
    DataSourceConfigModal,
    DiButton,
    EmptyDirectory,
    DiTable2,
    DocumentModal,
    LayoutContent,
    LayoutHeader,
    LayoutNoData,
    S3SourceConfigModal,
    S3PreviewTableModal,
    SlideXLeftTransition,
    JobCreationModal,
    MultiJobCreationModal
  }
})
export default class DataSourceScreen extends Vue {
  protected readonly trackEvents = TrackEvents;
  protected readonly animationDuration = 600;
  protected readonly delay = 20;
  @Ref()
  dataSourceTypeSelectionModal?: DataSourceTypeSelection;
  @Ref()
  dataSourceTable?: DiTable2;

  @Ref()
  documentModal!: DocumentModal;

  @Ref()
  s3SourceModal!: S3SourceConfigModal;

  @Ref()
  s3JobConfigModal!: S3JobConfigModal;

  @Ref()
  s3PreviewModal!: S3PreviewTableModal;

  @Ref()
  protected jobConfigModal!: JobConfigModal;

  @Ref()
  protected jobCreationModal!: JobCreationModal;

  @Ref()
  protected multiJobCreationModal!: MultiJobCreationModal;

  @Ref()
  protected dataSourceConfigModal!: DataSourceConfigModal;

  @Inject
  protected readonly dataSourceService!: DataSourceService;

  protected readonly allItems: ItemData[] = ALL_DATASOURCE;
  protected from = 0;
  protected size = DefaultPaging.DefaultPageSize;
  protected sortName = 'last_modified';
  protected sortMode: SortDirection = SortDirection.Desc;
  protected searchValue = '';
  protected isShowDatabaseSelectionModal = false;
  protected isShowDataSourceConfigModal = false;
  protected jobFormRenderer: JobFormRender = JobFormRender.default();
  protected tableErrorMessage = '';
  protected tableStatus: Status = Status.Loading;
  protected dataSourceFormRender: DataSourceFormRender = new DataSourceFormFactory().createRender(
    DataSourceInfo.createDefault(DataSourceType.MySql),
    this.handleSubmitDataSource
  );
  defaultDatasourceIcon = require('@/assets/icon/data_ingestion/datasource/ic_default.svg');
  protected checkboxController = new CheckBoxHeaderController();
  selectedIndexAsSet = new Set<SourceId>();
  enableMultiAction = false;
  protected readonly cellWidth = 180;

  onSelectedIndexChanged() {
    Log.debug('onSelectedIndexChanged', this.selectedIndexAsSet.size > 0);
    this.enableMultiAction = this.selectedIndexAsSet.size > 0;
  }

  beforeDestroy() {
    this.checkboxController.reset();
    this.onSelectedIndexChanged();
  }
  protected get dataSourceHeaders(): HeaderData[] {
    return [
      new CheckBoxHeaderData(
        this.selectedIndexAsSet,
        'dataSource.id',
        this.checkboxController,
        this.dataSources,
        {
          width: this.cellWidth / 3
        },
        this.onSelectedIndexChanged
      ),
      {
        key: 'name',
        label: 'Name',
        customRenderBodyCell: new CustomCell(rowData => {
          const dataSourceResponse = DataSourceResponse.fromObject(rowData);
          const data = dataSourceResponse.dataSource.getDisplayName();
          // eslint-disable-next-line
          const datasourceImage = require(`@/assets/icon/data_ingestion/datasource/${DataSourceInfo.dataSourceIcon(rowData.dataSource.sourceType)}`);

          const imgElement = HtmlElementRenderUtils.renderImg(datasourceImage, 'data-source-icon', this.defaultDatasourceIcon);
          const dataElement = HtmlElementRenderUtils.renderText(data, 'span', 'source-name text-truncate');
          return HtmlElementRenderUtils.renderAction([imgElement, dataElement], 8, 'source-name-container');
        })
      },
      {
        key: 'creatorId',
        label: 'Owner',
        customRenderBodyCell: new UserAvatarCell('creator.avatar', ['creator.fullName', 'creator.lastName', 'creator.email', 'creator.username']),
        width: 200
      },
      {
        key: 'dataSourceType',
        label: 'Type',
        customRenderBodyCell: new CustomCell(rowData => {
          const sourceType = DataSourceResponse.fromObject(rowData).dataSource.sourceType;
          return HtmlElementRenderUtils.renderText(sourceType, 'span', 'text-truncate');
        }),
        width: 180
      },
      {
        key: 'lastModified',
        label: 'Last Modified',
        customRenderBodyCell: new CustomCell(rowData => {
          const lastModify = DataSourceResponse.fromObject(rowData).dataSource.lastModify;
          const data = lastModify !== 0 ? DateTimeUtils.formatAsMMMDDYYYHHmmss(lastModify) : '--';
          return HtmlElementRenderUtils.renderText(data, 'span', 'text-truncate');
        }),
        width: 180
      },
      {
        key: 'action',
        label: 'Action',
        width: 120,
        disableSort: true
      }
    ];
  }

  protected get record(): number {
    return DataSourceModule.totalRecord;
  }

  protected get isActiveSearch() {
    return StringUtils.isNotEmpty(this.searchValue);
  }

  protected get dataSources(): DataSourceResponse[] {
    Log.debug('dataSources::', DataSourceModule.dataSources);
    return DataSourceModule.dataSources;
    // return []
  }
  protected get isLoaded() {
    return this.tableStatus === Status.Loaded;
  }

  protected get isEmptyData(): boolean {
    return ListUtils.isEmpty(this.dataSources);
    // return true
  }

  protected get dataSourceListing(): RowData[] {
    // return []
    return this.dataSources.map(dataSource => {
      Log.debug('DataSourceScreen::dataSourceListing::source::', dataSource.dataSource);
      return {
        ...dataSource,
        isExpanded: false,
        children: [],
        depth: 0,
        action: new CustomCell(this.renderDataSourceAction)
      };
    });
  }

  @Track(TrackEvents.DataSourceView)
  async created() {
    // await this.initFacebookClient(window.appConfig.VUE_APP_FACEBOOK_APP_ID);
    await this.loadDataSourceTable();
    this.dataSourceTable?.setSort('Last Modified', this.sortMode);
  }

  destroyed() {
    this.removeMessageEvent();
  }

  //todo: don't delete
  @Track(TrackEvents.DataSourceCreate)
  openDatabaseSelection() {
    Log.debug('Open Database selection');
    this.isShowDatabaseSelectionModal = true;
  }

  protected renderDataSourceAction(rowData: RowData, rowIndex: number, header: IndexedHeaderData, columnIndex: number): HTMLElement {
    Log.debug('renderRowData::', rowData);
    const dataSource = DataSourceResponse.fromObject(rowData).dataSource;
    const buttonDelete = HtmlElementRenderUtils.renderIcon('di-icon-delete btn-icon-border icon-action', (e: MouseEvent) =>
      this.handleConfirmDeleteDataSource(e, dataSource)
    );
    buttonDelete.setAttribute('data-title', 'Delete');
    TableTooltipUtils.configTooltip(buttonDelete);
    const emptyButton = HtmlElementRenderUtils.renderIcon('empty-edit-button', () => {
      return;
    });
    const buttonEdit = HtmlElementRenderUtils.renderIcon('di-icon-edit btn-icon-border icon-action', (event: Event) =>
      this.handleEditDataSource(event, dataSource)
    );
    buttonEdit.setAttribute('data-title', 'Edit');
    TableTooltipUtils.configTooltip(buttonEdit);
    return HtmlElementRenderUtils.renderAction(
      [dataSource.className === DataSources.UnsupportedSource ? emptyButton : buttonEdit, buttonDelete],
      12,
      'action-container'
    );
  }

  @Track(TrackEvents.DataSourceDelete, {
    source_id: (_: DataSourceScreen, args: any) => args[1].id,
    source_type: (_: DataSourceScreen, args: any) => args[1].sourceType,
    source_name: (_: DataSourceScreen, args: any) => args[1].getDisplayName()
  })
  protected handleConfirmDeleteDataSource(e: MouseEvent, dataSource: DataSourceInfo) {
    e.stopPropagation();
    Log.debug('onClickDeleteInRow::', dataSource.id, dataSource.sourceType);
    Modals.showConfirmationModal(`Are you sure to delete data source '${dataSource.getDisplayName()}'?`, {
      onOk: () => this.handleDeleteDataSource(dataSource)
    });
  }

  protected handleConfirmDeleteMultiDataSource() {
    const dataSourceText: string = this.selectedIndexAsSet.size > 1 ? 'data sources' : 'data source';
    Modals.showConfirmationModal(`Are you sure to delete ${this.selectedIndexAsSet.size} ${dataSourceText}?`, {
      onOk: () => this.handleDeleteMultiDataSource(this.selectedIndexAsSet)
    });
  }

  @Track(TrackEvents.DataSourceSubmitDelete, {
    source_id: (_: DataSourceScreen, args: any) => args[0].id,
    source_type: (_: DataSourceScreen, args: any) => args[0].sourceType,
    source_name: (_: DataSourceScreen, args: any) => args[0].getDisplayName()
  })
  protected async handleDeleteDataSource(dataSource: DataSourceInfo) {
    try {
      this.showLoading();
      await DataSourceModule.deleteDataSource(dataSource.id);
      await this.reloadDataSources();
    } catch (e) {
      const exception = DIException.fromObject(e);
      PopupUtils.showError(exception.message);
      Log.error('DataSourceScreen::deleteDataSource::error::', e.message);
    } finally {
      this.showLoaded();
    }
  }
  protected async handleDeleteMultiDataSource(indexs: Set<SourceId>) {
    try {
      this.showLoading();
      await DataSourceModule.deleteMultiDataSource(indexs);
      this.selectedIndexAsSet = new Set<SourceId>();
      this.onSelectedIndexChanged();
      await this.reloadDataSources();
    } catch (e) {
      const exception = DIException.fromObject(e);
      PopupUtils.showError(exception.message);
      Log.error('DataSourceScreen::handleDeleteMultiDataSource::error::', e.message);
    } finally {
      this.showLoaded();
    }
  }

  protected openDataSourceForm(dataSource: DataSourceInfo) {
    this.isShowDataSourceConfigModal = true;
    this.dataSourceFormRender = new DataSourceFormFactory().createRender(dataSource, this.dataSourceConfigModal.handleSubmit);
  }

  protected closeDatabaseSelection() {
    this.isShowDatabaseSelectionModal = false;
  }

  @Track(TrackEvents.DataSourceEdit, {
    source_id: (_: DataSourceScreen, args: any) => args[0]?.dataSource?.id,
    source_type: (_: DataSourceScreen, args: any) => args[0]?.dataSource?.sourceType,
    source_name: (_: DataSourceScreen, args: any) => args[0]?.dataSource?.getDisplayName()
  })
  protected onClickRow(rowData: RowData) {
    try {
      const dataSource = DataSourceResponse.fromObject(rowData).dataSource;
      if (dataSource.className === DataSources.S3Source) {
        this.openEditS3SourceConfig(dataSource as S3SourceInfo);
      } else if (dataSource.className !== DataSources.UnsupportedSource) {
        this.openDataSourceForm(dataSource);
      }
    } catch (e) {
      PopupUtils.showError(e.message);
      Log.error('DataSourceScreen::onClickRow::error::', e.message);
    }
  }

  @Track(TrackEvents.DataSourceEdit, {
    source_id: (_: DataSourceScreen, args: any) => args[1]?.id,
    source_type: (_: DataSourceScreen, args: any) => args[1]?.sourceType,
    source_name: (_: DataSourceScreen, args: any) => args[1]?.getDisplayName()
  })
  protected handleEditDataSource(event: Event, dataSource: DataSourceInfo) {
    event.stopPropagation();
    this.openDataSourceForm(dataSource);
    Log.debug('onClickEditInRow::', dataSource);
  }

  @Track(TrackEvents.DataSourceSelectType, {
    source_type: (_: DataSourceScreen, args: any) => args[0].type
  })
  protected async handleSelectDataSource(selectedItem: VisualizationItemData) {
    try {
      this.closeDatabaseSelection();
      await TimeoutUtils.sleep(150);
      await this.handleOpenThirdPartyWindow(selectedItem.type);
    } catch (e) {
      const exception = DIException.fromObject(e);
      PopupUtils.showError(exception.message);
      Log.error('DataSourceConfigModal::handleSelectDataSource::exception::', exception.message);
    }
  }

  protected async handleOpenThirdPartyWindow(type: DataSourceType | string) {
    try {
      switch (type) {
        case 'csv': {
          DiUploadDocumentActions.showUploadDocument();
          break;
        }
        case 'sheet': {
          await this.handleSelectGoogleSourceType(
            `${window.appConfig.GOOGLE_SHEET_URL}?redirect=${window.location.origin}&scope=${window.appConfig.GOOGLE_SHEET_SCOPES}`
          );
          break;
        }
        case DataSourceType.GA: {
          await this.handleSelectGoogleSourceType(`${window.appConfig.GA_URL}?redirect=${window.location.origin}&scope=${window.appConfig.GA_SCOPES}`);
          break;
        }
        case DataSourceType.GA4: {
          await this.handleSelectGoogleSourceType(`${window.appConfig.GA4_URL}?redirect=${window.location.origin}&scope=${window.appConfig.GA4_SCOPES}`);
          break;
        }
        case DataSourceType.GoogleSearchConsole: {
          await this.handleSelectGoogleSourceType(
            `${window.appConfig.GOOGLE_SEARCH_CONSOLE_URL}?redirect=${window.location.origin}&scope=${window.appConfig.GOOGLE_SEARCH_CONSOLE_SCOPES}`
          );
          break;
        }
        case DataSourceType.GoogleAds: {
          await this.handleSelectGoogleSourceType(
            `${window.appConfig.GOOGLE_ADS_URL}?redirect=${window.location.origin}&scope=${window.appConfig.GOOGLE_ADS_SCOPES}`
          );
          break;
        }
        case DataSourceType.S3: {
          const s3Source: S3SourceInfo = S3SourceInfo.default();
          const s3Job: S3Job = S3Job.default(s3Source);
          // this.openS3PreviewModal(s3Source, s3Job);
          this.openCreateS3SourceConfig(s3Source, s3Job);
          break;
        }
        case DataSourceType.Facebook: {
          await this.handleSelectGoogleSourceType(
            `${window.appConfig.FACEBOOK_ADS_URL}?redirect=${window.location.origin}&scope=${window.appConfig.VUE_APP_FACEBOOK_SCOPE}`
          );
          break;
        }
        case DataSourceType.Tiktok: {
          Log.debug('link::', `${window.appConfig.TIKTOK_ADS_URL}&redirect=${window.location.origin}`);
          await this.handleSelectGoogleSourceType(`${window.appConfig.TIKTOK_ADS_URL}?redirect=${window.location.origin}`);
          break;
        }
        //TODO: Add here
        case DataSourceType.JavaScript:
        case DataSourceType.IOS:
        case DataSourceType.Android:
        case DataSourceType.Flutter:
        case DataSourceType.ReactNative: {
          await this.openDocumentForm(type);
          break;
        }
        default: {
          const dataSource = DataSourceInfo.createDefault(type as DataSourceType);
          Log.debug('handleSelected::faultDataSource::', dataSource);
          this.openDataSourceForm(dataSource);
        }
      }
    } catch (e) {
      Log.error('DataSourceConfigModal::handleOpenThirdPartyWindow::exception::', e);
      PopupUtils.showError(e.message);
    }
  }

  protected async handleFacebookLogin(response: FacebookResponse) {
    try {
      validFacebookResponse(response, window.appConfig.VUE_APP_FACEBOOK_SCOPE);
      this.showUpdating();
      const tokenResponse = await this.dataSourceService.getFacebookExchangeToken(response!.authResponse!.accessToken);
      const fbSource: FacebookAdsSourceInfo = FacebookAdsSourceInfo.default().withAccessToken(tokenResponse.accessToken);
      this.showLoaded();
      this.openDataSourceForm(fbSource);
    } catch (e) {
      this.showLoaded();
      const exception = DIException.fromObject(e);
      if (exception.reason !== ApiExceptions.unauthorized) {
        PopupUtils.showError(exception.message);
      }
      Log.error('DataSourceConfigModal::handleFacebookLogin::exception::', exception.message);
    }
  }

  protected openCreateS3SourceConfig(sourceInfo: S3SourceInfo, job: S3Job) {
    this.s3SourceModal.show(sourceInfo, {
      onCompleted: source => {
        job.sourceId = source.id;
        this.openS3ConfigJob(source, job);
      }
    });
  }

  protected openEditS3SourceConfig(sourceInfo: S3SourceInfo) {
    this.s3SourceModal.show(sourceInfo, {
      action: FormMode.Edit,
      onCompleted: source => {
        this.reloadDataSources();
      }
    });
  }

  protected openS3ConfigJob(sourceInfo: S3SourceInfo, job: S3Job) {
    this.s3JobConfigModal.show(job, updateJob => this.openS3PreviewModal(sourceInfo, updateJob));
  }

  protected openS3PreviewModal(sourceInfo: S3SourceInfo, job: S3Job) {
    this.s3PreviewModal.show(sourceInfo, job, {
      onCompleted: (source, job) => {
        try {
          this.submitJob(job);
          this.redirectToJobScreen();
        } catch (e) {
          const exception = DIException.fromObject(e);
          PopupUtils.showError(exception.message);
          Log.error('DataSourceConfigModal::handleClickOk::exception::', exception.message);
        }
      },
      onBack: () => this.openS3ConfigJob(sourceInfo, job)
    });
  }

  protected async redirectToJobScreen() {
    await this.$router.push({ name: Routers.Job });
  }

  protected openDocumentForm(source: DataSourceType) {
    this.documentModal.show(source);
  }

  @AtomicAction()
  protected async handleSubmitDataSource() {
    try {
      this.isShowDataSourceConfigModal = false;
      this.showLoading();
      const sourceInfo: DataSourceInfo = this.dataSourceFormRender.createDataSourceInfo();
      Log.debug('handleSubmitDatasource::sourceInfo::', sourceInfo);
      await this.submitDataSource(sourceInfo);
      await this.reloadDataSources();
    } catch (e) {
      const exception = DIException.fromObject(e);
      PopupUtils.showError(exception.message);
      Log.error('DataSourceConfigModal::handleClickOk::exception::', exception.message);
    } finally {
      this.showLoaded();
    }
  }

  protected handleAfterCreateSource(source: DataSourceInfo) {
    try {
      switch (source.sourceType) {
        case DataSourceType.Palexy: {
          const job = Job.default(source);
          job.displayName = 'Palexy job';
          this.jobCreationModal.show(Job.default(source));
          this.jobCreationModal.handleSelectPalexy(source);
          break;
        }
        case DataSourceType.GoogleSearchConsole:
        case DataSourceType.Hubspot:
        case DataSourceType.Mixpanel: {
          const job = Job.default(source);
          this.multiJobCreationModal.show(job, (job: Job, isSingleTable: boolean) => this.handleCreateJob(job, isSingleTable), this.multiJobCreationModal.hide);
          this.multiJobCreationModal.handleSelectDataSource(source);
          break;
        }
      }
    } catch (e) {
      Log.error('DataSourceScreen::handleAfterCreateSource::error::', e);
    }
  }

  protected async handleCreateJob(job: Job, isSingleTable: boolean) {
    if (isSingleTable) {
      await JobModule.create(job);
    } else {
      await JobModule.multiCreateV2({ jobs: Job.getMultiJob(job) });
    }
    await this.redirectToJobScreen();
  }

  protected async handleReAuthen(sourceInfo: DataSourceInfo) {
    await this.handleOpenThirdPartyWindow(sourceInfo.sourceType);
  }

  protected handleResetDataSourceFormRender() {
    this.dataSourceFormRender = new DataSourceFormFactory().createRender(DataSourceInfo.createDefault(DataSourceType.MySql), this.handleSubmitDataSource);
  }

  protected async submitDataSource(sourceInfo: DataSourceInfo) {
    const action = this.getDataSourceConfigMode(sourceInfo);
    switch (action) {
      case FormMode.Edit: {
        await DataSourceModule.editDataSource(sourceInfo);
        TrackingUtils.track(TrackEvents.DataSourceSubmitEdit, {
          source_id: sourceInfo.id,
          source_type: sourceInfo.sourceType,
          source_name: sourceInfo.getDisplayName()
        });
        break;
      }
      case FormMode.Create: {
        Log.debug('submitDataSource', sourceInfo);
        const createdSource = await DataSourceModule.createDataSource(sourceInfo);
        TrackingUtils.track(TrackEvents.DataSourceSubmitCreate, {
          source_type: sourceInfo.sourceType,
          source_name: sourceInfo.getDisplayName()
        });
        this.handleAfterCreateSource(createdSource);
        break;
      }
      default:
        throw new DIException(`Unsupported DataSourceConfigMode ${action}`);
    }
  }

  protected getDataSourceConfigMode(dataSource: DataSourceInfo): FormMode {
    switch (dataSource.id) {
      case DataSourceInfo.DEFAULT_ID:
        return FormMode.Create;
      default:
        return FormMode.Edit;
    }
  }

  protected async loadDataSourceTable() {
    try {
      this.showLoading();
      await this.reloadDataSources();
      this.showLoaded();
    } catch (e) {
      const exception = DIException.fromObject(e);
      this.showError(exception.message);
      Log.error('DataSourceScreen::loadDataSourceTable::exception::', exception.message);
      throw new DIException(exception.message);
    }
  }

  protected async handleRefresh() {
    try {
      this.showUpdating();
      await this.reloadDataSources();
      this.showLoaded();
    } catch (e) {
      const exception = DIException.fromObject(e);
      this.showError(exception.message);
      Log.error('DataSourceScreen::loadDataSourceTable::exception::', exception.message);
      throw new DIException(exception.message);
    }
  }

  protected async reloadDataSources() {
    await DataSourceModule.loadDataSources({
      from: this.from,
      size: this.size,
      keyword: this.searchValue,
      sorts: [new SortRequest(this.sortName, this.sortMode)]
    });
  }

  protected showLoading() {
    if (ListUtils.isEmpty(DataSourceModule.dataSources)) {
      this.tableStatus = Status.Loading;
    } else {
      this.tableStatus = Status.Updating;
    }
  }

  protected showUpdating() {
    this.tableStatus = Status.Updating;
  }

  protected showLoaded() {
    this.tableStatus = Status.Loaded;
  }

  protected showError(message: string) {
    this.tableStatus = Status.Error;
    this.tableErrorMessage = message;
  }

  protected async handlePageChange(pagination: Pagination) {
    try {
      this.showLoading();
      this.from = (pagination.page - 1) * pagination.rowsPerPage;
      this.size = pagination.rowsPerPage;
      this.checkboxController.reset();
      this.onSelectedIndexChanged();
      await this.reloadDataSources();
      this.showLoaded();
    } catch (e) {
      Log.error(`UserProfile paging getting an error: ${e?.message}`);
      this.showError(e.message);
    }
  }

  protected openWindow(url: string) {
    const width = 500;
    const height = 550;
    const left = screen.width / 2 - width / 2;
    const top = screen.height / 2 - height / 2;
    const wd: Window | null = window.open('', '_blank', `toolbar=yes,scrollbars=yes,resizable=yes,top=${top},left=${left},width=${width},height=${height}`);
    if (wd && !wd.location.hostname) {
      wd.location.href = url;
    }
  }

  protected addMessageEvent() {
    window.addEventListener('message', this.handleCatchAuthResponse);
  }

  protected removeMessageEvent() {
    window.removeEventListener('message', this.handleCatchAuthResponse);
  }

  protected async handleCatchAuthResponse(event: MessageEvent) {
    try {
      this.verifyMessage(event);
      Log.debug('DataSourceScreen::handleCatchAuthResponse::event::', event);
      await this.handleThirdPartyAuthMessage(event);
    } catch (e) {
      Log.debug('DataSourceScreen::handleCatchAuthResponse::error::', e.message);
      PopupUtils.showError(e.message);
    }
  }

  protected verifyMessage(event: MessageEvent) {
    Log.debug('verifyMessage::', event);
    const origin = event.origin;
    const error = event.data?.error ?? null;
    if (origin !== window.appConfig.GOOGLE_ROOT_ORIGIN) {
      return;
    }
    if (error) {
      throw new DIException(error);
    }
  }

  protected async handleThirdPartyAuthMessage(event: MessageEvent) {
    Log.debug('handleThirdPartyAuthMessage::', event);
    const thirdPartyType = event.data?.responseType ?? ThirdPartyType.NotFound;
    const authorizeResponse: any | null = event.data?.authResponse ?? null;
    if (authorizeResponse) {
      Log.debug('DataSourceScreen::handleThirdPartyAuthMessage::event::', event);
      Log.debug('DataSourceScreen::handleThirdPartyAuthMessage::authorizeResponse::', event.data);
      switch (thirdPartyType as ThirdPartyType) {
        case ThirdPartyType.GoogleAnalytic: {
          this.handleGoogleAnalyticMessage(authorizeResponse.access_token, authorizeResponse.code);
          break;
        }
        case ThirdPartyType.GA4: {
          Log.debug('DataSourceScreen::handleThirdPartyAuthMessage::GA4Case::');
          this.handleGA4Message(authorizeResponse.access_token, authorizeResponse.code);
          break;
        }
        case ThirdPartyType.GoogleSearchConsole: {
          Log.debug('DataSourceScreen::handleThirdPartyAuthMessage::GoogleSearchConsole::', authorizeResponse);
          this.handleGoogleSearchConsoleMessage(authorizeResponse.access_token, authorizeResponse.code);
          break;
        }
        case ThirdPartyType.GoogleSheet: {
          this.handleGoogleSheetMessage(authorizeResponse.access_token, authorizeResponse.code);
          break;
        }
        case ThirdPartyType.GoogleAds: {
          await this.handleGoogleAdsMessage(authorizeResponse.access_token, authorizeResponse.code);
          break;
        }
        case ThirdPartyType.Facebook: {
          await this.handleFacebookLogin(authorizeResponse as FacebookResponse);
          break;
        }
        case ThirdPartyType.TikTok:
          await this.handleTiktokMessage((authorizeResponse as any).authCode);
          break;
        default:
          throw new UnsupportedException(`Unsupported google response type ${thirdPartyType}`);
      }
    }
  }

  protected async handleSelectGoogleSourceType(windowUrl: string) {
    try {
      this.addMessageEvent();
      this.openWindow(windowUrl);
    } catch (err) {
      PopupUtils.showError(err.message);
      Log.error('DataSourceScreen::handleSelectGoogleSourceType::error::', err);
    }
  }

  protected async handleGoogleAnalyticMessage(accessToken: string, authorizationCode: string) {
    try {
      ///handle loading here
      Log.debug('DateSourceScreen::handleGoogleAnalyticMessage::', this.dataSourceFormRender.createDataSourceInfo());
      const gaSourceInfo: GASourceInfo = this.isDefaultSource ? GASourceInfo.default() : (this.renderSource as GASourceInfo);
      gaSourceInfo.setAccessToken(accessToken);
      const refreshToken = await DataSourceModule.getRefreshToken(authorizationCode);
      gaSourceInfo.setRefreshToken(refreshToken);
      Log.debug('DataSourceScreen::handleSelectGoogleAnalytics::GoogleAnalyticJob::', gaSourceInfo);
      this.openDataSourceForm(gaSourceInfo);
    } catch (e) {
      PopupUtils.showError(e.message);
    }
  }

  protected get renderSource() {
    return this.dataSourceFormRender.createDataSourceInfo();
  }

  protected get isDefaultSource() {
    return this.renderSource.id === DataSourceInfo.DEFAULT_ID;
  }

  protected async handleGA4Message(accessToken: string, authorizationCode: string) {
    try {
      ///handle loading here
      const gaSourceInfo: GA4SourceInfo = this.isDefaultSource ? GA4SourceInfo.default() : (this.renderSource as GA4SourceInfo);
      Log.debug('DateSourceScreen::handleGA4Message::', gaSourceInfo);
      gaSourceInfo.setAccessToken(accessToken);
      const refreshToken = await DataSourceModule.getRefreshToken(authorizationCode);
      gaSourceInfo.setRefreshToken(refreshToken);
      Log.debug('DataSourceScreen::handleSelectGoogleAnalytics::GoogleAnalyticJob::', gaSourceInfo);
      this.openDataSourceForm(gaSourceInfo);
    } catch (e) {
      PopupUtils.showError(e.message);
    }
  }

  protected async handleGoogleSearchConsoleMessage(accessToken: string, authorizationCode: string) {
    try {
      ///handle loading here
      const consoleSourceInfo: GoogleSearchConsoleSourceInfo = this.isDefaultSource
        ? GoogleSearchConsoleSourceInfo.default()
        : (this.renderSource as GoogleSearchConsoleSourceInfo);
      Log.debug('DateSourceScreen::handleGoogleSearchConsoleMessage::', consoleSourceInfo);
      consoleSourceInfo.setAccessToken(accessToken);
      const refreshToken = await DataSourceModule.getRefreshToken(authorizationCode);
      consoleSourceInfo.setRefreshToken(refreshToken);
      Log.debug('DataSourceScreen::handleGoogleSearchConsoleMessage::GoogleAnalyticJob::', consoleSourceInfo);
      this.openDataSourceForm(consoleSourceInfo);
    } catch (e) {
      PopupUtils.showError(e.message);
    }
  }

  protected handleGoogleSheetMessage(accessToken: string, authorizationCode: string) {
    Log.debug('DataSourceScreen::handleGoogleSheetMessage::', accessToken, authorizationCode);
    DiUploadGoogleSheetActions.showUploadGoogleSheet();
    DiUploadGoogleSheetActions.setAccessToken(accessToken);
    DiUploadGoogleSheetActions.setAuthorizationCode(authorizationCode);
  }

  protected async handleGoogleAdsMessage(accessToken: string, authorizationCode: string) {
    try {
      const refreshToken = authorizationCode ? await DataSourceModule.getRefreshToken(authorizationCode) : '';
      const source: GoogleAdsSourceInfo = this.isDefaultSource ? GoogleAdsSourceInfo.default() : (this.renderSource as GoogleAdsSourceInfo);
      source.setAccessToken(accessToken);
      source.setRefreshToken(refreshToken);
      this.openDataSourceForm(source);
    } catch (e) {
      PopupUtils.showError(e.message);
    }
  }

  protected async handleTiktokMessage(authCode: string) {
    this.showUpdating();
    const tokenResponse: TiktokAccessTokenResponse = await this.dataSourceService.getTiktokAccessToken(authCode);
    Log.debug('handleTiktokMessage', tokenResponse);
    const tiktokSource: TiktokSourceInfo = TiktokSourceInfo.default().withAccessToken(tokenResponse.accessToken);
    this.showLoaded();
    this.openDataSourceForm(tiktokSource);
  }

  @AtomicAction()
  protected async handleSubmitJob() {
    try {
      const job: Job = this.jobFormRenderer.createJob();
      Log.debug('Submit Job', job);
      await JobModule.create(job);
      TrackingUtils.track(TrackEvents.CreateGoogleAnalyticJob, {
        job_name: job.displayName,
        job_type: job.jobType,
        job_id: job.jobId
      });
      await this.$router.push({ name: Routers.Job });
    } catch (e) {
      const exception = DIException.fromObject(e);
      PopupUtils.showError(exception.message);
      Log.error('DatasourceScreen::handleSubmitJob::exception::', exception.message);
    }
  }

  @AtomicAction()
  protected async submitJob(job: Job) {
    const clonedJob = cloneDeep(job);
    clonedJob.scheduleTime = TimeScheduler.toSchedulerV2(job.scheduleTime!);
    await JobModule.create(clonedJob);
    await this.$router.push({ name: Routers.Job });
    TrackingUtils.track(TrackEvents.CreateGoogleAnalyticJob, {
      job_name: job.displayName,
      job_type: job.jobType,
      job_id: job.jobId
    });
  }

  protected async handleKeywordChange(newKeyword: string) {
    try {
      this.searchValue = newKeyword;
      this.checkboxController.reset();
      this.onSelectedIndexChanged();
      this.from = 0;
      this.showLoading();
      await this.reloadDataSources();
      this.showLoaded();
    } catch (e) {
      Log.error('DataSourceScreen:: handleSortChange::', e);
      this.showError(e.message);
    }
  }

  protected async handleSortChange(column: HeaderData) {
    try {
      Log.debug('handleSortChange::', this.sortName, this.sortMode);
      this.updateSortMode(column);
      this.updateSortColumn(column);
      this.checkboxController.reset();
      this.onSelectedIndexChanged();
      this.showUpdating();
      await this.reloadDataSources();
      this.showLoaded();
    } catch (e) {
      Log.error('DatasourceScreen:: handleSortChange::', e);
      this.showError(e.message);
    }
  }

  protected updateSortColumn(column: HeaderData) {
    const { key } = column;
    const field = StringUtils.toSnakeCase(key);
    this.sortName = field;
  }

  protected updateSortMode(column: HeaderData) {
    const { key } = column;
    const field = StringUtils.toSnakeCase(key);
    if (this.sortName === field) {
      Log.debug('case equal:', this.sortName, field);
      this.sortMode = this.sortMode === SortDirection.Asc ? SortDirection.Desc : SortDirection.Asc;
    } else {
      this.sortMode = SortDirection.Asc;
    }
  }
}
</script>

<style lang="scss">
@import '~@/themes/scss/mixin.scss';

.data-source {
  display: flex;
  flex-direction: column;
  max-height: calc(100vh - 48px - 68px);

  > header {
    align-items: center;
    display: flex;
    height: 33px;
    justify-content: space-between;

    > .data-source-title {
      align-items: center;
      display: flex;
      flex: 1;
      font-size: 24px;
      font-stretch: normal;
      font-style: normal;
      font-weight: 500;
      letter-spacing: 0.2px;
      line-height: 1.4;
      overflow: hidden;

      > .root-title {
        align-items: center;
        display: flex;

        > i {
          margin-right: 16px;
          color: var(--directory-header-icon-color);
        }
      }

      .datasource-action-icon {
        font-size: 16px;
        color: var(--directory-header-icon-color);
      }
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

  > .data-source-divider {
    background-color: var(--text-color);
    height: 0.5px;
    margin-bottom: 16px;
    margin-top: 8px;
    opacity: 0.2;
  }

  .select-datasource-type-panel {
    background: var(--secondary-2);

    .title {
      @include bold-text-16();
      padding-top: 24px;
      padding-bottom: 8px;
      line-height: 24px;
    }

    .datasource-item {
      ::v-deep {
        .title {
          background: var(--charcoal);
        }
      }
    }

    .action {
      @include regular-text();
      color: var(--secondary-text-color);
      font-size: 16px;

      a {
        text-decoration: underline;
      }
    }
  }

  > .data-source-table {
    background-color: var(--directory-row-bg);
    flex: 1;
  }

  .icon-action {
    font-size: 14px;
    padding: 6px;
  }

  .source-name-container {
    display: flex;
    align-items: center;
  }

  .data-source-icon {
    width: 24px;
    height: 24px;
  }

  .source-name {
    color: var(--text-color) !important;
    @include semi-bold-14();
    letter-spacing: 0.23px;
    font-weight: 500 !important;
  }

  .empty-edit-button {
    width: 26.23px;
  }
}

::v-deep {
  .modal-dialog {
    max-width: fit-content;
  }

  .modal-body {
    padding: 0 16px;
  }

  .modal-footer {
    width: 394px;
    padding: 8px 24px 24px 24px;
    margin-left: auto;
    display: flex;
    @media (max-width: 500px) {
      width: 100%;
    }

    .button-test {
      justify-content: center;
      height: 42px;

      .title {
        width: fit-content;
        color: var(--accent);
      }
    }

    .button-add {
      height: 42px;
      margin-left: 6px;
    }
  }
}
</style>
