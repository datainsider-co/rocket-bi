<template>
  <div>
    <label class="mb-0">From table</label>
    <DropdownInput
      id="from-table-dropdown"
      ref="fromTableDropdownInput"
      class="mt-2"
      :value="syncedShopifyJob.tableName"
      :data="fromTableNames"
      :loading="fromTableLoading"
      dropdown-placeholder="Select table please..."
      extra-option-label="Or type your table name"
      input-placeholder="Please type your table name here "
      label-props="label"
      value-props="type"
      :appendAtRoot="true"
      @change="handleTableChange"
    ></DropdownInput>
    <template v-if="$v.syncedShopifyJob.tableName.$error">
      <div class="error-message mt-1">Table name is required.</div>
    </template>
  </div>
</template>

<script lang="ts">
import { Component, PropSync, Ref, Vue } from 'vue-property-decorator';
import DynamicSuggestionInput from '@/screens/data-ingestion/components/DynamicSuggestionInput.vue';
import { DataSourceModule } from '@/screens/data-ingestion/store/DataSourceStore';
import { Log } from '@core/utils';
import { PopupUtils } from '@/utils/PopupUtils';
import { required } from 'vuelidate/lib/validators';
import DropdownInput from '@/screens/data-ingestion/DropdownInput.vue';
import { JdbcJob } from '@core/data-ingestion';
import { ShopifyJob } from '@core/data-ingestion/domain/job/ShopifyJob';

@Component({
  components: {
    DynamicSuggestionInput,
    DropdownInput
  },
  validations: {
    syncedShopifyJob: {
      tableName: { required }
    }
  }
})
export default class ShopifyFromDatabaseSuggestion extends Vue {
  @PropSync('shopifyJob')
  syncedShopifyJob!: ShopifyJob;

  @PropSync('tableLoading')
  private fromTableLoading!: boolean;

  @Ref()
  private readonly fromTableDropdownInput!: DropdownInput;

  private get fromDatabaseNames(): any[] {
    const databaseNames = [...DataSourceModule.databaseNames];

    const fromDatabaseNames: any[] = databaseNames.map(dbName => {
      return {
        label: dbName,
        type: dbName
      };
    });
    return fromDatabaseNames;
  }

  private get fromTableNames(): any[] {
    const tableNames = [...DataSourceModule.tableNames];

    const fromTableNames: any[] = tableNames.map(dbName => {
      return {
        label: dbName,
        type: dbName
      };
    });
    return fromTableNames;
  }

  private handleTableChange(tableName: string) {
    this.syncedShopifyJob.tableName = tableName;
    this.$emit('selectTable', tableName);
  }

  isValidDatabaseSuggestion() {
    this.$v.$touch();
    if (this.$v.$invalid) {
      return false;
    }
    return true;
  }

  public async handleLoadShopifyFromData() {
    Log.debug('load shopify from data');
    await DataSourceModule.loadTableNames({ id: this.syncedShopifyJob.sourceId!, dbName: '' });
    this.fromTableLoading = false;
  }
}
</script>
