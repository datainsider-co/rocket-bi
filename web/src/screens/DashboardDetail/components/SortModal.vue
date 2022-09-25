<template>
  <EtlModal
    ref="modal"
    secondary-background-color
    class="sort-modal"
    @submit="submit"
    @hidden="resetModel"
    actionName="Save"
    borderCancel
    :width="444"
    builder-default-style
  >
    <template #header>
      <div class="mr-auto">
        <h4 class="title">Sort Orders</h4>
        <h6 class="sub-title">Drag to customize the order</h6>
      </div>
    </template>
    <div class="sort-modal-container">
      <vuescroll ref="scroller" :ops="scrollOption" style="position: unset">
        <draggable :list="list">
          <transition-group type="transition" name="flip-list">
            <template v-for="(text, index) in list">
              <div class="selected-column-info" :key="index">
                <div class="selected-column-info--display-name">{{ text[displayName] }}</div>
                <i class="di-icon-drag" />
              </div>
            </template>
          </transition-group>
        </draggable>
      </vuescroll>
    </div>
  </EtlModal>
</template>

<script lang="ts">
import EtlModalCtrl from '@/screens/DataCook/components/EtlModal/EtlModal.ctrl';
import EtlModal from '@/screens/DataCook/components/EtlModal/EtlModal.vue';
import { VerticalScrollConfigs } from '@/shared';
import { Widget, WidgetId } from '@core/domain';
import { cloneDeep } from 'lodash';
import { Component, Vue, Prop, Ref } from 'vue-property-decorator';
import draggable from 'vuedraggable';
import { Config } from 'vuescroll';

@Component({ components: { EtlModal, draggable } })
export default class SortModal extends Vue {
  private readonly scrollOption: Config = VerticalScrollConfigs;
  @Ref()
  private modal!: EtlModalCtrl;

  private list: any[] = [];
  private displayName = '';

  private callback: ((list: any[]) => void) | null = null;

  show(list: any[], options?: { onCompleted?: (list: any[]) => void; displayName?: string }) {
    this.list = cloneDeep(list);
    this.displayName = options?.displayName || '';
    this.callback = options?.onCompleted || null;
    this.modal.show();
  }

  private resetModel() {
    this.list = [];
    this.displayName = '';
    this.callback = null;
  }

  private async submit() {
    this.modal.hide();
    if (this.callback) {
      return this.callback(this.list);
    }
  }
}
</script>

<style lang="scss">
@import '~@/themes/scss/mixin.scss';

.sort-modal {
  .title {
    @include regular-text();
    font-size: 24px;
    margin-bottom: 4px;
  }

  .sub-title {
    margin-bottom: 12px;
  }

  .sort-modal-container {
    height: 400px;

    .input-group {
      input {
        padding: 0 12px;
      }
    }

    .selected-column-info {
      height: 46px;
      padding: 16px -11px;
      display: flex;
      justify-content: space-between;
      align-items: center;
      cursor: pointer;
      font-weight: 500;

      &:hover {
        background-color: var(--hover-color);
        cursor: move;
      }

      .selected-column-info--display-name {
        @include bold-text-14();
        clear: both;
        display: inline-block;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
      }
    }
  }
}
</style>
