<template>
  <div>
    <div class="d-flex">
      <DiToggle id="sync-all-table" :value="!isSingleTable" @onSelected="isSingleTable = !isSingleTable"></DiToggle>
      <div class="ml-1">Sync all tables</div>
    </div>
    <template v-if="isSingleTable">
      <div class="mb-0 mt-3">Bucket name</div>
      <BFormInput :id="genInputId('bucket-name')" v-model="syncedS3Job.bucketName" autocomplete="off" autofocus placeholder="Input bucket name"></BFormInput>
      <div class="mb-0 mt-3">Folder path</div>
      <BFormInput :id="genInputId('folder-path')" v-model="syncedS3Job.folderPath" autocomplete="off" autofocus placeholder="Input folder path"></BFormInput>
      <div class="mb-0 mt-3">From table</div>
      <DropdownInput
        id="from-table-dropdown"
        ref="fromTableDropdownInput"
        class="mt-2"
        :value="syncedS3Job.tableName"
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
      <template v-if="$v.syncedS3Job.tableName.$error">
        <div class="error-message mt-1">Table name is required.</div>
      </template>
    </template>
  </div>
</template>

<script lang="ts">
import DynamicSuggestionInput from '@/screens/DataIngestion/components/DynamicSuggestionInput.vue';
import DropdownInput from '@/screens/DataIngestion/DropdownInput.vue';
import { DataSourceModule } from '@/screens/DataIngestion/store/DataSourceStore';
import { SelectOption } from '@/shared';
import SingleChoiceItem from '@/shared/components/filters/SingleChoiceItem.vue';
import { ShopifyJob } from '@core/DataIngestion/Domain/Job/ShopifyJob';
import { Component, PropSync, Ref, Vue } from 'vue-property-decorator';
import { required } from 'vuelidate/lib/validators';
import { S3Job } from '@core/DataIngestion';

@Component({
  components: {
    SingleChoiceItem,
    DynamicSuggestionInput,
    DropdownInput
  },
  validations: {
    syncedS3Job: {
      tableName: { required }
    }
  }
})
export default class MultiS3FromDatabaseSuggestion extends Vue {
  private readonly singleTableOption: SelectOption = {
    id: 'single',
    displayName: 'Single Table'
  };
  private readonly allTableOption: SelectOption = {
    id: 'all',
    displayName: 'All Tables'
  };
  @PropSync('s3Job')
  syncedS3Job!: S3Job;
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
    this.syncedS3Job.tableName = tableName;
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

  public async handleLoadS3FromData() {
    await DataSourceModule.loadTableNames({ id: this.syncedS3Job.sourceId!, dbName: '' });
    this.fromTableLoading = false;
  }
}
</script>
