<script lang="ts">
import { Component, Vue } from 'vue-property-decorator';
import { ItemData, OauthType } from '@/shared';
import { OauthConfig } from '@core/common/domain';
import VisualizeSelectionModal from '@/screens/chart-builder/config-builder/chart-selection-panel/VisualizeSelectionModal.vue';
import DataSourceItem from '@/screens/data-ingestion/components/DataSourceItem.vue';

@Component({
  components: { DataSourceItem, VisualizeSelectionModal }
})
export default class SSOSelectionModal extends Vue {
  isShow = false;
  currentOauth: Set<OauthType> = new Set();
  onSelect: ((config: OauthConfig) => void) | null = null;

  show(currentOauth: Set<OauthType>, onSelect: (config: OauthConfig) => void) {
    this.isShow = true;
    this.currentOauth = currentOauth;
    this.onSelect = onSelect;
  }

  hide() {
    this.isShow = false;
  }

  handleClickSSO(item: ItemData) {
    const { type } = item;
    if (!this.currentOauth.has(type)) {
      const emptyConfig = OauthConfig.default(type);
      this.onSelect ? this.onSelect(emptyConfig) : void 0;
      this.hide();
      return;
    }
  }

  get ssoList(): ItemData[] {
    return [
      {
        title: 'Google',
        src: 'ic_google.svg',
        type: OauthType.GOOGLE
      }
    ];
  }

  isExisted(type: OauthType): boolean {
    return this.currentOauth.has(type);
  }
}
</script>

<template>
  <VisualizeSelectionModal
    :isShow.sync="isShow"
    title="Add Single Sign-On"
    sub-title="Select SSO Type"
    :all-items="ssoList"
    :no-close-on-esc="false"
    :no-close-on-backdrop="false"
    class="visualization-panel mb-3"
    @onItemSelected="handleClickSSO"
  >
    <template #default="{item, index, onClickItem}">
      <div class="sso-container" :class="{ 'sso-inactive': isExisted(item.type) }">
        <DataSourceItem :item="item" :key="index" :data-source="item.type" @onClickItem="onClickItem"></DataSourceItem>
        <div class="sso-existed" v-if="isExisted(item.type)">
          <img src="@/assets/icon/data_ingestion/status/synced.svg" alt="" width="40" height="40" />
        </div>
      </div>
    </template>
  </VisualizeSelectionModal>
</template>

<style lang="scss">
.sso-container.sso-inactive {
  position: relative;
  pointer-events: none;
  cursor: not-allowed;
  .datasource-item {
    cursor: not-allowed !important;
    img {
      -webkit-filter: blur(2px);
      filter: blur(2px);
    }
  }
  .sso-existed {
    position: absolute;
    left: 50%;
    top: 50%;
    transform: translate(-50%, -50%);
  }
}
</style>
