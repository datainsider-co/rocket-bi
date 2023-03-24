<template>
  <LayoutContent>
    <LayoutHeader title="Data Sources" icon="di-icon-datasource">
      <div class="ml-auto d-flex align-items-center">
        <SearchInput :timeBound="400" class="search-input" hint-text="Search data source" @onTextChanged="handleKeywordChange" />
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
      :data-source-render="dataSourceFormRender"
      :isShow.sync="isShowDataSourceConfigModal"
      @onClickOk="handleSubmitDataSource"
    ></DataSourceConfigModal>
    <DataSourceTypeSelection :is-show.sync="isShowDatabaseSelectionModal" @onDataSourceTypeSelected="handleSelectDataSource"></DataSourceTypeSelection>
    <DiUploadGoogleSheetComponent ref="diUp"></DiUploadGoogleSheetComponent>
    <S3SourceConfigModal ref="s3SourceModal" />
    <S3JobConfigModal ref="s3JobConfigModal" />
    <S3PreviewTableModal ref="s3PreviewModal" />
    <JobConfigModal ref="jobConfigModal" :job-config-form-render="jobFormRenderer" title="Job config"></JobConfigModal>
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
import { JobFormFactory } from '@/screens/data-ingestion/form-builder/JobFormFactory';
import { JobFormRender } from '@/screens/data-ingestion/form-builder/JobFormRender';
import { DataSourceModule } from '@/screens/data-ingestion/store/DataSourceStore';
import { JobModule } from '@/screens/data-ingestion/store/JobStore';
import { DefaultPaging, ItemData, Routers, Status, VisualizationItemData, ApiExceptions } from '@/shared';
import { Track } from '@/shared/anotation';
import { AtomicAction } from '@/shared/anotation/AtomicAction';
import DiButton from '@/shared/components/common/DiButton.vue';
import DiTable2 from '@/shared/components/common/di-table/DiTable2.vue';
import { LayoutContent, LayoutHeader, LayoutNoData } from '@/shared/components/layout-wrapper';
import StatusWidget from '@/shared/components/StatusWidget.vue';
import { CustomCell, HeaderData, IndexedHeaderData, Pagination, RowData } from '@/shared/models';
import { ListUtils } from '@/utils';
import { HtmlElementRenderUtils } from '@/utils/HtmlElementRenderUtils';

import { Modals } from '@/utils/Modals';
import { PopupUtils } from '@/utils/PopupUtils';
import { StringUtils } from '@/utils/StringUtils';
import { TableTooltipUtils } from '@chart/custom-table/TableTooltipUtils';
import { DataSources, DataSourceType, FormMode, GoogleAdsSourceInfo, Job, JobInfo, S3Job, S3SourceInfo, SortRequest } from '@core/data-ingestion';
import { DataSourceInfo } from '@core/data-ingestion/domain/data-source/DataSourceInfo';
import { GoogleAnalyticJob } from '@core/data-ingestion/domain/job/google-analytic/GoogleAnalyticJob';
import { DataSourceResponse } from '@core/data-ingestion/domain/response/DataSourceResponse';
import { DIException, SortDirection, SourceId } from '@core/common/domain';
import { UnsupportedException } from '@core/common/domain/exception/UnsupportedException';
import { TrackEvents } from '@core/tracking/enum/TrackEvents';
import { TrackingUtils } from '@core/tracking/TrackingUtils';
import { Log } from '@core/utils';
import { cloneDeep } from 'lodash';
import { Component, Ref, Vue } from 'vue-property-decorator';
import DocumentModal from './DocumentModal.vue';
import { ThirdPartyAuthenticationType } from '@/shared/components/google-authen/enum/ThirdPartyAuthenticationType';
import { GA4Job } from '@core/data-ingestion/domain/job/ga4/GA4Job';
import { FacebookResponse, validFacebookResponse } from '@/shared/components/facebook-authen/FacebookResponse';
import { FacebookAdsSourceInfo } from '@core/data-ingestion/domain/data-source/FacebookAdsSourceInfo';
import { Inject } from 'typescript-ioc';
import { DataSourceService } from '@core/common/services/DataSourceService';

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
    S3PreviewTableModal
  }
})
export default class DataSourceScreen extends Vue {
  private readonly trackEvents = TrackEvents;

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
  private jobConfigModal!: JobConfigModal;

  @Inject
  private readonly dataSourceService!: DataSourceService;

  private readonly allItems: ItemData[] = ALL_DATASOURCE;
  private from = 0;
  private size = DefaultPaging.DefaultPageSize;
  private sortName = 'last_modified';
  private sortMode: SortDirection = SortDirection.Desc;
  private searchValue = '';
  private isShowDatabaseSelectionModal = false;
  private isShowDataSourceConfigModal = false;
  private jobFormRenderer: JobFormRender = JobFormRender.default();
  private tableErrorMessage = '';
  private tableStatus: Status = Status.Loading;
  private dataSourceFormRender: DataSourceFormRender = new DataSourceFormFactory().createRender(
    DataSourceInfo.default(DataSourceType.MySql),
    this.handleSubmitDataSource
  );
  private googleConfig = require('@/screens/data-ingestion/constants/google-config.json');

  private get dataSourceHeaders(): HeaderData[] {
    return DataSourceModule.dataSourceHeaders;
  }

  private get record(): number {
    return DataSourceModule.totalRecord;
  }

  private get isActiveSearch() {
    return StringUtils.isNotEmpty(this.searchValue);
  }

  private get dataSources(): DataSourceResponse[] {
    Log.debug('dataSources::', DataSourceModule.dataSources);
    return DataSourceModule.dataSources;
    // return []
  }

  private get isLoaded() {
    return this.tableStatus === Status.Loaded;
  }

  private get isEmptyData(): boolean {
    return ListUtils.isEmpty(this.dataSources);
    // return true
  }

  private get dataSourceListing(): RowData[] {
    // return []
    return this.dataSources.map(dataSource => {
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

  private renderDataSourceAction(rowData: RowData, rowIndex: number, header: IndexedHeaderData, columnIndex: number): HTMLElement {
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
  private handleConfirmDeleteDataSource(e: MouseEvent, dataSource: DataSourceInfo) {
    e.stopPropagation();
    Log.debug('onClickDeleteInRow::', dataSource.id, dataSource.sourceType);
    Modals.showConfirmationModal(`Are you sure to delete data source '${dataSource.getDisplayName()}'?`, {
      onOk: () => this.handleDeleteDataSource(dataSource)
    });
  }

  @Track(TrackEvents.DataSourceSubmitDelete, {
    source_id: (_: DataSourceScreen, args: any) => args[0].id,
    source_type: (_: DataSourceScreen, args: any) => args[0].sourceType,
    source_name: (_: DataSourceScreen, args: any) => args[0].getDisplayName()
  })
  private async handleDeleteDataSource(dataSource: DataSourceInfo) {
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

  private openDataSourceForm(dataSource: DataSourceInfo) {
    this.isShowDataSourceConfigModal = true;
    this.dataSourceFormRender = new DataSourceFormFactory().createRender(dataSource, this.handleSubmitDataSource);
  }

  private closeDatabaseSelection() {
    this.isShowDatabaseSelectionModal = false;
  }

  @Track(TrackEvents.DataSourceEdit, {
    source_id: (_: DataSourceScreen, args: any) => args[0]?.dataSource?.id,
    source_type: (_: DataSourceScreen, args: any) => args[0]?.dataSource?.sourceType,
    source_name: (_: DataSourceScreen, args: any) => args[0]?.dataSource?.getDisplayName()
  })
  private onClickRow(rowData: RowData) {
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
    source_id: (_: DataSourceScreen, args: any) => args[0]?.id,
    source_type: (_: DataSourceScreen, args: any) => args[0]?.sourceType,
    source_name: (_: DataSourceScreen, args: any) => args[0]?.getDisplayName()
  })
  private handleEditDataSource(event: Event, dataSource: DataSourceInfo) {
    event.stopPropagation();
    this.openDataSourceForm(dataSource);
    Log.debug('onClickEditInRow::', dataSource);
  }

  @Track(TrackEvents.DataSourceSelectType, {
    source_type: (_: DataSourceScreen, args: any) => args[0].type
  })
  private async handleSelectDataSource(selectedItem: VisualizationItemData) {
    try {
      this.closeDatabaseSelection();
      switch (selectedItem.type) {
        case 'csv': {
          DiUploadDocumentActions.showUploadDocument();
          break;
        }
        case DataSourceType.GoogleSheet: {
          await this.handleSelectGoogleSourceType(`${this.googleConfig.sheetUrl}?redirect=${window.location.origin}&scope=${this.googleConfig.sheetScope}`);
          break;
        }
        case DataSourceType.GoogleAnalytics: {
          await this.handleSelectGoogleSourceType(`${this.googleConfig.gaUrl}?redirect=${window.location.origin}&scope=${this.googleConfig.gaScope}`);
          break;
        }
        case DataSourceType.GA4: {
          await this.handleSelectGoogleSourceType(`${this.googleConfig.ga4Url}?redirect=${window.location.origin}&scope=${this.googleConfig.ga4Scope}`);
          break;
        }
        case DataSourceType.GoogleAds: {
          await this.handleSelectGoogleSourceType(
            `${this.googleConfig.gAdvertiseUrl}?redirect=${window.location.origin}&scope=${this.googleConfig.gAdvertiseScope}`
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
          await this.loginFacebook(this.handleFacebookLogin);
          break;
        }
        //TODO: Add here
        case DataSourceType.JavaScript:
        case DataSourceType.IOS:
        case DataSourceType.Android:
        case DataSourceType.Flutter:
        case DataSourceType.ReactNative: {
          await this.openDocumentForm(selectedItem.type);
          break;
        }
        default: {
          const defaultDataSource = DataSourceInfo.default(selectedItem.type as DataSourceType);
          Log.debug('handleSelected::faultDataSource::', defaultDataSource);
          this.openDataSourceForm(defaultDataSource);
        }
      }
    } catch (e) {
      const exception = DIException.fromObject(e);
      PopupUtils.showError(exception.message);
      Log.error('DataSourceConfigModal::handleSelectDataSource::exception::', exception.message);
    }
  }

  async loginFacebook(callback: (response: any) => void) {
    (window as any).FB.login(callback, { scope: window.appConfig.VUE_APP_FACEBOOK_SCOPE, return_scopes: true });
  }

  private async handleFacebookLogin(response: FacebookResponse | undefined) {
    try {
      validFacebookResponse(response, window.appConfig.VUE_APP_FACEBOOK_SCOPE);
      const tokenResponse = await this.dataSourceService.getFacebookExchangeToken(response!.authResponse!.accessToken);
      const fbSource: FacebookAdsSourceInfo = FacebookAdsSourceInfo.default().withAccessToken(tokenResponse.accessToken);
      this.openDataSourceForm(fbSource);
    } catch (e) {
      const exception = DIException.fromObject(e);
      if (exception.reason !== ApiExceptions.unauthorized) {
        PopupUtils.showError(exception.message);
      }
      Log.error('DataSourceConfigModal::handleFacebookLogin::exception::', exception.message);
    }
  }

  private openCreateS3SourceConfig(sourceInfo: S3SourceInfo, job: S3Job) {
    this.s3SourceModal.show(sourceInfo, {
      onCompleted: source => {
        job.sourceId = source.id;
        this.openS3ConfigJob(source, job);
      }
    });
  }

  private openEditS3SourceConfig(sourceInfo: S3SourceInfo) {
    this.s3SourceModal.show(sourceInfo, {
      action: FormMode.Edit,
      onCompleted: source => {
        this.reloadDataSources();
      }
    });
  }

  private openS3ConfigJob(sourceInfo: S3SourceInfo, job: S3Job) {
    this.s3JobConfigModal.show(job, updateJob => this.openS3PreviewModal(sourceInfo, updateJob));
  }

  private openS3PreviewModal(sourceInfo: S3SourceInfo, job: S3Job) {
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

  private async redirectToJobScreen() {
    await this.$router.push({ name: Routers.Job });
  }

  private openDocumentForm(source: DataSourceType) {
    this.documentModal.show(source);
  }

  private openJobConfigModal(jobInfo: JobInfo) {
    this.jobFormRenderer = new JobFormFactory().createRender(jobInfo);
    this.jobConfigModal.show(job => this.submitJob(job));
    Log.debug('openJobConfigModal::', jobInfo);
  }

  @AtomicAction()
  private async handleSubmitDataSource() {
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

  private async submitDataSource(sourceInfo: DataSourceInfo) {
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
        break;
      }
      default:
        throw new DIException(`Unsupported DataSourceConfigMode ${action}`);
    }
  }

  private getDataSourceConfigMode(dataSource: DataSourceInfo): FormMode {
    switch (dataSource.id) {
      case DataSourceInfo.DEFAULT_ID:
        return FormMode.Create;
      default:
        return FormMode.Edit;
    }
  }

  private async loadDataSourceTable() {
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

  private async handleRefresh() {
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

  private async reloadDataSources() {
    await DataSourceModule.loadDataSources({
      from: this.from,
      size: this.size,
      keyword: this.searchValue,
      sorts: [new SortRequest(this.sortName, this.sortMode)]
    });
  }

  private showLoading() {
    if (ListUtils.isEmpty(DataSourceModule.dataSources)) {
      this.tableStatus = Status.Loading;
    } else {
      this.tableStatus = Status.Updating;
    }
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
      this.showLoading();
      this.from = (pagination.page - 1) * pagination.rowsPerPage;
      this.size = pagination.rowsPerPage;
      await this.reloadDataSources();
      this.showLoaded();
    } catch (e) {
      Log.error(`UserProfile paging getting an error: ${e?.message}`);
      this.showError(e.message);
    }
  }

  private openWindow(url: string) {
    const width = 500;
    const height = 550;
    const left = screen.width / 2 - width / 2;
    const top = screen.height / 2 - height / 2;
    window.open(url, '_blank', `toolbar=yes,scrollbars=yes,resizable=yes,top=${top},left=${left},width=${width},height=${height}`);
  }

  private addMessageEvent() {
    window.addEventListener('message', this.handleCatchAuthResponse);
  }

  private removeMessageEvent() {
    window.removeEventListener('message', this.handleCatchAuthResponse);
  }

  private async handleCatchAuthResponse(event: MessageEvent) {
    try {
      this.verifyMessage(event);
      Log.debug('DataSourceScreen::handleCatchAuthResponse::event::', event);
      await this.handleMessageData(event);
    } catch (e) {
      Log.debug('DataSourceScreen::handleCatchAuthResponse::error::', e.message);
      PopupUtils.showError(e.message);
    }
  }

  private verifyMessage(event: MessageEvent) {
    const origin = event.origin;
    const error = event.data?.error ?? null;
    if (origin !== this.googleConfig.rootOrigin) {
      return;
    }
    if (error) {
      throw new DIException(error);
    }
  }

  private async handleMessageData(event: MessageEvent) {
    const responseType = event.data?.responseType ?? ThirdPartyAuthenticationType.NotFound;
    const authorizeResponse: gapi.auth2.AuthorizeResponse | null = event.data?.authResponse ?? null;
    if (authorizeResponse) {
      Log.debug('DataSourceScreen::handleMessageData::event::', event);
      Log.debug('DataSourceScreen::handleMessageData::authorizeResponse::', event.data);
      switch (responseType as ThirdPartyAuthenticationType) {
        case ThirdPartyAuthenticationType.GoogleAnalytic: {
          this.handleGoogleAnalyticMessage(authorizeResponse.access_token, authorizeResponse.code);
          break;
        }
        case ThirdPartyAuthenticationType.GA4: {
          Log.debug('DataSourceScreen::handleMessageData::GA4Case::');
          this.handleGA4Message(authorizeResponse.access_token, authorizeResponse.code);
          break;
        }
        case ThirdPartyAuthenticationType.GoogleSheet: {
          this.handleGoogleSheetMessage(authorizeResponse.access_token, authorizeResponse.code);
          break;
        }
        case ThirdPartyAuthenticationType.GoogleAds: {
          await this.handleGoogleAdsMessage(authorizeResponse.access_token, authorizeResponse.code);
          break;
        }
        case ThirdPartyAuthenticationType.Facebook: {
          await this.handleFacebookMessage(authorizeResponse);
          break;
        }
        default:
          throw new UnsupportedException(`Unsupported google response type ${responseType}`);
      }
    }
  }

  private handleSelectFacebookSource(windowUrl: string) {
    Log.debug('handleSelectFacebookSource', windowUrl);
    try {
      this.addMessageEvent();
      this.openWindow(windowUrl);
    } catch (err) {
      PopupUtils.showError(err.message);
      Log.error('DataSourceScreen::handleSelectFacebookSource::error::', err);
    }
  }

  private async handleSelectGoogleSourceType(windowUrl: string) {
    try {
      this.addMessageEvent();
      this.openWindow(windowUrl);
    } catch (err) {
      PopupUtils.showError(err.message);
      Log.error('DataSourceScreen::handleSelectGoogleSourceType::error::', err);
    }
  }

  private handleGoogleAnalyticMessage(accessToken: string, authorizationCode: string) {
    const dataSource: DataSourceInfo = DataSourceInfo.default(DataSourceType.GoogleAnalytics);
    const job = GoogleAnalyticJob.default()
      .setAccessToken(accessToken)
      .setAuthorizationCode(authorizationCode);
    Log.debug('DataSourceScreen::handleSelectGoogleAnalytics::GoogleAnalyticJob::', job);
    this.openJobConfigModal(new JobInfo(job, dataSource));
  }

  private handleGA4Message(accessToken: string, authorizationCode: string) {
    const dataSource: DataSourceInfo = DataSourceInfo.default(DataSourceType.GA4);
    const job = GA4Job.default()
      .setAccessToken(accessToken)
      .setAuthorizationCode(authorizationCode);
    Log.debug('DataSourceScreen::handleSelectGoogleAnalytics::GoogleAnalyticJob::', job);
    this.openJobConfigModal(new JobInfo(job, dataSource));
  }

  private handleGoogleSheetMessage(accessToken: string, authorizationCode: string) {
    DiUploadGoogleSheetActions.showUploadGoogleSheet();
    DiUploadGoogleSheetActions.setAccessToken(accessToken);
    DiUploadGoogleSheetActions.setAuthorizationCode(authorizationCode);
  }

  private async handleGoogleAdsMessage(accessToken: string, authorizationCode: string) {
    const refreshToken = authorizationCode ? await DataSourceModule.getRefreshToken(authorizationCode) : '';
    const source: GoogleAdsSourceInfo = GoogleAdsSourceInfo.default()
      .setAccessToken(accessToken)
      .setRefreshToken(refreshToken);
    this.openDataSourceForm(source);
    // const job = GoogleAdsJob.default()
    //   .setAccessToken(accessToken)
    //   .setAuthorizationCode(authorizationCode);
    // this.openMultiJobConfigModal(job);
  }

  private async handleFacebookMessage(response: any) {
    //
  }

  @AtomicAction()
  private async handleSubmitJob() {
    try {
      const job: Job = this.jobFormRenderer.createJob();
      Log.debug('Submit Job', job);
      const jobInfo = await JobModule.create(job);
      this.$router.push({ name: Routers.Job });
      TrackingUtils.track(TrackEvents.CreateGoogleAnalyticJob, {
        job_name: job.displayName,
        job_type: job.jobType,
        job_id: job.jobId
      });
    } catch (e) {
      const exception = DIException.fromObject(e);
      PopupUtils.showError(exception.message);
      Log.error('DatasourceScreen::handleSubmitJob::exception::', exception.message);
    }
  }

  private async submitJob(job: Job) {
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

  private async handleCancelCreateGaJob(id: SourceId) {
    try {
      await DataSourceModule.deleteDataSource(id);
    } catch (e) {
      Log.error('DataSourceScreen::handleDeleteDataSource::error::', e.message);
    }
  }

  private async handleKeywordChange(newKeyword: string) {
    try {
      this.searchValue = newKeyword;
      this.from = 0;
      this.showLoading();
      await this.reloadDataSources();
      this.showLoaded();
    } catch (e) {
      Log.error('DataSourceScreen:: handleSortChange::', e);
      this.showError(e.message);
    }
  }

  private async handleSortChange(column: HeaderData) {
    try {
      Log.debug('handleSortChange::', this.sortName, this.sortMode);
      this.updateSortMode(column);
      this.updateSortColumn(column);
      this.showUpdating();
      await this.reloadDataSources();
      this.showLoaded();
    } catch (e) {
      Log.error('DatasourceScreen:: handleSortChange::', e);
      this.showError(e.message);
    }
  }

  private updateSortColumn(column: HeaderData) {
    const { key } = column;
    const field = StringUtils.toSnakeCase(key);
    this.sortName = field;
  }

  private updateSortMode(column: HeaderData) {
    const { key } = column;
    const field = StringUtils.toSnakeCase(key);
    if (this.sortName === field) {
      Log.debug('case equal:', this.sortName, field);
      this.sortMode = this.sortMode === SortDirection.Asc ? SortDirection.Desc : SortDirection.Asc;
    } else {
      this.sortMode = SortDirection.Asc;
    }
  }

  // async initFacebookClient(appId: string) {
  //   Log.debug('initFacebookClient::', appId);
  //   (window as any).fbAsyncInit = function() {
  //     (window as any).FB.init({
  //       appId: appId,
  //       cookie: true, // This is important, it's not enabled by default
  //       version: 'v13.0'
  //     });
  //     jQuery(document).trigger('FBSDKLoaded');
  //   };
  // }
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
      line-height: 1.17;
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
