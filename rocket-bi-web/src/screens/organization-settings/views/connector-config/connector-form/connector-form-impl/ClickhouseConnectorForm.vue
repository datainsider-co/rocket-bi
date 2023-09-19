<template>
  <div v-if="source" class="clickhouse-source-config mb-3">
    <div class="clickhouse-source-config-form">
      <div class="clickhouse-source-config-form--row">
        <div class="clickhouse-source-config-form--row--form-item">
          <div class="title required unselectable">Host</div>
          <BFormInput
            autofocus
            autocomplete="off"
            :class="{ error: $v.source.host.$error }"
            class=" text-truncate"
            v-model="source.host"
            placeholder="Input host"
            @keydown.enter="submit"
          ></BFormInput>
          <div v-if="$v.source.host.$error" class="error-message">
            Host is required
          </div>
        </div>
        <div class="clickhouse-source-config-form--row--form-item">
          <div class="title required">HTTP Port</div>
          <BFormInput
            autocomplete="off"
            :class="{ error: $v.source.httpPort.$error }"
            class=" text-truncate"
            v-model="source.httpPort"
            placeholder="Input HTTP port"
            type="number"
          ></BFormInput>
          <div v-if="$v.source.httpPort.$error" class="error-message">
            HTTP Port is required
          </div>
        </div>
      </div>
      <div class="clickhouse-source-config-form--row">
        <div class="clickhouse-source-config-form--row--form-item">
          <div class="title required unselectable">TCP Port</div>
          <BFormInput
            autocomplete="off"
            :class="{ error: $v.source.tcpPort.$error }"
            class=" text-truncate"
            v-model="source.tcpPort"
            placeholder="Input TCP port"
            type="number"
          ></BFormInput>
          <div v-if="$v.source.tcpPort.$error" class="error-message">
            TCP Port is required
          </div>
        </div>
        <div class="clickhouse-source-config-form--row--form-item">
          <div class="title unselectable">Cluster name</div>
          <BFormInput autocomplete="off" class="text-truncate" v-model="source.clusterName" placeholder="Input cluster name"></BFormInput>
        </div>
      </div>
      <div class="clickhouse-source-config-form--row">
        <div class="clickhouse-source-config-form--row--form-item">
          <div class="title required unselectable">Username</div>
          <BFormInput
            autocomplete="new-password"
            :class="{ error: $v.source.username.$error }"
            class=" text-truncate"
            v-model="source.username"
            placeholder="Input username"
          ></BFormInput>
          <div v-if="$v.source.username.$error" class="error-message">
            TCP Port is required
          </div>
        </div>
        <div class="clickhouse-source-config-form--row--form-item">
          <div class="title">Password</div>
          <BFormInput autocomplete="new-password" class=" text-truncate" v-model="source.password" placeholder="Input password" type="password"></BFormInput>
        </div>
      </div>
    </div>

    <DiToggle class="ssl-toggle" :value.sync="source.useSsl" label="SSL Connection"></DiToggle>
    <SSHTunnel ref="sshConfigComponent" @loadPublicKeyError="handleLoadPublicKeyError" @change="handleSSHConfigChanged"></SSHTunnel>

    <div class="add-properties d-flex flex-row align-items-center">
      <div>Add Properties</div>
      <DiIconTextButton class="ml-auto" title="Add" @click="toggleAddPropertyInput">
        <i class="di-icon-add"></i>
      </DiIconTextButton>
    </div>
    <div class="added-property">
      <div v-for="(item, index) in extraFields" :key="index" class="added-property--row" :class="{ 'disable-edit': editingIndex !== index }">
        <div class="added-property--row--item mb-0 mr-3" style="flex: 1">
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
        <div class="added-property--row--item added-property--row--value " style="flex: 1">
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
            <img src="@/screens/organization-settings/views/connector-config/icons/ic_edit.svg" alt="" />
          </a>
          <a href="#" class="text-button" @click="onDeleteExtraField(index)">
            <img src="@/screens/organization-settings/views/connector-config/icons/ic_trash.svg" alt="" />
          </a>
        </div>
      </div>
    </div>

    <div v-if="isToggleAddProperties" :class="{ 'mt-17px': isToggleAddProperties }" class="add-new-property w-100 d-flex flex-column">
      <div class="d-flex w-100 justify-content-center align-items-start">
        <div class="mb-0 mr-3" style="flex: 1">
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
        <div style="flex: 1">
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
import { ClickhouseConnector, SSHConfig } from '@core/connector-config';
import DiToggle from '@/shared/components/common/DiToggle.vue';
import { required } from 'vuelidate/lib/validators';
import DiIconTextButton from '@/shared/components/common/DiIconTextButton.vue';
import { BFormInput } from 'bootstrap-vue';
import { DIException } from '@core/common/domain';
import SSHTunnel from '@/screens/organization-settings/views/connector-config/components/ssh-tunnel/SSHTunnel.vue';
@Component({
  components: { DiIconTextButton, DiToggle, SSHTunnel },
  validations: {
    source: {
      host: { required },
      httpPort: { required },
      tcpPort: { required },
      username: { required }
    }
  }
})
export default class ClickhouseConnectorForm extends Vue {
  @PropSync('model')
  source!: ClickhouseConnector;

  @Ref()
  sshConfigComponent?: SSHTunnel;

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
    Log.debug('ClickhouseSourceForm::mounted');
    this.newKeyError = '';
    this.newKey = '';
    this.newValue = '';
    this.extraFields = this.extraFieldToArray(this.source.properties);
    this.resetValidate();
    this.$nextTick(() => {
      this.resetSSHConfig();
      this.setSSHConfig();
    });
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
      throw new DIException('Clickhouse source is invalid');
    }
    this.sshConfigComponent?.valid();
  }

  resetValidate() {
    this.$v.$reset();
  }

  private submit() {
    this.$emit('submit');
  }

  private handleLoadPublicKeyError(e: DIException) {
    this.$emit('loadPublicKeyError', e);
  }

  private handleSSHConfigChanged(sshConfig: SSHConfig) {
    this.source.tunnelConfig = sshConfig;
  }

  setSSHConfig() {
    Log.debug('ClickhouseSourceForm::setSSHConfig::', this.sshConfigComponent, this.source.tunnelConfig);
    this.sshConfigComponent?.setConfig(this.source.tunnelConfig);
  }

  resetSSHConfig() {
    this.sshConfigComponent?.reset();
  }
}
</script>

<style lang="scss">
@import '~@/themes/scss/mixin.scss';

.clickhouse-source-config {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  justify-content: left;

  .clickhouse-source-config-form {
    width: 100%;
    display: flex;
    flex-direction: column;
    align-items: center;

    &--row {
      width: 100%;
      display: flex;
      align-items: flex-start;
      column-gap: 17px;

      &--form-item {
        flex: 1;
      }

      &:not(:last-child) {
        margin-bottom: 24px;
      }
    }
  }

  .ssl-toggle {
    margin-top: 30px;
    margin-bottom: 24px;
  }

  .ssh-tunnel {
    margin-bottom: 24px;
  }

  .mt-17px {
    margin-top: 17px;
  }

  .added-property {
    display: flex;
    flex-direction: column;
    width: 100%;

    &--row {
      display: flex;
      flex-direction: row;
      border-radius: 4px;
      position: relative;

      &--actions {
        display: flex;
        align-items: center;
        position: absolute;
        right: 14.6px;
        top: 0;
        bottom: 0;
        margin: 0 auto;

        .text-button {
          display: flex;
          align-items: center;
          justify-content: center;
          &:hover {
            background-color: var(--icon-hover-color, #d6d6d6) !important;
          }

          width: 24px;
          height: 24px;
          border-radius: 50%;
        }

        .text-button + .text-button {
          margin-left: 8px;
        }
      }

      &:not(:last-child) {
        margin-bottom: 2px;
      }

      &:first-child {
        margin-top: 17px;
      }
    }

    &--row.disable-edit {
      background: #fafafb;
      .form-control {
        border: 0px solid #d6d6d6;
        color: #919eab;
        &:focus {
          border: 0px solid #0066ff;
          padding: 12px 10px;
        }
      }

      .added-property--row--value {
        input {
          width: calc(100% - 56px - 14.6px);
          text-overflow: ellipsis;
          white-space: nowrap;
          overflow: hidden;
        }
      }
    }
  }

  .add-properties {
    width: 100%;
    height: 20px;
    font-weight: 400;
    line-height: 19.6px;

    .btn-icon-text {
      height: 20px;
      padding: 4px;
      .title {
        margin-bottom: 0;
        color: #0066ff;
      }

      i {
        color: #0066ff;
      }
    }
  }

  .add-new-property {
  }

  .title {
    @include regular-text-14();
    font-weight: 400;
    line-height: 19.6px;
    margin-bottom: 4px;
  }

  .title.required::after {
    content: ' *';
    color: #de3618;
  }

  .form-control {
    height: 40px;
    background: transparent;
    border: 1px solid #d6d6d6;
    padding: 12px 10px;
    &:focus {
      border: 2px solid #0066ff;
      padding: 12px 9px;
    }
  }

  .form-control.error {
    border: 2px solid #de3618;
  }

  .error-message {
    margin-top: 4px;
    @include regular-text12-unselect();
    color: #de3618;
    line-height: 16px;
    font-weight: 400;
  }
}
</style>
