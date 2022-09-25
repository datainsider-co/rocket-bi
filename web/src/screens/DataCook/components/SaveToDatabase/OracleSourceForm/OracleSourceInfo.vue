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
  </div>
</template>
<script lang="ts">
import { Component, PropSync, Ref, Vue, Watch } from 'vue-property-decorator';
import { OracleJdbcPersistConfiguration } from '@core/DataCook/Domain/ETL/ThirdPartyPersistConfiguration/OracleJdbcPersistConfiguration';
import SSLForm, { SSLUIConfig } from '@/screens/DataCook/components/SaveToDatabase/SSLForm.vue';
import { JKSConfig, KeyStoreConfig, SSLConfig } from '@core/DataCook';
import { Log } from '@core/utils';
import { toNumber } from 'lodash';
import { DI } from '@core/modules';
import { DataManager } from '@core/services';
@Component({
  components: { SSLForm }
})
export default class OracleSourceInfo extends Vue {
  @PropSync('persistConfig')
  syncedPersistConfig!: OracleJdbcPersistConfiguration;

  private isShowSSlConfig = false;

  created() {
    this.isShowSSlConfig = !!this.syncedPersistConfig?.sslConfiguration;
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
    const orgId = toNumber(DI.get(DataManager).getUserInfo()?.organization.organizationId) ?? -1;
    const keyStore = sslUIConfig.keyStore
      ? new KeyStoreConfig(orgId, sslUIConfig.keyStoreData, sslUIConfig.keyStorePass, sslUIConfig.keyStore?.name ?? '')
      : null;
    const trustStore = sslUIConfig.trustStore
      ? new KeyStoreConfig(orgId, sslUIConfig.trustStoreData, sslUIConfig.trustStorePass, sslUIConfig.trustStore?.name ?? '')
      : null;
    return new JKSConfig(keyStore, trustStore, sslUIConfig.protocol);
  }
}
</script>
