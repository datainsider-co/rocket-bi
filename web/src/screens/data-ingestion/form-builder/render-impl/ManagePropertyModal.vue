<template>
  <DiCustomModal hideHeaderClose ref="customModal" ok-title="Save" size="md" title="Custom Property" @hidden="resetData()" @onClickOk="handleClickOk">
    <div class="manage-property-body">
      <DiInputComponent
        :id="genInputId('field-name')"
        :is-error="$v.newFieldData.fieldName.$error"
        v-model="newFieldData.fieldName"
        autocomplete="off"
        label="Name"
        autofocus
        border
        placeholder="Input property name"
        @enter="handleClickOk"
      >
        <template #error>
          <div v-if="$v.newFieldData.fieldName.$error">
            <div v-if="!$v.newFieldData.fieldName.required" class="text-danger">Property Name is required</div>
          </div>
        </template>
      </DiInputComponent>
      <DiInputComponent
        :id="genInputId('field-value')"
        :is-error="$v.newFieldData.fieldValue.$error"
        v-model="newFieldData.fieldValue"
        class="mar-t-12"
        autocomplete="off"
        border
        placeholder="Input property value"
        label="Value"
        @enter="handleClickOk"
      >
        <template #error>
          <div v-if="$v.newFieldData.fieldValue.$error">
            <div v-if="!$v.newFieldData.fieldValue.required" class="text-danger">Property Value is required</div>
          </div>
        </template>
      </DiInputComponent>
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
import { CustomPropertyInfo } from '@/screens/user-management/components/user-detail/AddNewFieldModal.vue';
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
  protected newFieldData: CustomPropertyInfo = CustomPropertyInfo.empty();
  protected callback: ((field: CustomPropertyInfo) => Promise<void>) | null = null;

  @Ref()
  protected readonly customModal!: DiCustomModal;

  /**
   * @deprecated use showCreateProperty or showEditProperty instead of this method
   */
  show(fieldData: CustomPropertyInfo, callback: (field: CustomPropertyInfo) => Promise<void>) {
    this.resetData();
    this.newFieldData = cloneDeep(fieldData);
    this.callback = callback;
    this.customModal.show();
  }

  showCreateProperty(callback: (field: CustomPropertyInfo) => Promise<void>): void {
    this.resetData();
    this.callback = callback;
    this.customModal.show();
  }

  showEditProperty(key: string, value: string, callback: (field: CustomPropertyInfo) => Promise<void>): void {
    this.resetData();
    this.newFieldData = new CustomPropertyInfo(key, value);
    this.callback = callback;
    this.customModal.show();
  }

  hide() {
    this.customModal.hide();
  }

  protected isAddNewField(): boolean {
    this.$v.$touch();
    if (this.$v.$invalid) {
      return false;
    }
    return true;
  }

  protected async handleClickOk(event: MouseEvent) {
    event.preventDefault();
    try {
      if (this.isAddNewField()) {
        this.customModal.setLoading(true);
        if (this.callback) {
          await this.callback(this.newFieldData);
        }
        this.customModal.setLoading(false);
        this.hide();
      }
    } catch (ex) {
      Log.error('AddNewFieldModal::handleClickOk::error', ex);
      this.customModal.setLoading(false);
      this.customModal.setError(ex.message);
    }
  }

  protected resetData(): void {
    this.newFieldData = CustomPropertyInfo.empty();
    this.$v.$reset();
    this.callback = null;
  }
}
</script>
