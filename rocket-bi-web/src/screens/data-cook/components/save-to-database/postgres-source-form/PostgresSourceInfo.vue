<template>
  <div v-if="syncedPostgresJdbcPersistConfiguration" class="jdbc-persist-configuration mb-3">
    <div class="title">Host</div>
    <BFormInput
      autofocus
      autocomplete="off"
      class="mar-b-12 text-truncate"
      v-model="syncedPostgresJdbcPersistConfiguration.host"
      placeholder="Input host"
    ></BFormInput>
    <div class="title">Port</div>
    <BFormInput
      autocomplete="off"
      class="mar-b-12 text-truncate"
      v-model="syncedPostgresJdbcPersistConfiguration.port"
      placeholder="Input port"
      type="number"
    ></BFormInput>
    <div class="title">Username</div>
    <BFormInput
      autocomplete="off"
      class="mar-b-12 text-truncate"
      v-model="syncedPostgresJdbcPersistConfiguration.username"
      placeholder="Input username"
    ></BFormInput>
    <div class="title">Password</div>
    <BFormInput
      autocomplete="off"
      class="mar-b-12 text-truncate"
      v-model="syncedPostgresJdbcPersistConfiguration.password"
      placeholder="Input password"
      type="password"
    ></BFormInput>
    <div class="title">Catalog name</div>
    <BFormInput
      autocomplete="off"
      class="text-truncate"
      v-model="syncedPostgresJdbcPersistConfiguration.catalogName"
      placeholder="Input catalog name"
    ></BFormInput>
  </div>
</template>
<script lang="ts">
import { Component, PropSync, Vue } from 'vue-property-decorator';
import { OracleJdbcPersistConfiguration } from '@core/data-cook/domain/etl/third-party-persist-configuration/OracleJdbcPersistConfiguration';
import { MySQLJdbcPersistConfiguration } from '@core/data-cook/domain/etl/third-party-persist-configuration/MySQLJdbcPersistConfiguration';
import { PostgresJdbcPersistConfiguration } from '@core/data-cook/domain/etl/third-party-persist-configuration/PostgresJdbcPersistConfiguration';

@Component
export default class MySQLSourceInfo extends Vue {
  @PropSync('postgresJdbcPersistConfiguration')
  syncedPostgresJdbcPersistConfiguration!: PostgresJdbcPersistConfiguration;
}
</script>
