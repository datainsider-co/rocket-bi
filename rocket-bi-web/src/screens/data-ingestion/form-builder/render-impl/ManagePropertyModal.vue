<template>
  <DiCustomModal hideHeaderClose ref="customModal" ok-title="Add New Property" size="md" title="Add New Property" @onClickOk="handleClickOk">
    <div class="new-field-body d-flex flex-column align-items-center">
      <div class="input-box px-0">
        <div class="title">Name</div>
        <BInput
          :id="genInputId('field-name')"
          v-model="newFieldData.fieldName"
          autocomplete="off"
          autofocus
          class="form-control"
          :class="{ danger: $v.newFieldData.fieldName.$error, 'border-0': !$v.newFieldData.fieldValue.$error }"
          placeholder="New property name"
          type="text"
          @keydown.enter="handleClickOk"
        />
        <div v-if="$v.newFieldData.fieldName.$error">
          <div v-if="!$v.newFieldData.fieldName.required" class="text-warning">Property Name is required</div>
        </div>
      </div>

      <div class="input-box px-0">
        <div class="title">Value</div>
        <BInput
          :id="genInputId('field-value')"
          v-model="newFieldData.fieldValue"
          trim
          autocomplete="off"
          class="form-control"
          :class="{ danger: $v.newFieldData.fieldValue.$error, 'border-0': !$v.newFieldData.fieldValue.$error }"
          placeholder="New property value"
          type="text"
          @keydown.enter="handleClickOk"
        />
        <div v-if="$v.newFieldData.fieldValue.$error">
          <div v-if="!$v.newFieldData.fieldValue.required" class="text-warning">Property Value is required</div>
        </div>
      </div>
      <div class="pt-3">
        <BSpinner v-if="isLoading" label="Spinning"></BSpinner>
        <pre v-if="isError" class="error-message ml-auto">{{ errorMessage }}</pre>
      </div>
    </div>
  </DiCustomModal>
</template>

<script lang="ts">
import DiCustomModal from '@/shared/components/DiCustomModal.vue';
import { Component, Ref, Vue } from 'vue-property-decorator';
import { required } from 'vuelidate/lib/validators';
import { DIException } from '@core/common/domain/exception';
import { Status } from '@/shared';
import { Log } from '@core/utils';
import { NewFieldData } from '@/screens/user-management/components/user-detail/AddNewFieldModal.vue';
import { cloneDeep } from 'lodash';

@Component({
  components: {
    DiCustomModal
  },
  validations: {
    newFieldData: {
      fieldName: { required },
      fieldValue: { required }
    }
  }
})
export default class ManagePropertyModal extends Vue {
  private newFieldData: NewFieldData = NewFieldData.empty();
  errorMessage = '';
  private status = Status.Loaded;
  private callback: ((field: NewFieldData) => Promise<void>) | null = null;

  @Ref()
  private customModal!: DiCustomModal;

  show(fielData: NewFieldData, callback: (field: NewFieldData) => Promise<void>) {
    this.resetData();
    this.newFieldData = cloneDeep(fielData);
    this.callback = callback;
    this.customModal.show();
  }

  hide() {
    this.customModal.hide();
    this.resetData();
  }

  private get isError() {
    return this.status === Status.Error;
  }

  private get isLoading() {
    return this.status === Status.Loading;
  }

  private isAddNewField(): boolean {
    // TODO: validate here
    this.$v.$touch();
    if (this.$v.$invalid) {
      return false;
    }
    return true;
  }

  private async handleClickOk(event: MouseEvent) {
    event.preventDefault();
    try {
      if (this.isAddNewField()) {
        // this.$emit('handleSubmitNewField', this.newFieldData);
        this.status = Status.Loading;
        if (this.callback) {
          await this.callback(this.newFieldData);
        }
        this.status = Status.Loaded;
        this.hide();
      }
    } catch (ex) {
      Log.error(ex);
      this.status = Status.Error;
      this.errorMessage = ex.message;
    }
  }

  handleError(ex: DIException) {
    Log.debug('AddNewFieldModal::handleError::error', ex.message);
    this.errorMessage = ex.message;
  }

  private resetData() {
    this.newFieldData = NewFieldData.empty();
    this.errorMessage = '';
    this.$v.$reset();
    this.status = Status.Loaded;
    this.callback = null;
  }
}
</script>
