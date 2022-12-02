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
import { StringUtils } from '@/utils/StringUtils';
import { TrackingUtils } from '@core/tracking/TrackingUtils';
import { OrganizationStoreModule } from '@/store/modules/OrganizationStore';
import OrganizationPermissionModule from '@/store/modules/OrganizationPermissionStore';

@Component({
  components: { ConfirmationModal }
})
export default class App extends Vue {
  private readonly DEFAULT_FAVICON = '/favicon.ico';
  @Ref()
  confirmationModal!: ConfirmationModal;

  get themeName(): string {
    return _ThemeStore.currentThemeName;
  }

  constructor() {
    super();
    this.init();
  }

  private async init() {
    try {
      this.initTheme();
      await OrganizationStoreModule.init();
      await AuthenticationModule.init();
      await OrganizationPermissionModule.init();
    } catch (ex) {
      Log.error('init project failure', ex);
      this.$router.go(0);
    }
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

  mounted() {
    this.setActiveTheme('light', true);
    this.$nextTick(() => {
      PopupUtils.init(this);
      Modals.init(this.confirmationModal);
      TableTooltipUtils.initTooltip();
    });

    window.addEventListener('click', this.trackingClickEvent);
    window.addEventListener('change', this.trackInputEvent);
  }

  private trackInputEvent(event: Event) {
    const element = event.target as HTMLInputElement;
    // Log.debug('Event target::', event);
    if (element.nodeName === 'INPUT' || element.nodeName === 'TEXTAREA') {
      const id: string | null = element.getAttribute('id');
      const hideValue = element.getAttribute('hide-track-value') ? true : false;
      if (id && !StringUtils.isIncludes('bvid', id)) {
        const event = StringUtils.toSnakeCase(`${id}`);
        const value = hideValue ? 'unknown' : this.getInputValue(element);
        TrackingUtils.track(event, { value: value });
      }
    }
  }

  private getInputValue(element: HTMLInputElement): string | boolean {
    if (element.type === 'text') {
      return element.value;
    } else {
      return element.checked;
    }
  }

  private trackingClickEvent(event: MouseEvent) {
    try {
      const trackingElement = this.getTrackingElement(event);
      if (trackingElement) {
        const trackingEvent = trackingElement.getAttribute('event');
        if (trackingEvent) {
          TrackingUtils.track(trackingEvent, {});
        }
      }
    } catch (e) {
      //
    }
  }

  private getTrackingElement(event: MouseEvent): HTMLElement | null {
    //@ts-ignore
    const trackingElement = (event.path as HTMLElement[]).find(element => StringUtils.isNotEmpty(element.getAttribute('event')));
    if (trackingElement) {
      return trackingElement;
    }
    return null;
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
