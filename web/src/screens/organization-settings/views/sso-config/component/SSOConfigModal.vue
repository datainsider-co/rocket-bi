<script lang="ts">
import { Component, Ref, Vue } from 'vue-property-decorator';
import GoogleSettingItem from '@/screens/user-management/components/user-management/GoogleSettingItem.vue';
import StatusWidget from '@/shared/components/StatusWidget.vue';
import DiCustomModal from '@/shared/components/DiCustomModal.vue';
import MessageContainer from '@/shared/components/MessageContainer.vue';
import { OauthConfig } from '@core/common/domain';
import { cloneDeep } from 'lodash';
import { OauthType } from '@/shared';
import { SSOConfig } from '@/screens/organization-settings/views/sso-config/component/config/SSOConfig';
import { Log } from '@core/utils';

const GoogleSSOConfig = () => import('@/screens/organization-settings/views/sso-config/component/config/GoogleSSOConfig.vue');
@Component({
  components: { MessageContainer, DiCustomModal, StatusWidget, GoogleSettingItem }
})
export default class SSOConfigModal extends Vue {
  static components: Map<OauthType, Function> = new Map([[OauthType.GOOGLE, GoogleSSOConfig]]);

  config: OauthConfig | null = null;
  loading = false;
  errorMsg = '';
  callback: ((config: OauthConfig) => Promise<void>) | null = null;
  @Ref()
  private readonly modal!: DiCustomModal;

  @Ref()
  private readonly configBody!: SSOConfig;

  show(config: OauthConfig, onCompleted: (config: OauthConfig) => Promise<void>) {
    this.clearData();
    this.init(config, onCompleted);
    this.modal.show();
  }

  private init(config: OauthConfig, onCompleted: (config: OauthConfig) => Promise<void>) {
    this.loading = false;
    this.errorMsg = '';
    this.config = cloneDeep(config);
    this.callback = onCompleted;
  }

  private clearData() {
    this.loading = false;
    this.errorMsg = '';
    this.config = null;
    this.callback = null;
  }

  handleClose() {
    // this.loading = false;
    // this.errorMsg = '';
    // this.config = null;
    // this.callback = null;
  }

  async handleSave(e: MouseEvent) {
    e.preventDefault();
    Log.debug('handleSave::', this.config, this.configBody.validated());
    if (this.config && this.configBody.validated()) {
      this.callback ? this.callback(this.config) : void 0;
      this.$nextTick(() => {
        this.clearData();
        this.modal.hide();
      });
      return;
    }
  }

  get toComponent(): Function | undefined {
    if (!this.config) {
      return void 0;
    }
    return SSOConfigModal.components.get(this.config.oauthType);
  }

  get modalTitle(): string {
    if (!this.config) {
      return '';
    }
    return `${this.config.getPrettyType()} Config`;
  }
}
</script>

<template>
  <DiCustomModal
    ref="modal"
    hide-header-close
    modal-class="login-method"
    ok-title="Save"
    size="md"
    :title="modalTitle"
    @hide="handleClose"
    @onClickOk="handleSave($event)"
  >
    <template v-if="toComponent">
      <component ref="configBody" v-model="config" v-if="toComponent" :is="toComponent" />
    </template>
  </DiCustomModal>
</template>

<style scoped lang="scss"></style>
