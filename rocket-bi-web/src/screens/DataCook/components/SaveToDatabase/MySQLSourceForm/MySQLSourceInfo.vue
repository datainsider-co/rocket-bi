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
  </div>
</template>
<script lang="ts">
import { Component, PropSync, Vue } from 'vue-property-decorator';
import { OracleJdbcPersistConfiguration } from '@core/DataCook/Domain/ETL/ThirdPartyPersistConfiguration/OracleJdbcPersistConfiguration';
import { MySQLJdbcPersistConfiguration } from '@core/DataCook/Domain/ETL/ThirdPartyPersistConfiguration/MySQLJdbcPersistConfiguration';

@Component
export default class MySQLSourceInfo extends Vue {
  @PropSync('mySqlJdbcPersistConfiguration')
  syncedMySQLJdbcPersistConfiguration!: MySQLJdbcPersistConfiguration;
}
</script>
