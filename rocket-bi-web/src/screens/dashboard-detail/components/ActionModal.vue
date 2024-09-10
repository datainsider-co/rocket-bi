<template>
  <BModal ref="actionModal" id="action-modal" :title="title" :hide-header="true" centered size="sm" hide-footer class="di-modal">
    <div class="slot-body d-flex flex-column text-center">
      <img class="confirmation-image" src="@/assets/icon/ic_success.svg" alt="" />
      <div class="title">{{ title }}</div>
      <div class="message">{{ message }}</div>
      <div class="modal-actions-container">
        <template v-for="(action, index) in actions">
          <DiButton border :title="action.text" :key="index" @click.stop="event => selectAction(event, action)" />
        </template>
      </div>
    </div>
  </BModal>
</template>

<script lang="ts">
import { Component, Ref, Vue } from 'vue-property-decorator';
import { ContextMenuItem } from '@/shared';
import { BModal } from 'bootstrap-vue';
import DiButton from '@/shared/components/common/DiButton.vue';

@Component({
  components: { DiButton }
})
export default class ActionModal extends Vue {
  @Ref()
  private readonly actionModal!: BModal;

  protected title = '';
  protected message = '';
  protected actions: ContextMenuItem[] = [];

  loading = false;
  errorMsg = '';

  show(
    actions: ContextMenuItem[],
    options?: {
      title?: string;
      message?: string;
    }
  ) {
    this.actions = actions;
    this.setOptions(options);
    this.actionModal.show();
  }

  hide() {
    this.loading = false;
    this.errorMsg = '';
    this.$nextTick(() => {
      this.actionModal.hide();
    });
  }

  selectAction(event: MouseEvent, action: ContextMenuItem) {
    action.click ? action.click(event) : null;
    this.hide();
  }

  reset() {
    this.loading = false;
    this.errorMsg = '';
    this.setOptions({});
  }

  private setOptions(options?: { title?: string; message?: string }) {
    this.title = options?.title ?? '';
    this.message = options?.message ?? '';
  }
}
</script>

<style lang="scss">
@import '~@/themes/scss/mixin';

#confirmation-modal___BV_modal_outer_ {
  z-index: 9999999 !important;
}

#action-modal {
  .slot-body {
    .confirmation-image {
      margin: 8px auto 12px;
      width: 48px;
      height: 48px;
    }
    .title {
      @include medium-text(16px, 0.4px, 1.5);
      margin-bottom: 8px;
    }
    .message {
      font-size: 16px;
      font-weight: normal;
      font-stretch: normal;
      font-style: normal;
      line-height: 1.5;
      letter-spacing: 0.4px;
      text-align: center;
      color: var(--secondary-text-color);
      margin-bottom: 2px;

      word-break: break-word;

      display: -webkit-box;
      -webkit-box-orient: vertical;
      -webkit-line-clamp: 4;
      overflow: hidden;
      width: 100%;
    }
    .modal-actions-container {
      display: flex;
      flex-direction: column;
      gap: 0.5rem;
      .title {
        font-weight: normal !important;
      }
    }
  }

  .modal-dialog {
    max-width: 398px;
  }
  .modal-footer > button {
    flex-basis: 0;
    flex-grow: 1;
    max-width: 100%;
    height: 42px;
  }
}
</style>
