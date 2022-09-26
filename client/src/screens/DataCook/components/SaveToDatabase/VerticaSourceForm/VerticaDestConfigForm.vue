<template>
  <DestDatabaseTableSelection
    :disabled="loading"
    ref="selectDatabaseAndTable"
    :databaseName="syncedConfiguration.databaseName"
    :tableName="syncedConfiguration.tableName"
    :third-party-persist-configuration.sync="syncedConfiguration"
  >
    <div class="form-group di-theme">
      <label class="d-inline-block mr-3 text-muted">Type</label>
      <label v-for="item in persistentTypes" :key="item" class="di-radio d-inline-block mr-4">
        <input :disabled="loading" v-model="syncedConfiguration.persistType" :value="item" type="radio" />
        <span></span>
        <span>{{ item }}</span>
      </label>
    </div>
  </DestDatabaseTableSelection>
</template>

<script lang="ts">
import { Component, Prop, PropSync, Ref, Vue } from 'vue-property-decorator';
import { MsSQLJdbcPersistConfiguration, PERSISTENT_TYPE } from '@core/DataCook';
import SelectDatabaseAndTable from '@/screens/DataCook/components/SelectDatabaseAndTable/SelectDatabaseAndTable.vue';
import DestDatabaseTableSelection from '@/screens/DataCook/components/SaveToDatabase/DestDatabaseTableSelection.vue';

@Component({
  components: {
    DestDatabaseTableSelection,
    SelectDatabaseAndTable
  }
})
export default class MsSQLDestConfigForm extends Vue {
  @Ref()
  private readonly selectDatabaseAndTable!: DestDatabaseTableSelection;

  @PropSync('configuration')
  syncedConfiguration!: MsSQLJdbcPersistConfiguration;

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
