<template>
  <div v-if="source" class="source-config mb-3">
    <div class="source-config-form">
      <DiInputComponent2 v-model="source.host" :error="hostErrorMsg" requireIcon label="Host" placeholder="Input host" />
      <DiInputComponent2 v-model="source.port" type="number" :error="portErrorMsg" requireIcon label="Port" placeholder="Input port" />
      <DiInputComponent2 v-model="source.username" :error="usernameErrorMsg" requireIcon label="Username" placeholder="Input username" />
      <DiInputComponent2 v-model="source.password" type="password" label="Password" placeholder="Input password" />
      <DiInputComponent2 v-model="source.catalog" label="Catalog" placeholder="Input catalog" />
      <DiToggle :value.sync="source.isLoadBalance" label="Using load balancing" style="padding-top: 24px;" />
    </div>

    <div class="add-properties d-flex flex-row align-items-center mt-17px">
      <div>Add Properties</div>
      <DiIconTextButton class="ml-auto" title="Add" @click="toggleAddPropertyInput">
        <i class="di-icon-add"></i>
      </DiIconTextButton>
    </div>

    <div class="added-property">
      <div v-for="(item, index) in extraFields" :key="index" class="added-property--row" :class="{ 'disable-edit': editingIndex !== index }">
        <div class="title new-extra-input input mb-0 mr-3" style="flex: 1">
          <BFormInput
            :id="'key_' + index"
            :readonly="editingIndex !== index"
            :class="{ error: editingKeyError }"
            placeholder="Input key"
            :value="item.key"
            @input="resetEditingKeyError"
            @keydown.enter="onEditField(getEditingKeyInputValue(), getEditingValueInputValue(), index)"
          ></BFormInput>
          <div v-if="index === editingIndex" class="error-message">
            {{ editingKeyError }}
          </div>
        </div>
        <div class="extra-input input flex-2" style="flex: 1">
          <BFormInput
            :id="'value_' + index"
            :readonly="editingIndex !== index"
            :class="{ error: editingValueError }"
            placeholder="Input value"
            :value="item.value"
            @input="resetEditingValueError"
            @keydown.enter="onEditField(getEditingKeyInputValue(), getEditingValueInputValue(), index)"
          ></BFormInput>
          <div v-if="index === editingIndex" class="error-message">
            {{ editingValueError }}
          </div>
        </div>
        <div v-if="index !== editingIndex" class="added-property--row--actions">
          <a href="#" class="text-button" @click="changeEditingIndex(index)">
            <img src="@/screens/organization-settings/views/clickhouse-config/icons/ic_edit.svg" alt="" />
          </a>
          <a href="#" class="text-button" @click="onDeleteExtraField(index)">
            <img src="@/screens/organization-settings/views/clickhouse-config/icons/ic_trash.svg" alt="" />
          </a>
        </div>
      </div>
    </div>

    <div v-if="isToggleAddProperties" :class="{ 'mt-17px': isToggleAddProperties }" class="add-new-property w-100 d-flex flex-column">
      <div class="d-flex w-100 justify-content-center align-items-start">
        <div class="title new-extra-input input mb-0 mr-3" style="flex: 1">
          <div class="title">Key</div>
          <BFormInput
            ref="newKeyInput"
            placeholder="Input key"
            :class="{ error: newKeyError }"
            v-model="newKey"
            @input="resetNewKeyError"
            @keydown.enter="onAddNewField(newKey, newValue)"
          ></BFormInput>
          <div class="error-message">
            {{ newKeyError }}
          </div>
        </div>
        <div class="extra-input input flex-2" style="flex: 1">
          <div class="title">Value</div>
          <BFormInput
            placeholder="Input value"
            :class="{ error: newValueError }"
            v-model="newValue"
            @input="resetNewValueError"
            @keydown.enter="onAddNewField(newKey, newValue)"
          ></BFormInput>
          <div class="error-message">
            {{ newValueError }}
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
<script lang="ts">
import { Component, Prop, PropSync, Vue, Ref } from 'vue-property-decorator';
import { Log } from '@core/utils';
import { cloneDeep, isEmpty, isNumber } from 'lodash';
import { StringUtils } from '@/utils';
import { VerticaSource } from '@core/clickhouse-config';
import DiToggle from '@/shared/components/common/DiToggle.vue';
import { required } from 'vuelidate/lib/validators';
import DiIconTextButton from '@/shared/components/common/DiIconTextButton.vue';
import { BFormInput } from 'bootstrap-vue';
import { DIException } from '@core/common/domain';
import DiInputComponent2 from '@/screens/login-v2/components/DiInputComponent2.vue';

@Component({
  components: { DiInputComponent2, DiIconTextButton, DiToggle },
  validations: {
    source: {
      host: { required },
      port: { required },
      username: { required }
    }
  }
})
export default class VerticaSourceForm extends Vue {
  @PropSync('model')
  source!: VerticaSource;

  private newKeyError = '';
  private newValueError = '';
  private editingKeyError = '';
  private editingValueError = '';
  private newKey = '';
  private newValue = '';

  private extraFields: { key: string; value: string }[] = [];
  private isToggleAddProperties = false;
  private editingIndex: number | null = null;

  @Ref()
  private newKeyInput?: BFormInput;

  mounted() {
    Log.debug('VerticaSourceForm::mounted');
    this.newKeyError = '';
    this.newKey = '';
    this.newValue = '';
    this.extraFields = this.extraFieldToArray(this.source.properties);
    this.resetValidate();
  }

  private extraFieldToArray(extraFields: Record<string, string>): { key: string; value: string }[] {
    const data: { key: string; value: string }[] = [];
    Object.keys(extraFields).forEach(key => {
      data.push({ key: key, value: extraFields[key] });
    });
    return data;
  }

  private arrayToExtraField(array: { key: string; value: string }[]): Record<string, string> {
    const extraField: Record<string, string> = {};
    array.forEach(item => {
      extraField[item.key] = item.value;
    });
    return extraField;
  }

  private get editingKeyInput(): HTMLInputElement | null {
    const keyInput: HTMLInputElement | null = document.querySelector(`#key_${this.editingIndex}`);
    Log.debug('editingKeyInput::', keyInput);
    return isNumber(this.editingIndex) && keyInput ? keyInput : null;
  }

  private getEditingKeyInputValue(): string {
    const keyInput = this.editingKeyInput;
    Log.debug('getEditingKeyInputValue::', keyInput);
    return isNumber(this.editingIndex) && keyInput ? keyInput.value : '';
  }

  private get editingValueInput(): HTMLInputElement | null {
    const valueInput: HTMLInputElement | null = document.querySelector(`#value_${this.editingIndex}`);
    Log.debug('editingValueInput::', valueInput);
    return isNumber(this.editingIndex) && valueInput ? valueInput : null;
  }

  private getEditingValueInputValue(): string {
    const valueInput = this.editingValueInput;
    Log.debug('getEditingValueInputValue::', valueInput);
    return isNumber(this.editingIndex) && valueInput ? valueInput.value : '';
  }

  private onDeleteExtraField(index: number) {
    this.extraFields = this.extraFields.filter((item, itemIndex) => itemIndex !== index);
    this.source.properties = this.arrayToExtraField(this.extraFields);
    this.revertEditingInput();
  }

  revertEditingInput() {
    if (isNumber(this.editingIndex)) {
      this.editingKeyInput?.setAttribute('value', this.extraFields[this.editingIndex].key);
      this.editingValueInput?.setAttribute('value', this.extraFields[this.editingIndex].value);
      this.editingIndex = null;
    }
  }

  private onAddNewField(key: string, value: string) {
    const isExistKey = this.extraFields.find(item => item.key === key);
    if (isExistKey) {
      this.newKeyError = 'Key is exist!';
    } else if (StringUtils.isEmpty(key)) {
      this.newKeyError = 'Key is required';
    } else if (StringUtils.isEmpty(value)) {
      this.newValueError = 'Value is required';
    } else {
      this.extraFields.push({ key: String(key).trim(), value });
      this.source.properties = this.arrayToExtraField(this.extraFields);
      this.newKeyError = '';
      this.newKey = '';
      this.newValue = '';
      this.revertEditingInput();
      this.newKeyInput?.focus();
    }
  }

  private onEditField(key: string, value: string, index: number) {
    Log.debug('onEditField::', key, value);
    const isExistKey = this.extraFields.find(item => item.key === key && this.editingIndex !== index);
    if (isExistKey) {
      this.editingKeyError = 'Key is exist!';
    } else if (StringUtils.isEmpty(key)) {
      this.editingKeyError = 'Key is required';
    } else if (StringUtils.isEmpty(value)) {
      this.editingValueError = 'Value is required';
    } else {
      this.extraFields[index] = { key: String(key).trim(), value };
      this.source.properties = this.arrayToExtraField(this.extraFields);
      this.editingKeyError = '';
      this.editingValueError = '';
      this.editingIndex = null;
    }
  }

  private resetNewKeyError() {
    this.newKeyError = '';
  }

  private resetNewValueError() {
    this.newValueError = '';
  }

  private resetEditingKeyError() {
    this.editingKeyError = '';
  }

  private resetEditingValueError() {
    this.editingValueError = '';
  }

  private toggleAddPropertyInput() {
    this.isToggleAddProperties = !this.isToggleAddProperties;
    this.revertEditingInput();
  }

  private changeEditingIndex(index: number) {
    this.editingIndex = index;
    this.editingKeyInput?.focus();
  }

  valid() {
    this.$v.$touch();
    if (this.$v.$invalid) {
      throw new DIException('Vertica source is invalid');
    }
  }

  resetValidate() {
    this.$v.$reset();
  }

  private submit() {
    this.$emit('submit');
  }

  private get hostErrorMsg(): string {
    if (!this.$v.source?.host?.$error) {
      return '';
    }
    if (!this.$v.source.host.required) {
      return 'Host is required!';
    }

    return '';
  }

  private get portErrorMsg(): string {
    if (!this.$v.source?.port?.$error) {
      return '';
    }
    if (!this.$v.source.port.required) {
      return 'Port is required!';
    }

    return '';
  }

  private get usernameErrorMsg(): string {
    if (!this.$v.source?.username?.$error) {
      return '';
    }
    if (!this.$v.source.username.required) {
      return 'Username is required!';
    }

    return '';
  }
}
</script>

<style lang="scss" src="../source-config.scss" />
