<template>
  <LayoutContent>
    <LayoutHeader ref="layoutHeader" title="Clickhouse Config" icon="di-icon-clickhouse-config">
      <div class="ml-auto d-flex align-items-center">
        <DiIconTextButton class="mr-2" title="Update schema" @click="handleUpdateSchema">
          <i class="di-icon-sync datasource-action-icon"></i>
        </DiIconTextButton>
        <DiIconTextButton title="Refresh" @click="handleUpdateConfig">
          <i class="di-icon-reset datasource-action-icon"></i>
        </DiIconTextButton>
      </div>
    </LayoutHeader>
    <div class="clickhouse-config" :style="{ height: `calc(100% - ${headerHeight}px)` }">
      <StatusWidget class="position-relative" :status="status" :error="errorMessage" @retry="handleLoadConfig">
        <template v-if="isEmptyData">
          <div class="h-100 d-flex flex-column bg-white align-items-center justify-content-center">
            <DiButton border title="Create Clickhouse Source" @click="showCreateClickhouseSourceModal()">
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
          :records="systemInfo.sources"
          :status="status"
          class="clickhouse-config-table"
          :isShowPagination="false"
          :total="1"
          @onRetry="handleLoadConfig"
        />
        <!--        </div>-->
      </StatusWidget>
    </div>
    <ClickhouseSourceModal ref="modal"></ClickhouseSourceModal>
  </LayoutContent>
</template>
<script lang="ts">
import { Component, Ref, Vue } from 'vue-property-decorator';
import { LayoutContent, LayoutHeader } from '@/shared/components/LayoutWrapper';
import { Status } from '@/shared';
import StatusWidget from '@/shared/components/StatusWidget.vue';
import { DIException } from '@core/domain';
import { Log } from '@core/utils';
import { DateTimeFormatter, ListUtils } from '@/utils';
import EmptyDirectory from '@/screens/DashboardDetail/components/EmptyDirectory.vue';
import DiButton from '@/shared/components/Common/DiButton.vue';
import { ClickhouseSource } from '@core/ClickhouseConfig/Domain/ClickhouseSource/ClickhouseSource';
import { ClickhouseConfigService, RefreshStatus, SystemInfo, SystemStatus } from '@core/ClickhouseConfig';
import { Inject } from 'typescript-ioc';
import ClickhouseSourceModal from '@/screens/OrganizationSettings/views/ClickhouseConfig/ClickhouseSourceModal.vue';
import { UpdateSystemInfoRequest } from '@core/ClickhouseConfig/Request';
import { CustomCell, RowData } from '@/shared/models';
import DiTable2 from '@/shared/components/Common/DiTable/DiTable2.vue';
import { HtmlElementRenderUtils } from '@/utils/HtmlElementRenderUtils';
import { StringUtils } from '@/utils/string.utils';

@Component({
  components: {
    ClickhouseSourceModal,
    DiButton,
    EmptyDirectory,
    LayoutContent,
    LayoutHeader,
    StatusWidget,
    DiTable2
  }
})
export default class ClickhouseConfig extends Vue {
  private cellWidth = 220;
  private status: Status = Status.Loaded;
  private errorMessage = '';
  private headerHeight = 0;

  private systemInfo: SystemInfo = SystemInfo.default();

  @Inject
  private clickhouseConfigService!: ClickhouseConfigService;

  @Ref()
  private layoutHeader!: LayoutHeader;

  @Ref()
  private modal!: ClickhouseSourceModal;

  private get isEmptyData() {
    return ListUtils.isEmpty(this.systemInfo.sources);
  }

  private get headers() {
    return [
      {
        key: 'username',
        label: 'Username',
        customRenderBodyCell: new CustomCell(rowData => {
          const data = rowData?.username ?? '--';
          // eslint-disable-next-line
          // const datasourceImage = require(`@/assets/icon/data_ingestion/datasource/ic_default.svg`);
          // const imgElement = HtmlElementRenderUtils.renderImg(datasourceImage, 'data-source-icon');
          const dataElement = HtmlElementRenderUtils.renderText(data, 'span', 'username text-truncate');
          return HtmlElementRenderUtils.renderAction([dataElement], 8, 'title-cell');
        }),
        disableSort: true
      },
      {
        key: 'jdbcUrl',
        label: 'Jdbc Url',
        disableSort: true
      },
      {
        key: 'status',
        label: 'Last Status',
        customRenderBodyCell: new CustomCell(rowData => {
          // eslint-disable-next-line
          const statusSource = SystemInfo.getIconFromRefreshStatus(this.systemInfo.lastRefreshStatus ?? RefreshStatus.Init);
          const imgElement = HtmlElementRenderUtils.renderImg(statusSource, 'status-icon');
          const dataElement = HtmlElementRenderUtils.renderText(
            DateTimeFormatter.formatAsMMMDDYYYHHmmss(this.systemInfo.updatedTime),
            'span',
            'username text-truncate'
          );
          return HtmlElementRenderUtils.renderAction([imgElement, dataElement], 8);
        }),
        disableSort: true,
        width: this.cellWidth
      },
      {
        key: 'lastRefreshBy',
        label: 'Last Refresh By',
        customRenderBodyCell: new CustomCell(rowData => {
          return HtmlElementRenderUtils.renderText(StringUtils.camelToCapitalizedStr(this.systemInfo.lastRefreshBy as string), 'span', 'text-truncate');
        }),
        disableSort: true,
        width: (this.cellWidth * 2) / 3
      },
      {
        key: 'systemStatus',
        label: 'System Status',
        customRenderBodyCell: new CustomCell(rowData => {
          const iconLive = `<div class="icon-live"></div>`;
          const iconDead = `<div class="icon-dead"></div>`;
          let ele = iconLive;
          // eslint-disable-next-line
          switch (this.systemInfo.status) {
            case SystemStatus.Healthy:
              ele = iconLive;
              break;
            case SystemStatus.UnHealthy:
              ele = iconDead;
              break;
          }

          const status = HtmlElementRenderUtils.renderText(StringUtils.camelToCapitalizedStr(this.systemInfo.status), 'span');
          return HtmlElementRenderUtils.renderAction([HtmlElementRenderUtils.renderHtmlAsElement(ele), status], 8);
        }),
        disableSort: true,
        width: this.cellWidth
      }
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

  private showCreateClickhouseSourceModal() {
    this.modal.showCreate(this.editSource, this.handleLoadConfig);
  }

  private showEditClickhouseSourceModal(rowData: RowData) {
    const source = ClickhouseSource.fromObject(rowData);
    this.modal.showEdit(source, this.editSource, this.handleUpdateConfig);
  }

  mounted() {
    this.headerHeight = this.layoutHeader.$el.clientHeight;
    this.handleLoadConfig();
  }

  private async handleLoadConfig() {
    try {
      this.showLoading();
      this.systemInfo = await this.clickhouseConfigService.getSystemInfo();
      this.showLoaded();
    } catch (e) {
      const exception = DIException.fromObject(e);
      this.showError(exception);
    }
  }

  private async handleUpdateSchema() {
    try {
      this.showLoading();
      await this.clickhouseConfigService.refreshSchema();
      this.systemInfo = await this.clickhouseConfigService.getSystemInfo();
      this.showLoaded();
    } catch (e) {
      const exception = DIException.fromObject(e);
      this.showError(exception);
    }
  }

  private async handleUpdateConfig() {
    try {
      this.showUpdating();
      this.systemInfo = await this.clickhouseConfigService.getSystemInfo();
      this.showLoaded();
    } catch (e) {
      const exception = DIException.fromObject(e);
      this.showError(exception);
    }
  }

  private async editSource(source: ClickhouseSource) {
    await this.clickhouseConfigService.updateSystemInfo(new UpdateSystemInfoRequest([source]));
  }
}
</script>
<style lang="scss" src="./ClickhouseConfig.scss"></style>
