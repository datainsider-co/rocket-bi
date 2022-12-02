<template>
  <div class="company-logo-name-component">
    <LogoComponent :style="{ width: width, height: height }" :width="width" :height="height" :company-logo-url="logoUrl" :allowShowLoading="false" />
    <div class="company-logo-name-component--name unselectable">{{ companyName }}</div>
  </div>
</template>

<script lang="ts">
import { Component, Prop, Vue } from 'vue-property-decorator';
import LogoComponent from '@/screens/organization-settings/components/organization-logo-modal/LogoComponent.vue';
import { OrganizationStoreModule } from '@/store/modules/OrganizationStore';

@Component({
  components: {
    LogoComponent
  }
})
export default class CompanyLogoNameComponent extends Vue {
  @Prop({ required: false, type: String, default: '40px' })
  private readonly width!: string;

  @Prop({ required: false, type: String, default: '40px' })
  private readonly height!: string;

  private get logoUrl(): string {
    return OrganizationStoreModule.organization.thumbnailUrl || '';
  }

  private get companyName(): string {
    return OrganizationStoreModule.organization.name || '';
  }
}
</script>

<style lang="scss">
.company-logo-name-component {
  display: flex;
  flex-direction: row;
  color: var(--white);
  align-items: center;

  &--name {
    font-size: 22px;
    font-weight: 400;
    margin-left: 10px;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }
}
</style>
