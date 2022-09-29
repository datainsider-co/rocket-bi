<template>
  <BModal
    id="visualize-selection"
    centered
    class="rounded"
    size="lg"
    :cancel-disabled="false"
    :no-close-on-backdrop="noCloseOnBackdrop"
    :no-close-on-esc="noCloseOnEsc"
    :hide-footer="true"
    :hide-header="true"
    v-model="isShowSync"
  >
    <template #default>
      <div class="header">
        <div class="title">{{ title }}</div>
        <div class="sub-title">{{ subTitle }}</div>
      </div>
      <div class="body">
        <vuescroll>
          <div class="d-flex flex-wrap justify-content-center align-items-start item-listing">
            <template v-for="(item, index) in allItems">
              <slot :item="item" :index="index" :onClickItem="handleItemClicked">
                <VisualizationItem :item="item" :key="index" @onClickItem="handleItemClicked"> </VisualizationItem>
              </slot>
            </template>
          </div>
        </vuescroll>
      </div>
    </template>
  </BModal>
</template>

<script lang="ts">
import { Component, Emit, Prop, PropSync, Vue } from 'vue-property-decorator';
import VisualizationItem from '@/screens/chart-builder/config-builder/chart-selection-panel/VisualizationItem.vue';
import { VisualizationItemData } from '@/shared';

@Component({
  components: { VisualizationItem }
})
export default class VisualizeSelectionModal extends Vue {
  @PropSync('isShow', { type: Boolean })
  isShowSync!: boolean;

  @Prop({ required: true })
  private allItems!: VisualizationItemData[];

  @Prop({ default: '', type: String })
  title!: string;

  @Prop({ default: 'Select a visualization to start. Don’t worry, you could change it later', type: String })
  subTitle!: string;

  @Prop({ default: true, type: Boolean })
  noCloseOnEsc!: boolean;

  @Prop({ default: true, type: Boolean })
  noCloseOnBackdrop!: boolean;

  @Emit('onItemSelected')
  private handleItemClicked(item: VisualizationItemData) {
    return item;
  }
}
</script>

<style lang="scss" scoped>
@import '~@/themes/scss/mixin.scss';

::v-deep {
  .modal-body {
    padding: 24px;
  }
}

.header {
  @include regular-text();
  letter-spacing: 0.2px;
  text-align: center;

  .title {
    font-size: 24px;
    font-weight: 500;
    line-height: 1.17;
  }

  .sub-title {
    font-size: 14px;
    color: var(--secondary-text-color);
  }

  .title + .sub-title {
    margin-top: 16px;
  }
}

.body {
  .item-listing {
    max-height: 450px;
  }
}

.header + .body {
  margin-top: 12px;
}
</style>
