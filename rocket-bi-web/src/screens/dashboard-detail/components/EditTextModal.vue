<template>
  <BModal builder-default-style id="edit-text-modal" ref="modal">
    <template #modal-header>
      <div>
        <img src="@/assets/icon/add-text.svg" alt="add text" />
        Add Text
      </div>
    </template>
    <PreviewText ref="previewText" :reviewWidth="reviewWidth" :reviewHeight="reviewHeight" />
    <template #modal-footer>
      <div class="text-right d-flex align-items-center">
        <DiButton class=" btn-secondary" title="Cancel" @click="hide"> </DiButton>
        <DiButton :disabled="loading || getIsEmptyContent()" class=" btn-primary" title="Save" @click="handleClickOk">
          <i v-if="loading" class="fa fa-spin fa-spinner"></i>
        </DiButton>
      </div>
    </template>
  </BModal>
</template>

<script lang="ts">
import { Vue, Component, Ref } from 'vue-property-decorator';
import { TextWidget } from '@core/common/domain/model';
import EtlModal from '@/screens/data-cook/components/etl-modal/EtlModal.vue';
import PreviewText from '@/screens/dashboard-detail/components/PreviewText.vue';
import { Log } from '@core/utils';
import { BModal } from 'bootstrap-vue';
import { StringUtils } from '@/utils';

@Component({
  components: { EtlModal, PreviewText }
})
export default class EditTextModal extends Vue {
  textWidget = TextWidget.empty();
  isEdit = false;
  loading = false;
  reviewWidth = '100%';
  reviewHeight = 'unset';

  $refs!: {
    editTextModal: any;
  };

  @Ref()
  private previewText?: PreviewText;

  @Ref()
  private modal!: BModal;

  private getIsEmptyContent() {
    return StringUtils.isEmpty(this.previewText?.textWidget?.content);
  }

  show(textWidget: TextWidget, isEdit: boolean, width: string, height: string) {
    this.modal.show();
    this.textWidget = textWidget;
    this.isEdit = isEdit;
    // if (isEdit) {
    this.reviewWidth = width;
    this.reviewHeight = height;
    // }
    // this.$refs.editTextModal.show();
    Log.debug('EditTextModal::show::', this.previewText);
    this.$nextTick(() => {
      this.previewText?.init(textWidget);
    });
  }

  public setLoading(loading: boolean) {
    this.loading = loading;
  }

  protected reset() {
    Log.debug('EditTextModal::reset::');
    this.isEdit = false;
    this.textWidget = TextWidget.empty();
  }

  hide() {
    this.modal.hide();
    // this.$refs.editTextModal.hide();
    this.reset();
  }

  handleClickOk(): void {
    const textWidget = this.previewText?.textWidget ?? TextWidget.empty();
    const widgetHeight = this.previewText?.getReviewWidgetHeight() ?? 297;
    if (this.isEdit) {
      this.$emit('onEditText', textWidget, widgetHeight);
    } else {
      Log.debug('EditTextModal::widgetHeight::', widgetHeight + 16);
      this.$emit('onCreateText', textWidget, widgetHeight + 16);
    }
  }
}
</script>

<style lang="scss">
@import '~@/themes/scss/di-variables.scss';

#edit-text-modal {
  .modal-header {
    padding: 20px 35px 0 !important;
    > div {
      display: flex;
      align-items: center;
      img {
        margin-right: 9px;
      }
    }
  }
  .modal-dialog {
    max-width: 1071px;
  }
  .modal-body {
    padding: 0 35px 22px;
  }
  .modal-footer {
    padding: 0 35px 30px;
    > div {
      margin: 0;
    }

    .di-button {
      height: 40px;
    }
    .btn-secondary {
      width: 83px;
      margin-right: 14px;
    }
    .btn-primary {
      width: 122px;
    }
  }
}
</style>
