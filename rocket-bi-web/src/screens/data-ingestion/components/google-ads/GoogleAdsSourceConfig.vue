<template>
  <div>
    <div class="job-section">
      <label>Customer Id</label>
      <div class="input">
        <DiDropdown
          v-model="syncedJob.customerId"
          labelProps="displayName"
          valueProps="id"
          :data="customerIdsAsSelectOption"
          :class="{ 'is-invalid': customerIdError }"
          placeholder="Select Customer ID..."
          boundary="viewport"
          :disabled="loading"
          @select="resetCustomerIdError"
          @change="selectCustomerId"
        >
          <template slot="before-menu" slot-scope="{ hideDropdown }">
            <li class="active color-di-primary font-weight-normal" @click.prevent="selectInputCustomerId(hideDropdown)">
              Type your Customer Id
            </li>
          </template>
          <template #icon-dropdown>
            <div v-if="loading" class="loading">
              <i class="fa fa-spinner fa-spin"></i>
            </div>
          </template>
        </DiDropdown>
      </div>
      <input
        v-if="isInputCustomerId"
        ref="inputCustomerId"
        v-model.trim="syncedJob.customerId"
        :class="{ 'is-invalid': customerIdError }"
        class="form-control mt-2 new-db-input text-truncate"
        placeholder="Type your customer id here"
        type="text"
        @input="resetCustomerIdError"
        :disabled="loading"
      />
      <div class="text-danger mt-1">{{ customerIdError }}</div>
    </div>
    <div class="job-section">
      <div class="d-flex" v-if="isCreateNew">
        <DiToggle id="sync-all-table" :value="!isSingleTable" @onSelected="isSingleTable = !isSingleTable" label="Sync all resources"></DiToggle>
      </div>
      <template v-if="isSingleTable">
        <label class="mt-2">Resource Name</label>
        <div class="input">
          <DiDropdown
            v-model="syncedJob.resourceName"
            labelProps="displayName"
            valueProps="id"
            append-at-root
            :data="allResources"
            placeholder="Select Resource..."
            boundary="window"
            @select="resourceNameError = ''"
          />
        </div>
        <div class="text-danger mt-1">{{ resourceNameError }}</div>
      </template>
    </div>
  </div>
</template>

<script lang="ts">
import { Component, Vue, Prop, PropSync, Watch } from 'vue-property-decorator';
import { FormMode, GoogleAdsJob, GoogleAdsSourceInfo, Job } from '@core/data-ingestion';
import DiDropdown from '@/shared/components/common/di-dropdown/DiDropdown';
import { Inject } from 'typescript-ioc';
import { DataSourceService } from '@core/common/services/DataSourceService';
import { Log } from '@core/utils';
import { DataSourceModule } from '@/screens/data-ingestion/store/DataSourceStore';
import { SelectOption } from '@/shared';
import DiToggle from '@/shared/components/common/DiToggle.vue';
import { ListUtils, StringUtils } from '@/utils';
import { DIException, SourceId } from '@core/common/domain';

@Component({ components: { DiToggle } })
export default class GoogleAdsSourceConfig extends Vue {
  private loading = false;
  private customerIds: string[] = [];
  private customerIdError = '';
  private isInputCustomerId = false;
  private loadingResource = false;
  private resources: string[] = [];
  private resourceNameError = '';
  @Inject
  private readonly sourcesService!: DataSourceService;
  @PropSync('job')
  syncedJob!: GoogleAdsJob;

  @PropSync('singleTable')
  isSingleTable!: boolean;

  mounted() {
    this.customerIds = [];
  }

  beforeDestroy() {
    this.customerIds = [];
    DataSourceModule.setTableNames([]);
  }

  private get isUsingExtraSegment(): boolean {
    return ListUtils.isNotEmpty(this.syncedJob.extraSegments);
  }
  async init(id: SourceId): Promise<void> {
    try {
      await this.initCustomerIds(id);
      await this.initResourceNames(id, this.syncedJob.customerId);
    } catch (ex) {
      Log.error(ex);
      this.customerIds = [];
    } finally {
      this.loading = false;
    }
  }

  private get allResources(): SelectOption[] {
    return this.resources
      .map(resource => {
        return {
          id: resource,
          displayName: resource
        } as SelectOption;
      })
      .sort((a, b) => StringUtils.compare(a.displayName, b.displayName));
  }

  private get customerIdsAsSelectOption(): SelectOption[] {
    return this.customerIds.map(id => {
      return {
        id: id,
        displayName: id
      } as SelectOption;
    });
  }

  @Watch('syncedJob.customerId')
  onCustomerIdChanged() {
    try {
      this.initResourceNames(this.syncedJob.sourceId, this.syncedJob.customerId);
    } catch (e) {
      Log.error('onSourceChanged::', e);
    } finally {
      this.loading = false;
    }
  }

  private async initResourceNames(sourceId: SourceId, customerId: string) {
    if (StringUtils.isNotEmpty(customerId)) {
      this.loadingResource = true;
      const allTables: string[] = await this.sourcesService.listTableName(sourceId, customerId, '', '');
      Log.debug('GoogleAdsSourceConfig::initResourceNames::', allTables);
      // const allTables = this.allResources.map(resource => `${resource.id}`);
      this.resources = allTables;
      DataSourceModule.setTableNames(allTables);
      this.loadingResource = false;
    }
  }

  private async initCustomerIds(id: SourceId) {
    this.loading = true;
    this.customerIds = await this.sourcesService.listDatabaseName(id, '', '');
    if (ListUtils.hasOnlyOneItem(this.customerIds)) {
      this.syncedJob.customerId = this.customerIds[0];
    }
    this.loading = false;
  }

  isValidSource() {
    if (StringUtils.isEmpty(this.syncedJob.customerId)) {
      this.customerIdError = 'Customer Id is required!';
      throw new DIException('');
    }
    if (this.isSingleTable && StringUtils.isEmpty(this.syncedJob.resourceName)) {
      this.resourceNameError = 'Resource is required!';
      throw new DIException('');
    }
    return true;
  }

  private selectInputCustomerId(callback: Function) {
    this.isInputCustomerId = true;
    this.syncedJob.customerId = '';
    this.customerIdError = '';
    callback();
  }

  private selectCustomerId(id: string) {
    this.isInputCustomerId = false;
    this.syncedJob.customerId = id;
    this.customerIdError = '';
  }

  private resetCustomerIdError() {
    this.customerIdError = '';
  }

  private get isCreateNew(): boolean {
    return Job.getJobFormConfigMode(this.syncedJob) === FormMode.Create;
  }
}
</script>

<style lang="scss" scoped>
.color-di-primary {
  color: #597fff !important;
}
</style>
