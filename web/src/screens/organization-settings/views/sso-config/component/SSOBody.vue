<script lang="ts">
import { Component, Ref, Vue } from 'vue-property-decorator';
import { Status } from '@/shared';
import { GoogleOauthConfig, OauthConfig, OauthConfigResponse } from '@core/common/domain';
import { Log } from '@core/utils';
import { SSOConfigLoader } from '@/screens/organization-settings/views/sso-config/helper/SSOConfigLoader';
import { CustomCell, HeaderData } from '@/shared/models';
import { JobStatus } from '@core/data-ingestion';
import { HtmlElementRenderUtils, PopupUtils, StringUtils } from '@/utils';
import { StatusCell } from '@/shared/components/common/di-table/custom-cell/StatusCell';
import DiTable2 from '@/shared/components/common/di-table/DiTable2.vue';
import LoginSettingsModal from '@/screens/user-management/components/user-management/LoginSettingsModal.vue';
import SSOConfigModal from '@/screens/organization-settings/views/sso-config/component/SSOConfigModal.vue';
import { AuthenticationModule } from '@/store/modules/AuthenticationStore';
import { SSOActionCell } from '@/screens/organization-settings/views/sso-config/component/SSOActionCell';
import { cloneDeep } from 'lodash';
import Swal from 'sweetalert2';
import SSOSelectionModal from '@/screens/organization-settings/views/sso-config/component/SSOSelectionModal.vue';
import { LayoutNoData } from '@/shared/components/layout-wrapper';
import EventBus from '@/screens/organization-settings/views/sso-config/helper/EventBus';

@Component({
  components: { LayoutNoData, SSOSelectionModal, SSOConfigModal, LoginSettingsModal, DiTable2 }
})
export default class SSOBody extends Vue {
  private $alert!: typeof Swal;
  readonly Statuses = Status;
  status = Status.Loading;
  errorMsg = '';
  keyword = '';
  oauthConfigResponse: OauthConfigResponse = {};

  @Ref()
  private readonly ssoConfigModal!: SSOConfigModal;

  @Ref()
  private readonly ssoSelectionModal!: SSOSelectionModal;

  mounted() {
    this.init();
    EventBus.$on('sso-search', this.handleSearch);
    EventBus.$on('sso-refresh', this.init);
    EventBus.$on('show-sso-listing', this.showSSOListing);
  }

  beforeDestroy(): void {
    EventBus.$off('sso-search', this.handleSearch);
    EventBus.$off('sso-refresh', this.init);
    EventBus.$off('show-sso-listing', this.showSSOListing);
  }

  showSSOListing() {
    this.ssoSelectionModal.show(new Set(Object.keys(this.oauthConfigResponse)), this.handleAddSso);
  }

  handleAddSso(config: OauthConfig) {
    this.ssoConfigModal.show(config, editedConfig => this.updateSSOConfig(editedConfig, { message: `${editedConfig.getPrettyType()} is added!` }));
  }

  handleSearch(value: string) {
    this.keyword = value;
  }

  private async init() {
    try {
      this.errorMsg = '';
      this.status = Status.Loading;
      this.oauthConfigResponse = await new SSOConfigLoader().get();
      Log.debug('SSOBody::init', this.oauthConfigResponse);
      this.status = Status.Loaded;
    } catch (error) {
      Log.error(error);
      this.errorMsg = error.message;
      this.status = Status.Error;
    }
  }

  get records(): OauthConfig[] {
    return Object.values(this.oauthConfigResponse).filter(
      config => StringUtils.isIncludes(this.keyword, config.name) || StringUtils.isIncludes(this.keyword, config.getPrettyType())
    );
  }

  get headers(): HeaderData[] {
    return [
      {
        key: 'name',
        label: 'Name',
        customRenderBodyCell: new CustomCell(rowData => {
          const config = OauthConfig.fromObject(rowData).getIcon();
          const data = rowData.name;
          // eslint-disable-next-line
          const icon = require(`@/assets/icon/data_ingestion/datasource/${config}`);
          const imgElement = HtmlElementRenderUtils.renderImg(icon, 'data-source-icon');
          const dataElement = HtmlElementRenderUtils.renderText(data, 'span', 'source-name text-truncate');
          return HtmlElementRenderUtils.renderAction([imgElement, dataElement], 8, 'source-name-container');
        })
      },
      {
        key: 'oauthType',
        label: 'Type',
        customRenderBodyCell: new CustomCell(rowData => {
          const type = OauthConfig.fromObject(rowData).getPrettyType();

          return HtmlElementRenderUtils.renderText(type, 'span', 'text-truncate');
        }),
        width: 180
      },
      {
        key: 'isActive',
        label: 'Active',
        customRenderBodyCell: new CustomCell(rowData => {
          const activeIcon = StatusCell.jobStatusImg(JobStatus.Synced);
          const inActiveIcon = StatusCell.jobStatusImg(JobStatus.Error);
          return HtmlElementRenderUtils.renderImg(rowData.isActive ? activeIcon : inActiveIcon);
        }),
        width: 100
      },
      {
        key: 'action',
        label: 'Action',
        width: 150,
        disableSort: true,
        customRenderBodyCell: new SSOActionCell({
          onToggleActive: this.handleToggleSSO,
          onDelete: this.handleDeleteSSO
        })
      }
    ];
  }

  private handleToggleSSO(event: MouseEvent, config: OauthConfig) {
    event.stopPropagation();
    const updatedConfig = cloneDeep(config);
    updatedConfig.isActive = !config.isActive;
    const successMsg = updatedConfig.isActive ? `${config.name} is active` : `${config.name} is inactive`;
    return this.updateSSOConfig(updatedConfig, { message: successMsg });
  }

  private async updateSSOConfig(config: OauthConfig, options?: { message?: string }) {
    try {
      await AuthenticationModule.updateLoginMethods({ [config.oauthType.toString()]: config });
      AuthenticationModule.setLoginMethod({ googleOauthConfig: config as GoogleOauthConfig });
      this.$set(this.oauthConfigResponse, config.oauthType.toString(), config);
      PopupUtils.showSuccess(options?.message || 'SSO is updated successfully.');
    } catch (ex) {
      Log.error(ex);
      PopupUtils.showError(ex.message);
    }
  }

  private async handleDeleteSSO(event: MouseEvent, config: OauthConfig) {
    event.stopPropagation();
    const { isConfirmed } = await this.$alert.fire({
      icon: 'warning',
      title: `Remove ${config.name}`,
      html: `Are you sure that you want to remove ${config.name}?`,
      confirmButtonText: 'Yes',
      showCancelButton: true,
      cancelButtonText: 'No'
    });

    if (isConfirmed) {
      try {
        await AuthenticationModule.deleteLoginMethods({ type: config.oauthType });
        AuthenticationModule.setLoginMethod({ googleOauthConfig: null });
        this.$delete(this.oauthConfigResponse, config.oauthType.toString());
        PopupUtils.showSuccess(`${config.getPrettyType()} is deleted.`);
      } catch (ex) {
        Log.error(ex);
        PopupUtils.showError(ex.message);
      }
    }
  }

  onClickRow(config: OauthConfig) {
    Log.debug('onClickRow', config);
    this.ssoConfigModal.show(config, this.updateSSOConfig);
  }
}
</script>

<template>
  <div class="layout-content-panel">
    <div v-if="status === Statuses.Loading" class="d-flex flex-grow-1">
      <LoadingComponent v-if="status === Statuses.Loading"></LoadingComponent>
    </div>
    <div v-else-if="records.length === 0" class="d-flex flex-grow-1">
      <LayoutNoData icon="di-icon-sso">
        You don't have any SSO yet
      </LayoutNoData>
    </div>
    <DiTable2 v-else style="flex: auto" :error-msg="errorMsg" :headers="headers" :status="status" :records="records" @onClickRow="onClickRow" />
    <SSOConfigModal ref="ssoConfigModal" />
    <SSOSelectionModal ref="ssoSelectionModal" />
  </div>
</template>

<style scoped lang="scss"></style>
