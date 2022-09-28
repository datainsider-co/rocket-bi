<template>
  <BModal id="editTextModal" ref="editTextModal" centered ok-title="Save" cancel-title="Cancel" title="add text" class="rounded" size="lg" @ok="handleClickOk">
    <template v-slot:modal-header="{ close }">
      <h6 class="modal-title">Add text</h6>
      <button type="button" class="close btn-ghost" @click.prevent="close()" aria-label="Close">
        <BIconX class="button-x" />
      </button>
    </template>
    <template v-slot:default="{ ok }">
      <PreviewText :widget="textWidget" @change="handlePreviewTextChanged" @submit="ok()" />
    </template>
  </BModal>
</template>

<script lang="ts">
import { Vue, Component } from 'vue-property-decorator';
import { TextWidget } from '@core/domain/Model';
import PreviewText from '@/screens/DashboardDetail/components/PreviewText.vue';

@Component({
  components: { PreviewText }
})
export default class EditTextModal extends Vue {
  textWidget = TextWidget.empty();
  isEdit = false;

  $refs!: {
    editTextModal: any;
  };

  handlePreviewTextChanged(textWidget: TextWidget) {
    this.textWidget = textWidget;
  }

  show(textWidget: TextWidget, isEdit: boolean) {
    this.textWidget = textWidget;
    this.isEdit = isEdit;
    this.$refs.editTextModal.show();
  }

  handleClickOk(): void {
    if (this.isEdit) {
      this.$emit('onEditText', this.textWidget);
    } else {
      this.$emit('onCreateText', this.textWidget);
    }
  }
}
</script>

<style lang="scss" scoped>
@import '~@/themes/scss/di-variables.scss';
.modal-title {
  font-size: 24px;
  line-height: 1.17;
  letter-spacing: 0.2px;
  color: var(--secondary-text-color);
}
.button-x {
  color: $greyTextColor;
}

h6 {
  font-size: 14px;
}

::v-deep .btn {
  padding: 0.5rem 5rem !important;
  font-size: 14px;
}
.modal-header .close {
  padding: 4px;
  margin: -2px;
}
</style>
