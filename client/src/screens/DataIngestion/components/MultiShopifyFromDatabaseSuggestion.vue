<template>
  <div>
    <div class="d-flex">
      <DiToggle id="sync-all-table" :value="!isSingleTable" @onSelected="isSingleTable = !isSingleTable"></DiToggle>
      <div class="ml-1">Sync all tables</div>
    </div>
    <template v-if="isSingleTable">
      <div class="mb-0 mt-3">From table</div>
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
    </template>
  </div>
</template>

<script lang="ts">
import { SelectOption } from '@/shared';
import SingleChoiceItem from '@/shared/components/filters/SingleChoiceItem.vue';
import { Component, PropSync, Ref, Vue } from 'vue-property-decorator';
import DynamicSuggestionInput from '@/screens/DataIngestion/components/DynamicSuggestionInput.vue';
import { DataSourceModule } from '@/screens/DataIngestion/store/DataSourceStore';
import { Log } from '@core/utils';
import { PopupUtils } from '@/utils/popup.utils';
import { required } from 'vuelidate/lib/validators';
import DropdownInput from '@/screens/DataIngestion/DropdownInput.vue';
import { JdbcJob } from '@core/DataIngestion';
import { ShopifyJob } from '@core/DataIngestion/Domain/Job/ShopifyJob';

@Component({
  components: {
    SingleChoiceItem,
    DynamicSuggestionInput,
    DropdownInput
  },
  validations: {
    syncedShopifyJob: {
      tableName: { required }
    }
  }
})
export default class MultiShopifyFromDatabaseSuggestion extends Vue {
  private readonly singleTableOption: SelectOption = {
    id: 'single',
    displayName: 'Single Table'
  };
  private readonly allTableOption: SelectOption = {
    id: 'all',
    displayName: 'All Tables'
  };
  @PropSync('shopifyJob')
  syncedShopifyJob!: ShopifyJob;
  @PropSync('singleTable')
  isSingleTable!: boolean;

  @PropSync('tableLoading')
  private fromTableLoading!: boolean;

  @Ref()
  private readonly fromTableDropdownInput!: DropdownInput;

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
    if (this.isSingleTable) {
      this.$v.$touch();
      if (this.$v.$invalid) {
        return false;
      }
    }
    return true;
  }

  public async handleLoadShopifyFromData() {
    await DataSourceModule.loadTableNames({ id: this.syncedShopifyJob.sourceId!, dbName: '' });
    this.fromTableLoading = false;
  }
}
</script>
