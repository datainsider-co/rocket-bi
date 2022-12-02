<template>
  <div v-if="syncedMySQLJdbcPersistConfiguration" class="jdbc-persist-configuration mb-3">
    <div class="title">Host</div>
    <BFormInput
      autofocus
      autocomplete="off"
      class="mar-b-12 text-truncate"
      v-model="syncedMySQLJdbcPersistConfiguration.host"
      placeholder="Input host"
    ></BFormInput>
    <div class="title">Port</div>
    <BFormInput
      autocomplete="off"
      class="mar-b-12 text-truncate"
      v-model="syncedMySQLJdbcPersistConfiguration.port"
      placeholder="Input port"
      type="number"
    ></BFormInput>
    <div class="title">Username</div>
    <BFormInput
      autocomplete="off"
      class="mar-b-12 text-truncate"
      v-model="syncedMySQLJdbcPersistConfiguration.username"
      placeholder="Input username"
    ></BFormInput>
    <div class="title">Password</div>
    <BFormInput
      autocomplete="off"
      class="text-truncate"
      v-model="syncedMySQLJdbcPersistConfiguration.password"
      placeholder="Input password"
      type="password"
    ></BFormInput>
    <div v-for="(value, key) in extraFields" :key="key" class="d-flex flex-column mt-2">
      <div class="title d-flex flex-row justify-content-between">
        <div>{{ key }}</div>
        <i class="di-icon-delete btn-delete btn-icon-border" @click="onDeleteExtraField(key)"></i>
      </div>
      <div class="extra-input input">
        <BFormInput hide-track-value :placeholder="`Input value ${key}`" :value="extraFields[key]" @onChange="onExtraFieldChanged(key, ...arguments)">
        </BFormInput>
      </div>
    </div>
    <div class="d-flex flex-column mt-2">
      <div class="d-flex row mb-1 mx-0">
        <div>Add Properties</div>
        <i class="di-icon-add btn-add btn-icon-border ml-auto" @click="onAddNewField(newKey, newValue)"></i>
      </div>
      <div class="d-flex w-100 justify-content-center align-items-center">
        <div class="title new-extra-input input mb-0 mr-1" style="flex: 1">
          <BFormInput hide-track-value placeholder="Input key" v-model="newKey" @change="resetError"></BFormInput>
        </div>
        <div class="extra-input input flex-2" style="flex: 2">
          <BFormInput hide-track-value placeholder="Input value" v-model="newValue"></BFormInput>
        </div>
      </div>
    </div>
    <div class="text-danger mt-1">{{ errorNewKey }}</div>
  </div>
</template>
<script lang="ts">
import { Component, PropSync, Vue, Watch } from 'vue-property-decorator';
import { MySQLJdbcPersistConfiguration } from '@core/data-cook/domain/etl/third-party-persist-configuration/MySQLJdbcPersistConfiguration';
import { cloneDeep } from 'lodash';
import { Log } from '@core/utils';
import { StringUtils } from '@/utils';

@Component
export default class MySQLSourceInfo extends Vue {
  @PropSync('mySqlJdbcPersistConfiguration')
  syncedMySQLJdbcPersistConfiguration!: MySQLJdbcPersistConfiguration;
  private errorNewKey = '';
  private newKey = '';
  private newValue = '';

  private extraFields: Record<string, string> = {};

  mounted() {
    this.errorNewKey = '';
    this.newKey = '';
    this.newValue = '';
    this.extraFields = JSON.parse(this.syncedMySQLJdbcPersistConfiguration.extraPropertiesAsJson);
  }

  private onExtraFieldChanged(key: string, newValue: string) {
    this.extraFields[key] = newValue;
    this.syncedMySQLJdbcPersistConfiguration.extraPropertiesAsJson = JSON.stringify(this.extraFields);
  }

  private onDeleteExtraField(key: string) {
    delete this.extraFields[key];
    this.extraFields = cloneDeep(this.extraFields);
    this.syncedMySQLJdbcPersistConfiguration.extraPropertiesAsJson = JSON.stringify(this.extraFields);
  }

  private onAddNewField(key: string, value: string) {
    const isExistKey = this.extraFields[key] !== undefined;
    if (isExistKey) {
      this.errorNewKey = 'Key is exist!';
    } else if (StringUtils.isNotEmpty(key) && StringUtils.isNotEmpty(value)) {
      this.extraFields[key] = value;
      this.syncedMySQLJdbcPersistConfiguration.extraPropertiesAsJson = JSON.stringify(this.extraFields);
      this.errorNewKey = '';
      this.newKey = '';
      this.newValue = '';
    }
  }

  private resetError() {
    this.errorNewKey = '';
  }

  // @Watch('extraFields', { deep: true })
  // private onExtraFieldsChanged() {
  //   Log.debug('onExtraFieldsChanged::extraFields::', this.extraFields, JSON.stringify(this.extraFields));
  //   this.syncedMySQLJdbcPersistConfiguration.extraPropertiesAsJson = JSON.stringify(this.extraFields);
  //   Log.debug('onExtraFieldsChanged::extraFields::', this.syncedMySQLJdbcPersistConfiguration);
  // }
}
</script>
