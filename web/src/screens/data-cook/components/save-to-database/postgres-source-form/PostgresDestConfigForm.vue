<template>
  <DestDatabaseTableSelection
    :disabled="loading"
    ref="selectDatabaseAndTable"
    :databaseName="syncedPostgresJdbcPersistConfiguration.databaseName"
    :tableName="syncedPostgresJdbcPersistConfiguration.tableName"
    :third-party-persist-configuration.sync="syncedPostgresJdbcPersistConfiguration"
  >
    <div class="form-group di-theme">
      <label class="d-inline-block mr-3 text-muted">Type</label>
      <label v-for="item in persistentTypes" :key="item" class="di-radio d-inline-block mr-4">
        <input :disabled="loading" v-model="syncedPostgresJdbcPersistConfiguration.persistType" :value="item" type="radio" />
        <span></span>
        <span>{{ item }}</span>
      </label>
    </div>
  </DestDatabaseTableSelection>
</template>

<script lang="ts">
import { Component, Prop, PropSync, Ref, Vue } from 'vue-property-decorator';
import { PERSISTENT_TYPE } from '@core/data-cook';
import SelectDatabaseAndTable from '@/screens/data-cook/components/select-database-and-table/SelectDatabaseAndTable.vue';
import DestDatabaseTableSelection from '@/screens/data-cook/components/save-to-database/DestDatabaseTableSelection.vue';
import { MySQLJdbcPersistConfiguration } from '@core/data-cook/domain/etl/third-party-persist-configuration/MySQLJdbcPersistConfiguration';
import { DestConfiguration } from '@/screens/data-cook/components/save-to-database/oracle-source-form/DestConfigurationForm.vue';
import { PostgresJdbcPersistConfiguration } from '@core/data-cook/domain/etl/third-party-persist-configuration/PostgresJdbcPersistConfiguration';

@Component({
  components: {
    DestDatabaseTableSelection,
    SelectDatabaseAndTable
  }
})
export default class PostgresDestConfigForm extends Vue implements DestConfiguration {
  @Ref()
  private readonly selectDatabaseAndTable!: DestDatabaseTableSelection;

  @PropSync('postgresJdbcPersistConfiguration')
  syncedPostgresJdbcPersistConfiguration!: PostgresJdbcPersistConfiguration;

  @Prop()
  loading!: boolean;

  private get persistentTypes() {
    return [PERSISTENT_TYPE.Update, PERSISTENT_TYPE.Append];
  }

  getDatabaseNameAndTableName(): { database: string | null; table: string | null } {
    return this.selectDatabaseAndTable!.getDatabaseAndTable();
  }
}
</script>
