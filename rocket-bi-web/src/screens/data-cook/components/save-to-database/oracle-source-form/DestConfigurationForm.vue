<template>
  <DestDatabaseTableSelection
    :disabled="loading"
    ref="selectDatabaseAndTable"
    :databaseName="syncedOracleJdbcPersistConfiguration.databaseName"
    :tableName="syncedOracleJdbcPersistConfiguration.tableName"
    :third-party-persist-configuration.sync="syncedOracleJdbcPersistConfiguration"
  >
    <div class="form-group di-theme">
      <label class="d-inline-block mr-3 text-muted">Type</label>
      <label v-for="item in persistentTypes" :key="item" class="di-radio d-inline-block mr-4">
        <input :disabled="loading" v-model="syncedOracleJdbcPersistConfiguration.persistType" :value="item" type="radio" />
        <span></span>
        <span>{{ item }}</span>
      </label>
    </div>
  </DestDatabaseTableSelection>
</template>

<script lang="ts">
import { Component, Prop, PropSync, Ref, Vue } from 'vue-property-decorator';
import { OracleJdbcPersistConfiguration } from '@core/data-cook/domain/etl/third-party-persist-configuration/OracleJdbcPersistConfiguration';
import { PERSISTENT_TYPE } from '@core/data-cook';
import SelectDatabaseAndTable from '@/screens/data-cook/components/select-database-and-table/SelectDatabaseAndTable.vue';
import DestDatabaseTableSelection from '@/screens/data-cook/components/save-to-database/DestDatabaseTableSelection.vue';
import { Log } from '@core/utils';

export interface DestConfiguration {
  getDatabaseNameAndTableName(): { database: string | null; table: string | null };
}

@Component({
  components: {
    DestDatabaseTableSelection,
    SelectDatabaseAndTable
  }
})
export default class DestConfigurationForm extends Vue implements DestConfiguration {
  @Ref()
  private readonly selectDatabaseAndTable!: DestDatabaseTableSelection;

  @PropSync('oracleJdbcPersistConfiguration')
  syncedOracleJdbcPersistConfiguration!: OracleJdbcPersistConfiguration;

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
