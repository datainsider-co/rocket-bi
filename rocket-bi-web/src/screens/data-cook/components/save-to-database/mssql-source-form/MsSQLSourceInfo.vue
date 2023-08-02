<template>
  <div v-if="syncedMsJdbcPersistConfiguration" class="jdbc-persist-configuration mb-3">
    <div class="title">Host</div>
    <BFormInput
      autofocus
      autocomplete="off"
      class="mar-b-12 text-truncate"
      v-model="syncedMsJdbcPersistConfiguration.host"
      placeholder="Input host"
    ></BFormInput>
    <div class="title">Port</div>
    <BFormInput
      autocomplete="off"
      class="mar-b-12 text-truncate"
      v-model="syncedMsJdbcPersistConfiguration.port"
      placeholder="Input port"
      type="number"
    ></BFormInput>
    <div class="title">Username</div>
    <BFormInput autocomplete="off" class="mar-b-12 text-truncate" v-model="syncedMsJdbcPersistConfiguration.username" placeholder="Input username"></BFormInput>
    <div class="title">Password</div>
    <BFormInput
      autocomplete="off"
      class="mar-b-12 text-truncate"
      v-model="syncedMsJdbcPersistConfiguration.password"
      placeholder="Input password"
      type="password"
    ></BFormInput>
    <div class="title">Catalog name</div>
    <BFormInput autocomplete="off" class="text-truncate" v-model="syncedMsJdbcPersistConfiguration.catalogName" placeholder="Input catalog name"></BFormInput>
  </div>
</template>
<script lang="ts">
import { Component, PropSync, Vue } from 'vue-property-decorator';
import { OracleJdbcPersistConfiguration } from '@core/data-cook/domain/etl/third-party-persist-configuration/OracleJdbcPersistConfiguration';
import { MsSQLJdbcPersistConfiguration } from '@core/data-cook';

@Component
export default class MsSQLSourceInfo extends Vue {
  @PropSync('msSqlJdbcPersistConfiguration')
  syncedMsJdbcPersistConfiguration!: MsSQLJdbcPersistConfiguration;
}
</script>
