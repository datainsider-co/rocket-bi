<template>
  <div id="app">
    <router-view></router-view>
    <ConfirmationModal ref="confirmationModal"></ConfirmationModal>
    <DiUploadComponent></DiUploadComponent>
  </div>
</template>

<script lang="ts">
import { Component, Ref, Vue, Watch } from 'vue-property-decorator';
import { _ThemeStore } from '@/store/modules/ThemeStore';
import { PopupUtils } from '@/utils/PopupUtils';
import ConfirmationModal from '@/screens/confirmation/view/ConfirmationModal.vue';
import { Modals } from '@/utils/Modals';
import { TableTooltipUtils } from '@chart/custom-table/TableTooltipUtils';
import { ThemeUtils } from '@/utils/ThemeUtils';
import { Log } from '@core/utils/Log';
import { AuthenticationModule } from '@/store/modules/AuthenticationStore';
import { OrganizationStoreModule } from '@/store/modules/OrganizationStore';
import { Inject } from 'typescript-ioc';
import { ClickhouseConfigService } from '@core/clickhouse-config';
import { RouterUtils } from '@/utils';
import { Routers } from '@/shared';
import { ConnectionModule } from '@/screens/organization-settings/stores/ConnectionStore';
import { PlanAndBillingModule } from '@/screens/organization-settings/stores/PlanAndBillingStore';

@Component({
  components: { ConfirmationModal }
})
export default class App extends Vue {
  private readonly DEFAULT_FAVICON = '/favicon.ico';
  @Ref()
  confirmationModal!: ConfirmationModal;

  @Inject
  clickhouseService!: ClickhouseConfigService;

  get themeName(): string {
    return _ThemeStore.currentThemeName;
  }

  constructor() {
    super();
    this.initTheme();
    OrganizationStoreModule.init();
    AuthenticationModule.init();
  }

  private get logoUrl(): string {
    return OrganizationStoreModule.organization.thumbnailUrl || '';
  }

  private get companyName(): string {
    return OrganizationStoreModule.organization.name || '';
  }

  @Watch('themeName')
  onThemNameChanged(newTheme: string, oldTheme: string) {
    this.setActiveTheme(newTheme, true);
    this.setActiveTheme(oldTheme, false);
  }

  private setActiveTheme(theme: string, isActive: boolean) {
    document.documentElement.toggleAttribute(theme, isActive);
    document.documentElement.classList.toggle(theme, isActive);
  }

  async mounted() {
    this.setActiveTheme('light', true);
    this.$nextTick(() => {
      PopupUtils.init(this);
      Modals.init(this.confirmationModal);
      TableTooltipUtils.initTooltip();
    });
    if (RouterUtils.isLogin()) {
      await PlanAndBillingModule.init();
      await this.handleInitClickhouseConfig();
    }
  }

  destroyed() {
    ConnectionModule.reset();
  }

  private async handleInitClickhouseConfig() {
    try {
      await ConnectionModule.init();
      if (ConnectionModule.isNavigateToConnectionConfig) {
        await RouterUtils.to(Routers.ClickhouseConfig);
      }
    } catch (e) {
      Log.error('Login::handleCheckClickhouseConfig::error::', e);
    }
  }

  private initTheme() {
    const mainTheme = ThemeUtils.getMainTheme();
    Log.debug('MainTheme', mainTheme);
    _ThemeStore.applyMainTheme({
      themeName: mainTheme,
      force: true
    });
  }

  @Watch('logoUrl', { immediate: true })
  handleLogoUrlChanged(newLogoUrl: string, oldLogoUrl: string) {
    if (newLogoUrl !== oldLogoUrl) {
      const favicon: NodeListOf<HTMLElement> = document.getElementsByName('favicon');
      favicon.forEach(element => {
        element.setAttribute('href', newLogoUrl || this.DEFAULT_FAVICON);
      });
      Log.debug('handleLogoUrlChanged number of favicon', favicon.length);
    }
  }

  @Watch('companyName', { immediate: true })
  handleCompanyNameChanged(newCompanyName: string, oldCompanyName: string) {
    if (newCompanyName !== oldCompanyName) {
      const companyNameElement = document.getElementById('company-name');
      Log.debug('handleCompanyNameChanged::companyNameElement', companyNameElement);

      if (companyNameElement) {
        companyNameElement.innerText = newCompanyName;
      }
    }
  }
}
</script>

<style lang="scss">
@import '~@/themes/scss/custom-vue-context.scss';
@import '~@/themes/scss/data-builder/custom/vue-context.scss';
@import '~@/themes/scss/vuesroll.scss';
</style>
