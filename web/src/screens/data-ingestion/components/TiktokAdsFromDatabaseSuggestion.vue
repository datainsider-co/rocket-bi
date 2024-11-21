<template>
  <div>
    <label class="mb-2">Advertiser ID</label>
    <div class="dropdown-loading">
      <DropdownInput
        id="from-database-dropdown"
        ref="fromDatabaseDropdownInput"
        :loading="fromDatabaseLoading"
        :value="syncedTiktokAdsJob.advertiserId"
        :data="fromDatabaseNames"
        dropdown-placeholder="Select advertiser id please..."
        extra-option-label="Or type your advertiser id"
        input-placeholder="Please type your advertiser id here"
        label-props="label"
        value-props="type"
        @change="handleDatabaseChange"
        :appendAtRoot="true"
      ></DropdownInput>
      <template v-if="$v.syncedTiktokAdsJob.advertiserId.$error">
        <div class="error-message mt-1">Advertise id is required.</div>
      </template>
    </div>
    <label class="mb-0 mt-3">Tiktok End Point</label>
    <div class="dropdown-loading">
      <DropdownInput
        id="from-table-dropdown"
        ref="fromTableDropdownInput"
        class="mt-2"
        :value="syncedTiktokAdsJob.tikTokEndPoint"
        :data="fromTableNames"
        :loading="fromTableLoading"
        dropdown-placeholder="Select Tiktok end point please..."
        extra-option-label="Or type your Tiktok end point"
        input-placeholder="Please type your Tiktok end point here"
        label-props="label"
        value-props="type"
        :appendAtRoot="true"
        @change="handleTableChange"
      ></DropdownInput>
      <template v-if="$v.syncedTiktokAdsJob.tikTokEndPoint.$error">
        <div class="error-message mt-1">Tiktok end point is required.</div>
      </template>
    </div>
  </div>
</template>

<script lang="ts">
import { Component, Prop, PropSync, Ref, Vue, Watch } from 'vue-property-decorator';
import DynamicSuggestionInput from '@/screens/data-ingestion/components/DynamicSuggestionInput.vue';
import { BigQueryJob } from '@core/data-ingestion/domain/job/BigQueryJob';
import { DataSourceModule } from '@/screens/data-ingestion/store/DataSourceStore';
import { Log } from '@core/utils';
import { PopupUtils } from '@/utils/PopupUtils';
import { required } from 'vuelidate/lib/validators';
import DropdownInput from '@/screens/data-ingestion/DropdownInput.vue';
import { DataSourceInfo, JdbcJob, Job, TiktokAdsJob } from '@core/data-ingestion';
import { StringUtils } from '@/utils/StringUtils';

@Component({
  components: {
    DynamicSuggestionInput,
    DropdownInput
  },
  validations: {
    syncedTiktokAdsJob: {
      advertiserId: { required },
      tikTokEndPoint: { required }
    }
  }
})
export default class TiktokAdsFromDatabaseSuggestion extends Vue {
  @PropSync('tiktokAdsJob')
  syncedTiktokAdsJob!: TiktokAdsJob;

  @PropSync('databaseLoading')
  private fromDatabaseLoading!: boolean;
  @PropSync('tableLoading')
  private fromTableLoading!: boolean;

  @Ref()
  private readonly fromTableDropdownInput!: DropdownInput;

  @Ref()
  private readonly fromDatabaseDropdownInput!: DropdownInput;

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

  private async handleDatabaseChange(dbName: string) {
    try {
      if (this.syncedTiktokAdsJob.advertiserId !== dbName) {
        this.fromTableLoading = true;
        this.syncedTiktokAdsJob.advertiserId = dbName;
        await DataSourceModule.loadTableNames({
          dbName: dbName,
          id: this.syncedTiktokAdsJob.sourceId
        });
        this.syncedTiktokAdsJob.tikTokEndPoint = '';
        this.fromTableDropdownInput.reset();
        this.$emit('selectDatabase', dbName);
      }
    } catch (e) {
      // eslint-disable-next-line no-undef
      PopupUtils.showError(e.message);
      Log.error('JobCreationModal::handleSelectDatabase::error::', e.message);
    } finally {
      this.fromTableLoading = false;
    }
  }

  private handleTableChange(tableName: string) {
    this.syncedTiktokAdsJob.tikTokEndPoint = tableName;
    this.$emit('selectTable', tableName);
  }

  public isValidDatabaseSuggestion() {
    this.$v.$touch();
    if (this.$v.$invalid) {
      return false;
    }
    return true;
  }

  public async handleLoadTiktokAdsFromData() {
    await DataSourceModule.loadDatabaseNames({
      id: this.syncedTiktokAdsJob.sourceId!
    });
    this.fromDatabaseLoading = false;
    await DataSourceModule.loadTableNames({
      id: this.syncedTiktokAdsJob.sourceId,
      dbName: this.syncedTiktokAdsJob.advertiserId
    });
    this.fromTableLoading = false;
  }

  @Watch('syncedTiktokAdsJob.advertiserId')
  resetDatabaseName(dbName: string) {
    if (StringUtils.isEmpty(dbName)) {
      this.fromDatabaseDropdownInput.reset();
    }
  }

  @Watch('syncedTiktokAdsJob.tikTokEndPoint')
  resetTableName(tblName: string) {
    if (StringUtils.isEmpty(tblName)) {
      this.fromTableDropdownInput.reset();
    }
  }
}
</script>
