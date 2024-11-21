<template>
  <div v-if="syncedPersistConfig" class="jdbc-persist-configuration mb-3">
    <div class="title">Host</div>
    <BFormInput autofocus autocomplete="off" class="mar-b-12 text-truncate" v-model="syncedPersistConfig.host" placeholder="Input host"></BFormInput>
    <div class="title">Port</div>
    <BFormInput autocomplete="off" class="mar-b-12 text-truncate" v-model="syncedPersistConfig.port" placeholder="Input port" type="number"></BFormInput>
    <div class="title">Username</div>
    <BFormInput autocomplete="off" class="mar-b-12 text-truncate" v-model="syncedPersistConfig.username" placeholder="Input username"></BFormInput>
    <div class="title">Password</div>
    <BFormInput
      autocomplete="off"
      class="mar-b-12 text-truncate"
      v-model="syncedPersistConfig.password"
      placeholder="Input password"
      type="password"
    ></BFormInput>
    <div class="title">Service name</div>
    <BFormInput autocomplete="off" class="text-truncate" v-model="syncedPersistConfig.serviceName" placeholder="Input service name"></BFormInput>
    <SSLForm :ssl-config="sslUIConfig" @change="handleSSLChange" @enable="handleEnable" />
    <div v-if="isShowSSlConfig" class="title">SSL server dn matching</div>
    <BFormInput
      v-if="isShowSSlConfig"
      autocomplete="off"
      class="mt-2 text-truncate"
      v-model="syncedPersistConfig.sslServerCertDn"
      placeholder="Input SSL server dn matching"
    ></BFormInput>
    <div v-for="(value, key) in extraFields" :key="key" class="d-flex flex-column mt-2">
      <div class="title d-flex flex-row justify-content-between">
        <div>{{ key }}</div>
        <i class="di-icon-delete btn-delete btn-icon-border" @click="onDeleteExtraField(key)"></i>
      </div>
      <div class="extra-input input">
        <BFormInput hide-track-value :placeholder="`Input value ${key}`" :value="extraFields[key]" @change="onExtraFieldChanged(key, ...arguments)">
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
import { Component, PropSync, Ref, Vue, Watch } from 'vue-property-decorator';
import { OracleJdbcPersistConfiguration } from '@core/data-cook/domain/etl/third-party-persist-configuration/OracleJdbcPersistConfiguration';
import SSLForm, { SSLUIConfig } from '@/screens/data-cook/components/save-to-database/SSLForm.vue';
import { JKSConfig, KeyStoreConfig, SSLConfig } from '@core/data-cook';
import { Log } from '@core/utils';
import { cloneDeep, toNumber } from 'lodash';
import { Di } from '@core/common/modules';
import { DataManager } from '@core/common/services';
import { StringUtils } from '@/utils';
import { OrganizationStoreModule } from '@/store/modules/OrganizationStore';
@Component({
  components: { SSLForm }
})
export default class OracleSourceInfo extends Vue {
  @PropSync('persistConfig')
  syncedPersistConfig!: OracleJdbcPersistConfiguration;

  private isShowSSlConfig = false;
  private errorNewKey = '';
  private newKey = '';
  private newValue = '';

  private extraFields: Record<string, string> = {};

  created() {
    this.isShowSSlConfig = !!this.syncedPersistConfig?.sslConfiguration;
    this.errorNewKey = '';
    this.newKey = '';
    this.newValue = '';
    this.extraFields = JSON.parse(this.syncedPersistConfig.extraPropertiesAsJson);
  }

  private get sslUIConfig(): SSLUIConfig {
    return SSLConfig.toSSLUIConfig(this.syncedPersistConfig.sslConfiguration);
  }

  handleSSLChange(sslConfig: SSLUIConfig) {
    Log.debug('sslConfig::', sslConfig);
    this.syncedPersistConfig.sslConfiguration = this.toSSLConfig(sslConfig);
  }

  handleEnable(enable: boolean) {
    Log.debug('enable::', enable);
    this.isShowSSlConfig = enable;
    if (!enable) {
      this.syncedPersistConfig.sslConfiguration = null;
    }
  }

  public toSSLConfig(sslUIConfig: SSLUIConfig): SSLConfig {
    const orgId = toNumber(OrganizationStoreModule.orgId) ?? -1;
    const keyStore = sslUIConfig.keyStore
      ? new KeyStoreConfig(orgId, sslUIConfig.keyStoreData, sslUIConfig.keyStorePass, sslUIConfig.keyStore?.name ?? '')
      : null;
    const trustStore = sslUIConfig.trustStore
      ? new KeyStoreConfig(orgId, sslUIConfig.trustStoreData, sslUIConfig.trustStorePass, sslUIConfig.trustStore?.name ?? '')
      : null;
    return new JKSConfig(keyStore, trustStore, sslUIConfig.protocol);
  }

  private onExtraFieldChanged(key: string, newValue: string) {
    Log.debug('onExtraFieldChanged::', key, newValue);
    this.extraFields[key] = newValue;
    this.syncedPersistConfig.extraPropertiesAsJson = JSON.stringify(this.extraFields);
  }

  private onDeleteExtraField(key: string) {
    delete this.extraFields[key];
    this.extraFields = cloneDeep(this.extraFields);
    this.syncedPersistConfig.extraPropertiesAsJson = JSON.stringify(this.extraFields);
  }

  private onAddNewField(key: string, value: string) {
    const isExistKey = this.extraFields[key] !== undefined;
    if (isExistKey) {
      this.errorNewKey = 'Key is exist!';
    } else if (StringUtils.isNotEmpty(key) && StringUtils.isNotEmpty(value)) {
      this.extraFields[key] = value;
      this.syncedPersistConfig.extraPropertiesAsJson = JSON.stringify(this.extraFields);
      this.errorNewKey = '';
      this.newKey = '';
      this.newValue = '';
    }
  }

  private resetError() {
    this.errorNewKey = '';
  }
}
</script>
