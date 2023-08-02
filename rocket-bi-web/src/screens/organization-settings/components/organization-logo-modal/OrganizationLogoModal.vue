<template>
  <DiCustomModal ref="modal" class="performance-modal" size="md" okTitle="Save" title="Company Logo" hide-header-close @onClickOk="handleOnClickOk">
    <div class="organization-logo-modal-body">
      <LogoComponent class="organization-logo-modal-body--content" :company-logo-url="logoUrl"></LogoComponent>
      <DiInputComponent
        placeholder="Input company logo url"
        class="organization-logo-modal-body--input"
        label="Logo url"
        type="text"
        :value="logoUrl"
        @change="updateLogoUrl"
        @enter="handleOnClickOk"
        autofocus
      ></DiInputComponent>
    </div>
  </DiCustomModal>
</template>

<script lang="ts">
import { Component, Ref, Vue } from 'vue-property-decorator';
import DiCustomModal from '@/shared/components/DiCustomModal.vue';
import DiInputComponent from '@/shared/components/DiInputComponent.vue';
import { TimeoutUtils } from '@/utils';
import LogoComponent from '@/screens/organization-settings/components/organization-logo-modal/LogoComponent.vue';

@Component({
  components: {
    LogoComponent,
    DiInputComponent,
    DiCustomModal
  }
})
export default class OrganizationLogoModal extends Vue {
  private onOk: (logoUrl: string) => void = () => void 0;
  private logoUrl = '';
  private isLoadingLogo = false;

  private get defaultLogoUrl() {
    return require('@/assets/logo/circle-logo.svg');
  }

  @Ref()
  private readonly modal!: DiCustomModal;

  private handleLogoLoaded() {
    this.isLoadingLogo = false;
  }

  show(logoUrl: string, onOk?: (logoUrl: string) => void) {
    this.logoUrl = logoUrl;
    this.modal.show();
    this.onOk = onOk ?? (() => void 0);
  }

  hide() {
    this.modal.hide();
  }

  setLoading(isLoading: boolean) {
    this.modal.setLoading(isLoading);
  }

  private handleOnClickOk(event?: MouseEvent) {
    if (event) {
      event.preventDefault();
    }
    this.onOk(this.logoUrl);
  }

  private updateLogoUrl(logoUrl: string) {
    this.isLoadingLogo = true;
    this.logoUrl = logoUrl;
  }
}
</script>

<style lang="scss">
.organization-logo-modal-body {
  display: flex;
  flex-direction: column;
  &--content {
    align-self: center;
    width: 128px;
    height: 128px;
  }
  &--input {
    margin-top: 16px;
  }
}
</style>
