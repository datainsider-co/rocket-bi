<template>
  <DestDatabaseTableSelection
    :disabled="loading"
    ref="selectDatabaseAndTable"
    :databaseName="syncedMySQLJdbcPersistConfiguration.databaseName"
    :tableName="syncedMySQLJdbcPersistConfiguration.tableName"
    :third-party-persist-configuration.sync="syncedMySQLJdbcPersistConfiguration"
  >
    <div class="form-group di-theme">
      <label class="d-inline-block mr-3 text-muted">Type</label>
      <label v-for="item in persistentTypes" :key="item" class="di-radio d-inline-block mr-4">
        <input :disabled="loading" v-model="syncedMySQLJdbcPersistConfiguration.persistType" :value="item" type="radio" />
        <span></span>
        <span>{{ item }}</span>
      </label>
    </div>
  </DestDatabaseTableSelection>
</template>

<script lang="ts">
import { Component, Prop, PropSync, Ref, Vue } from 'vue-property-decorator';
import { PERSISTENT_TYPE } from '@core/DataCook';
import SelectDatabaseAndTable from '@/screens/DataCook/components/SelectDatabaseAndTable/SelectDatabaseAndTable.vue';
import DestDatabaseTableSelection from '@/screens/DataCook/components/SaveToDatabase/DestDatabaseTableSelection.vue';
import { MySQLJdbcPersistConfiguration } from '@core/DataCook/Domain/ETL/ThirdPartyPersistConfiguration/MySQLJdbcPersistConfiguration';
import { DestConfiguration } from '@/screens/DataCook/components/SaveToDatabase/OracleSourceForm/DestConfigurationForm.vue';

@Component({
  components: {
    DestDatabaseTableSelection,
    SelectDatabaseAndTable
  }
})
export default class MySQLDestConfigForm extends Vue implements DestConfiguration {
  @Ref()
  private readonly selectDatabaseAndTable!: DestDatabaseTableSelection;

  @PropSync('mySqlJdbcPersistConfiguration')
  syncedMySQLJdbcPersistConfiguration!: MySQLJdbcPersistConfiguration;

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
