<template>
  <div>
    <div class="job-section">
      <label>Select Account</label>
      <div class="input">
        <DiDropdown
          v-model="syncedJob.customerId"
          labelProps="name"
          valueProps="id"
          :data="accountIds"
          :class="{ 'is-invalid': accountIdError }"
          placeholder="Select Account..."
          boundary="viewport"
          :disabled="accountLoading"
          @select="resetAccountIdError"
          @change="selectCustomerId"
        >
          <template #icon-dropdown>
            <div v-if="accountLoading" class="loading">
              <i class="fa fa-spinner fa-spin"></i>
            </div>
          </template>
        </DiDropdown>
      </div>
      <input
        v-if="isInputApplicationId"
        ref="inputCustomerId"
        v-model.trim="syncedJob.customerId"
        :class="{ 'is-invalid': accountIdError }"
        class="form-control mt-2 new-db-input text-truncate"
        placeholder="Type your Application id here"
        type="text"
        @input="resetAccountIdError"
        :disabled="accountLoading"
      />
      <div class="text-danger mt-1">{{ accountIdError }}</div>
    </div>
    <div class="job-section">
      <div class="d-flex" v-if="isCreateNew">
        <DiToggle id="sync-all-table" :value="!isSingleTable" @onSelected="isSingleTable = !isSingleTable"></DiToggle>
        <div class="ml-1">Sync all Table</div>
      </div>
      <template v-if="isSingleTable">
        <label class="mt-2">From Table</label>
        <div class="input">
          <DiDropdown
            v-model="syncedJob.tableName"
            labelProps="displayName"
            valueProps="id"
            :class="{ 'is-invalid': tableNameError }"
            :data="tableAsSelectOptions"
            placeholder="Select Table..."
            hide-placeholder-on-menu
            boundary="viewport"
            @select="tableNameError = ''"
          >
            <template #icon-dropdown>
              <div v-if="tableLoading" class="loading">
                <i class="fa fa-spinner fa-spin"></i>
              </div>
            </template>
          </DiDropdown>
        </div>
        <div class="text-danger mt-1">{{ tableNameError }}</div>
      </template>
    </div>
  </div>
</template>

<script lang="ts">
import { Component, PropSync, Vue } from 'vue-property-decorator';
import { FacebookAdsJob, FormMode, Job } from '@core/data-ingestion';
import { Inject } from 'typescript-ioc';
import { DataSourceService } from '@core/common/services/DataSourceService';
import { Log } from '@core/utils';
import { DataSourceModule } from '@/screens/data-ingestion/store/DataSourceStore';
import { SelectOption } from '@/shared';
import DiToggle from '@/shared/components/common/DiToggle.vue';
import { ListUtils, StringUtils } from '@/utils';
import { DIException, SourceId } from '@core/common/domain';

@Component({ components: { DiToggle } })
export default class FacebookAdsSourceConfig extends Vue {
  private accountLoading = false;
  private accountIds: { id: string; name: string }[] = [];
  private accountIdError = '';
  private tableLoading = false;
  private tables: string[] = [];
  private tableNameError = '';
  private isInputApplicationId = false;
  @Inject
  private readonly sourcesService!: DataSourceService;
  @PropSync('job')
  syncedJob!: FacebookAdsJob;

  @PropSync('singleTable')
  isSingleTable!: boolean;

  mounted() {
    this.accountIds = [];
  }

  beforeDestroy() {
    this.accountIds = [];
    DataSourceModule.setTableNames([]);
  }

  async init(id: SourceId): Promise<void> {
    try {
      await this.loadApplicationIds(id);
      if (ListUtils.hasOnlyOneItem(this.accountIds)) {
        this.syncedJob.accountId = this.accountIds[0].id;
      }
      await this.initTable(this.syncedJob.sourceId, this.syncedJob.accountId);
      if (ListUtils.hasOnlyOneItem(this.tables)) {
        this.syncedJob.tableName = this.tables![0];
      }
    } catch (ex) {
      Log.error(ex);
      this.accountIds = [];
    } finally {
      this.accountLoading = false;
    }
  }

  private get tableAsSelectOptions(): SelectOption[] {
    return this.tables.map(table => {
      return {
        id: table,
        displayName: table
      } as SelectOption;
    });
  }

  private async loadApplicationIds(id: SourceId) {
    this.accountLoading = true;
    this.accountIds = (await this.sourcesService.listDatabaseName(id, '', '')).map(dbJsonAsString => JSON.parse(dbJsonAsString));
    this.accountLoading = false;
  }

  private async initTable(sourceId: SourceId, applicationId: string) {
    this.tableLoading = true;
    this.tables = await this.sourcesService.listTableName(sourceId, applicationId, '', '');
    this.tableLoading = false;
    DataSourceModule.setTableNames(this.tables);
  }

  isValidSource() {
    if (StringUtils.isEmpty(this.syncedJob.accountId)) {
      this.accountIdError = 'Application is required!';
      throw new DIException('');
    }
    if (this.isSingleTable && StringUtils.isEmpty(this.syncedJob.tableName)) {
      this.tableNameError = 'Table is required!';
      throw new DIException('');
    }
    return true;
  }

  private selectInputCustomerId(callback: Function) {
    this.isInputApplicationId = true;
    this.syncedJob.accountId = '';
    this.accountIdError = '';
    callback();
  }

  private async selectCustomerId(id: string) {
    try {
      this.isInputApplicationId = false;
      this.syncedJob.accountId = id;
      this.accountIdError = '';
      await this.initTable(this.syncedJob.sourceId, this.syncedJob.accountId);
      if (ListUtils.hasOnlyOneItem(this.tables)) {
        this.syncedJob.tableName = this.tables![0];
      }
    } catch (ex) {
      Log.error(ex);
      this.accountIds = [];
    } finally {
      this.accountLoading = false;
    }
  }

  private resetAccountIdError() {
    this.accountIdError = '';
  }

  private get isCreateNew() {
    return Job.getJobFormConfigMode(this.syncedJob) === FormMode.Create;
  }
}
</script>

<style lang="scss" scoped>
.color-di-primary {
  color: #597fff !important;
}
</style>
