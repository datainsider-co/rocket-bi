<template>
  <LayoutContent>
    <LayoutHeader ref="layoutHeader" title="DataSource" icon="di-icon-my-data">
      <template #icon v-if="isExistedSource">
        <img
          class="mr-3"
          :src="require(`@/assets/icon/data_ingestion/datasource/source_selection_modal/${headerResolver.getIcon(source.className)}`)"
          alt=""
          height="24"
          width="24"
        />
      </template>
      <BreadcrumbComponent :breadcrumbs="breadcrumbs"></BreadcrumbComponent>
      <div class="ml-auto d-flex align-items-center">
        <DiIconTextButton class="mr-2" title="Update Schema" @click="handleUpdateSchema">
          <i v-if="isRefreshSchemaLoading" class="fa fa-spin fa-spinner"></i>
          <i v-else class="di-icon-sync datasource-action-icon"></i>
        </DiIconTextButton>
        <DiIconTextButton title="Refresh" @click="handleRefreshStatus">
          <i v-if="isRefreshStatusLoading" class="fa fa-spin fa-spinner"></i>
          <i v-else class="di-icon-reset datasource-action-icon"></i>
        </DiIconTextButton>
      </div>
    </LayoutHeader>
    <div class="connector-config" :style="{ height: `calc(100% - ${headerHeight}px)` }">
      <StatusWidget class="position-relative" :status="status" :error="errorMessage" @retry="handleLoadConfig">
        <template v-if="isEmptyData">
          <div class="h-100 d-flex flex-column bg-white align-items-center justify-content-center">
            <DiButton border title="Create Source" @click="createNewDataSource">
              <i class="di-icon-add"></i>
            </DiButton>
          </div>
        </template>
        <!--        <div class="h-100" >-->
        <DiTable2
          v-else
          id="config-listing"
          ref="clickhouseConfigListing"
          :error-msg="errorMessage"
          :headers="headers"
          :records="sources"
          :status="status"
          class="clickhouse-config-table"
          :isShowPagination="false"
          @onClickRow="response => editDataSource(response.source)"
          :total="1"
          @onRetry="handleLoadConfig"
        />
        <!--        </div>-->
      </StatusWidget>
    </div>
    <ConnectorSelectionModal ref="connectorSelectionModal" />
    <ConnectorConfigModal ref="connectorConfigModal" />
    <ConnectorSetupProgressModal ref="progressModal" />
  </LayoutContent>
</template>
<script lang="ts">
import { Component, Ref, Vue, Watch } from 'vue-property-decorator';
import { LayoutContent, LayoutHeader } from '@/shared/components/layout-wrapper';
import { Status } from '@/shared';
import StatusWidget from '@/shared/components/StatusWidget.vue';
import { DIException } from '@core/common/domain';
import { Log } from '@core/utils';
import { DateTimeUtils, ListUtils, PopupUtils } from '@/utils';
import EmptyDirectory from '@/screens/dashboard-detail/components/EmptyDirectory.vue';
import DiButton from '@/shared/components/common/DiButton.vue';
import { Breadcrumbs, CustomCell, HeaderData } from '@/shared/models';
import DiTable2 from '@/shared/components/common/di-table/DiTable2.vue';
import { HtmlElementRenderUtils } from '@/utils/HtmlElementRenderUtils';
import { ConnectionModule } from '../../stores/ConnectionStore';
import { Connector, ConnectorType, RefreshSchemaHistory } from '@core/connector-config';
import ConnectorSelectionModal from '@/screens/organization-settings/views/connector-config/components/ConnectorSelectionModal.vue';
import ConnectorConfigModal from '@/screens/organization-settings/views/connector-config/components/ConnectorConfigModal.vue';
import ConnectorSetupProgressModal from '@/screens/organization-settings/views/connector-config/components/ConnectorSetupProgressModal.vue';
import BreadcrumbComponent from '@/screens/directory/components/BreadcrumbComponent.vue';
import {
  BigqueryHeaderHandler,
  ClickhouseHeaderHandler,
  DefaultHeaderHandler,
  HeaderResolver,
  HeaderResolverBuilder,
  MySQLHeaderHandler,
  VerticaHeaderHandler
} from '@/screens/organization-settings/views/connector-config/header_builder';
import { PostgreSQLHeaderHandler } from '@/screens/organization-settings/views/connector-config/header_builder/handler-impl/PostgreSQLHeaderHandler';

@Component({
  components: {
    BreadcrumbComponent,
    DiButton,
    EmptyDirectory,
    LayoutContent,
    LayoutHeader,
    StatusWidget,
    DiTable2,
    ConnectorSelectionModal,
    ConnectorConfigModal,
    ConnectorSetupProgressModal
  }
})
export default class ConnectorConfig extends Vue {
  private status: Status = Status.Loaded;
  private errorMessage = '';
  private headerHeight = 0;

  private isRefreshSchemaLoading = false;
  private isRefreshStatusLoading = false;

  @Ref()
  private layoutHeader!: LayoutHeader;

  @Ref()
  private progressModal!: ConnectorSetupProgressModal;

  @Ref()
  private connectorSelectionModal!: ConnectorSelectionModal;

  @Ref()
  private connectorConfigModal!: ConnectorConfigModal;

  private get isEmptyData() {
    return ListUtils.isEmpty(this.sources);
  }

  private get source() {
    return ConnectionModule.source;
  }

  private get sources() {
    return this.source ? [ConnectionModule.sourceResponse] : [];
  }

  private get isExistedSource() {
    return this.source ? !ConnectionModule.isConfigStep : false;
  }

  private get headers(): HeaderData[] {
    const sourceHeaders = this.isExistedSource ? this.headerResolver.buildHeader(this.source!) : [];
    return [
      ...sourceHeaders,
      // {
      //   key: 'createdAt',
      //   label: 'Created Time',
      //   customRenderBodyCell: new CustomCell(rowData => {
      //     return HtmlElementRenderUtils.renderText(DateTimeFormatter.formatAsMMMDDYYYHHmmss(rowData?.source?.createdAt), 'span', 'text-truncate');
      //   }),
      //   disableSort: true,
      //   width: 180
      // },
      {
        key: 'updatedAt',
        label: 'Updated Time',
        customRenderBodyCell: new CustomCell(rowData => {
          return HtmlElementRenderUtils.renderText(DateTimeUtils.formatAsMMMDDYYYHHmmss(rowData?.source?.updatedAt), 'span', 'text-truncate');
        }),
        disableSort: true,
        width: 180
      },
      {
        key: 'status',
        label: 'Status',
        customRenderBodyCell: new CustomCell(() => {
          const status = ConnectionModule.status.status;
          const imgSrc = RefreshSchemaHistory.getStatusIcon(status);
          const statusDisplayName = RefreshSchemaHistory.getStatusDisplayName(status);
          const statusDisplayNameElement = HtmlElementRenderUtils.renderText(statusDisplayName);
          statusDisplayNameElement.style.color = RefreshSchemaHistory.getColorFromStatus(status);
          const elements = [HtmlElementRenderUtils.renderImg(imgSrc), statusDisplayNameElement];
          const div = document.createElement('div');
          div.append(...elements);
          div.classList.add('custom-status-cell');
          return div;
        }),
        width: 90
      },
      {
        key: 'action',
        label: 'Actions',
        width: 200,
        customRenderBodyCell: new CustomCell(rowData => {
          const source = rowData?.source ? Connector.fromObject(rowData.source) : null;
          const div = document.createElement('div');
          const changeAction = HtmlElementRenderUtils.renderBorderButton(
            'Change',
            event => {
              event.stopPropagation();
              return source ? this.changeDataSource(source) : null;
            },
            '80px',
            '34px'
          );
          changeAction.style.marginRight = '8px';
          const editAction = HtmlElementRenderUtils.renderPrimaryButton(
            'Edit',
            event => {
              event.stopPropagation();
              return source ? this.editDataSource(source) : null;
            },
            '90px',
            '34px'
          );
          div.append(...[changeAction, editAction]);
          return div;
        })
      }

      // {
      //   key: 'systemStatus',
      //   label: 'System Status',
      //   customRenderBodyCell: new CustomCell(rowData => {
      //     const iconLive = `<div class="icon-live"></div>`;
      //     const iconDead = `<div class="icon-dead"></div>`;
      //     let ele = iconLive;
      //     // eslint-disable-next-line
      //     switch (this.systemInfo.status) {
      //       case SystemStatus.Healthy:
      //         ele = iconLive;
      //         break;
      //       case SystemStatus.UnHealthy:
      //         ele = iconDead;
      //         break;
      //     }
      //
      //     const status = HtmlElementRenderUtils.renderText(StringUtils.camelToCapitalizedStr(this.systemInfo.status), 'span');
      //     return HtmlElementRenderUtils.renderAction([HtmlElementRenderUtils.renderHtmlAsElement(ele), status], 8);
      //   }),
      //   disableSort: true,
      //   width: this.cellWidth
      // }
    ];
  }

  private get isLoading() {
    return this.status === Status.Loading || this.status === Status.Updating;
  }

  private showLoading() {
    this.status = Status.Loading;
  }

  private showUpdating() {
    this.status = Status.Updating;
  }

  private showLoaded() {
    this.status = Status.Loaded;
  }

  private showError(ex: DIException) {
    this.status = Status.Error;
    this.errorMessage = ex.getPrettyMessage();
    Log.error(`UserActivityLog::showError::error::`, this.errorMessage);
  }

  private showSetupProgressModal() {
    this.progressModal.show({
      backCallback: async () => {
        await this.showDataSourceConfigModal(this.source!);
      }
    });
  }

  private showDataSourceConfigModal(dataSource: Connector, onBack?: () => void, cancelTitle = 'Back') {
    const source = Connector.fromObject(dataSource);

    this.connectorConfigModal.show(
      source,
      !!this.source,
      cancelTitle,
      async source => {
        ConnectionModule.setSource(source);
        this.showSetupProgressModal();
      },
      () => {
        if (onBack) {
          return onBack();
        } else {
          this.createNewDataSource();
        }
      }
    );
  }

  async mounted() {
    await this.handleInitData();
  }

  private get isInitialLoading() {
    return ConnectionModule.isInitialLoading;
  }

  @Watch('isInitialLoading', { immediate: true })
  handleInitialLoadingChange(isLoading: boolean) {
    if (isLoading) {
      this.showLoading();
    } else if (!this.isPermitted) {
      this.showError(new DIException('You do not have permissions to perform this action!'));
    } else {
      this.handleInitData();
    }
  }

  private get isPermitted() {
    return ConnectionModule.isPermitted;
  }

  private async handleInitData() {
    try {
      if (!this.isInitialLoading && ConnectionModule.isPermitted) {
        this.showLoading();
        if (!ConnectionModule.isExistedSource) {
          this.createNewDataSource();
        } else if (ConnectionModule.isConfigStep) {
          this.editDataSource(this.source!);
        } else if (ConnectionModule.isSetUpStep) {
          this.showSetupProgressModal();
        }
        this.showLoaded();
      }
    } catch (e) {
      const exception = DIException.fromObject(e);
      this.showError(exception);
    }
  }

  private createNewDataSource() {
    const allowClickBackDrop = !!this.source;
    this.connectorSelectionModal.show(source => this.showDataSourceConfigModal(source), allowClickBackDrop);
  }

  private changeDataSource(currentSource: Connector) {
    const allowClickBackDrop = !!this.source;
    this.connectorSelectionModal.show(
      source =>
        this.showDataSourceConfigModal(source, () => {
          //Nothing to do, just close modal
        }),
      allowClickBackDrop
    );
  }

  private editDataSource(currentSource: Connector) {
    if (currentSource.className === ConnectorType.Unknown) {
      return;
    }
    this.showDataSourceConfigModal(
      currentSource,
      () => {
        //Nothing to do, just close modal
      },
      'Cancel'
    );
  }

  private async handleLoadConfig() {
    try {
      this.showLoading();
      await ConnectionModule.loadSource();
      await ConnectionModule.loadStatus();
      this.showLoaded();
    } catch (e) {
      Log.error('ClickhouseConfig::handleLoadConfig::error::', e);
      const exception = DIException.fromObject(e);
      this.showError(exception);
    }
  }

  private async handleUpdateSchema() {
    try {
      this.isRefreshSchemaLoading = true;
      await ConnectionModule.refreshSchema();
    } catch (e) {
      const exception = DIException.fromObject(e);
      PopupUtils.showError(exception.message);
      Log.error('ClickhouseConfig::handleUpdateSchema::error::', e);
    } finally {
      this.isRefreshSchemaLoading = false;
    }
  }

  private async handleRefreshStatus() {
    try {
      this.isRefreshStatusLoading = true;
      await ConnectionModule.loadStatus();
    } catch (e) {
      const exception = DIException.fromObject(e);
      PopupUtils.showError(exception.message);
      Log.error('ClickhouseConfig::handleRefreshStatus::error::', e);
    } finally {
      this.isRefreshStatusLoading = false;
    }
  }

  private get breadcrumbs(): Breadcrumbs[] {
    if (this.isExistedSource) {
      return [
        new Breadcrumbs({
          text: this.source!.displayName,
          to: {}
        })
      ];
    }
    return [];
  }

  private get headerResolver(): HeaderResolver {
    return new HeaderResolverBuilder()
      .add(ConnectorType.Clickhouse, new ClickhouseHeaderHandler())
      .add(ConnectorType.Bigquery, new BigqueryHeaderHandler())
      .add(ConnectorType.MySQL, new MySQLHeaderHandler())
      .add(ConnectorType.Vertica, new VerticaHeaderHandler())
      .add(ConnectorType.PostgreSQL, new PostgreSQLHeaderHandler())
      .addDefault(new DefaultHeaderHandler())
      .build();
  }
}
</script>
<style lang="scss" src="./ConnectorConfig.scss"></style>
