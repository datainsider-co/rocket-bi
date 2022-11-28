<template>
  <div class="company-logo-component" v-loading="isLoading && allowShowLoading">
    <img
      alt="Logo company"
      :src="companyLogoUrl || defaultLogo"
      :height="height"
      :width="width"
      class="org-logo unselectable"
      @load="handleImageLoaded"
      @error="$event.target.src = defaultLogo"
    />
  </div>
</template>

<script lang="ts">
import { Component, Prop, Vue, Watch } from 'vue-property-decorator';

@Component
export default class LogoComponent extends Vue {
  private isLoading = false;

  @Prop({ required: false, type: Boolean, default: true })
  private readonly allowShowLoading!: boolean;

  @Prop({ required: false, type: String, default: '' })
  private readonly companyLogoUrl!: string;

  @Prop({ required: false, type: String, default: require('@/assets/logo/circle-logo.svg') })
  private readonly defaultLogo!: string;

  @Prop({ required: false, type: String, default: '128px' })
  private readonly width!: string;

  @Prop({ required: false, type: String, default: '128px' })
  private readonly height!: string;

  private handleImageLoaded() {
    this.isLoading = false;
  }

  @Watch('companyLogoUrl', { immediate: true })
  private handleCompanyLogoUrlChanged() {
    this.isLoading = true;
  }
}
</script>
