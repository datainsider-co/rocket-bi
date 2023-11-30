<template>
  <div class="google-search-console-config">
    <div class="job-section">
      <label>Site URL</label>
      <div class="input">
        <DiDropdown
          :data="siteUrls"
          id="google-search-console-url"
          valueProps="id"
          label-props="displayName"
          v-model="syncedJob.siteUrl"
          :class="{ 'is-invalid': siteUrlError }"
          placeholder="Select site URL..."
          boundary="viewport"
          appendAtRoot
          @change="resetSiteUrlError"
        >
          <template #icon-dropdown>
            <div v-if="isSiteUrlLoading" class="loading">
              <i class="fa fa-spinner fa-spin"></i>
            </div>
          </template>
        </DiDropdown>
      </div>
      <div class="text-danger mt-1">{{ siteUrlError }}</div>
    </div>
    <div v-if="!hideSyncAllTableOption" class="d-flex job-section">
      <DiToggle id="ga-sync-all-table" :value="!isSingleTable" @onSelected="isSingleTable = !isSingleTable" label="Sync all tables"></DiToggle>
    </div>
    <b-collapse :visible="isSingleTable" class="job-section">
      <label>Table type</label>
      <div class="input">
        <DiDropdown
          :data="tableTypes"
          id="google-search-console-table"
          valueProps="id"
          label-props="displayName"
          v-model="syncedJob.tableType"
          :class="{ 'is-invalid': tableTypeError }"
          placeholder="Select table type..."
          boundary="viewport"
          appendAtRoot
          @change="resetTableTypeError"
        >
        </DiDropdown>
      </div>
      <div class="text-danger mt-1">{{ tableTypeError }}</div>
    </b-collapse>
    <div class="job-section">
      <label>Search type</label>
      <div class="input">
        <DiDropdown
          :data="searchTypes"
          id="google-search-console-search-type"
          valueProps="id"
          label-props="displayName"
          v-model="syncedJob.searchAnalyticsConfig.type"
          :class="{ 'is-invalid': searchTypeError }"
          placeholder="Select search type..."
          boundary="viewport"
          appendAtRoot
          @change="resetSearchTypeError"
        >
        </DiDropdown>
      </div>
      <div class="text-danger mt-1">{{ searchTypeError }}</div>
    </div>
    <div class="job-section">
      <label>Data state</label>
      <div class="input">
        <DiDropdown
          :data="dataStates"
          id="google-search-console-data-state"
          valueProps="id"
          label-props="displayName"
          v-model="syncedJob.searchAnalyticsConfig.dataState"
          :class="{ 'is-invalid': dataStateError }"
          placeholder="Select date state..."
          boundary="viewport"
          appendAtRoot
          @change="resetDataStateError"
        >
        </DiDropdown>
      </div>
      <div class="text-danger mt-1">{{ dataStateError }}</div>
    </div>
  </div>
</template>

<script lang="ts">
import { Component, Prop, PropSync, Vue, Watch } from 'vue-property-decorator';
import { GoogleSearchConsoleJob, GoogleSearchConsoleType, SearchAnalyticsType, SearchAnalyticsDataState, TokenRequest } from '@core/data-ingestion';
import { Inject } from 'typescript-ioc';
import { DataSourceService } from '@core/common/services/DataSourceService';
import { Log } from '@core/utils';
import { DataSourceModule } from '@/screens/data-ingestion/store/DataSourceStore';
import { SelectOption, Status } from '@/shared';
import DiToggle from '@/shared/components/common/DiToggle.vue';
import { GoogleUtils, ListUtils, PopupUtils, StringUtils } from '@/utils';
import { DIException } from '@core/common/domain';
import DiCalendar from '@filter/main-date-filter-v2/DiCalendar.vue';
import DiInputComponent from '@/shared/components/DiInputComponent.vue';
import { DataSourceResponse } from '@core/data-ingestion/domain/response/DataSourceResponse';
import { GoogleSearchConsoleSource } from '@core/data-ingestion/domain/response/GoogleSearchConsoleSource';
import { GoogleSearchConsoleSourceInfo } from '@core/data-ingestion/domain/data-source/GoogleSearchConsoleSourceInfo';

@Component({
  components: { DiInputComponent, DiToggle, DiCalendar }
})
export default class GoogleSearchConsoleConfig extends Vue {
  private tableError = '';
  private siteUrlError = '';
  private dataStateError = '';
  private tableTypeError = '';
  private searchTypeError = '';
  private siteUrls: SelectOption[] = [];
  private isSiteUrlLoading = false;

  @Inject
  private readonly sourcesService!: DataSourceService;
  @PropSync('job')
  syncedJob!: GoogleSearchConsoleJob;

  @PropSync('singleTable')
  isSingleTable!: boolean;

  @Prop({ required: false, default: false, type: Boolean })
  hideSyncAllTableOption!: boolean;

  private get tableTypes(): SelectOption[] {
    return [
      {
        id: GoogleSearchConsoleType.SearchAnalytics,
        displayName: 'Search Analytics'
      },
      {
        id: GoogleSearchConsoleType.SearchAppearance,
        displayName: 'Search Appearance'
      }
    ];
  }

  private get dataStates(): SelectOption[] {
    return [
      {
        id: SearchAnalyticsDataState.All,
        displayName: 'All'
      },
      {
        id: SearchAnalyticsDataState.Final,
        displayName: 'Final'
      }
    ];
  }

  private get searchTypes(): SelectOption[] {
    return [
      {
        id: SearchAnalyticsType.Web,
        displayName: 'Web'
      },
      {
        id: SearchAnalyticsType.GoogleNews,
        displayName: 'Google News'
      },
      {
        id: SearchAnalyticsType.News,
        displayName: 'News'
      },
      {
        id: SearchAnalyticsType.Image,
        displayName: 'Image'
      },
      {
        id: SearchAnalyticsType.Video,
        displayName: 'Video'
      },
      {
        id: SearchAnalyticsType.Discover,
        displayName: 'Discover'
      }
    ];
  }

  beforeDestroy() {
    DataSourceModule.setTableNames([]);
  }

  async mounted() {
    Log.debug('GoogleSearchConsoleConfig::mounted');
    await this.loadData();
  }

  private get sources(): DataSourceResponse[] {
    return DataSourceModule.dataSources;
  }

  private selectTable(tblName: string) {
    if (StringUtils.isEmpty(this.syncedJob.destTableName) && this.isSingleTable) {
      this.$emit('selectTable', tblName);
    }
  }

  @Watch('isSingleTable')
  handleSyncWithAllTables(isSingle: boolean) {
    if (!isSingle) {
      // this.selectDatabase();
    }
  }

  async loadData(): Promise<void> {
    try {
      Log.debug('GoogleSearchConsoleConfig::loadData::', DataSourceModule.dataSources);
      if (this.syncedJob.jobId >= 0) {
        const source = await DataSourceModule.getSource(this.syncedJob.sourceId);
        if (source) {
          const googleSearchConsoleSource = source as GoogleSearchConsoleSourceInfo;
          await this.handleLoadSiteUrls(googleSearchConsoleSource.accessToken, googleSearchConsoleSource.refreshToken);
        }
      }
    } catch (e) {
      Log.error('GoogleSearchConsoleConfig::loadData::error::', e.message);
      PopupUtils.showError(e.message);
    }
  }

  async handleLoadSiteUrls(accessToken: string, refreshToken: string) {
    let count = 0;
    try {
      this.isSiteUrlLoading = true;
      await GoogleUtils.loadGoogleSearchConsoleClient(accessToken);
      const response: { siteUrl: string }[] = await GoogleUtils.listSiteUrls();
      this.siteUrls = response.map(item => {
        return {
          id: item.siteUrl,
          displayName: item.siteUrl
        };
      });
      Log.debug('GoogleSearchConsoleConfig::handleLoadSiteUrls::siteUrls::', this.siteUrls);
      if (this.siteUrls.length > 0 && !this.syncedJob.siteUrl) {
        this.syncedJob.siteUrl = this.siteUrls[0].id as string;
      }
      this.siteUrlError = '';
      if (this.siteUrls.length == 0) {
        this.siteUrlError = 'Your account have no site urls.';
      }
    } catch (e) {
      Log.error('GoogleSearchConsoleConfig::handleLoadSiteUrls::error::', e, count);
      if (count === 0 && e.status === 401) {
        Log.debug('GoogleSearchConsoleConfig::retry::error::', e);
        await this.retryLoadSiteUrlsOnFailed(accessToken, refreshToken);
      } else {
        this.siteUrlError = e.result.error.message;
      }
      count++;
    } finally {
      this.isSiteUrlLoading = false;
    }
  }

  private async retryLoadSiteUrlsOnFailed(accessToken: string, refreshToken: string) {
    const response = await DataSourceModule.refreshGoogleToken(new TokenRequest(accessToken, refreshToken));
    await this.handleLoadSiteUrls(response.accessToken, refreshToken);
  }

  isValidSource() {
    if (StringUtils.isEmpty(this.syncedJob.siteUrl)) {
      this.siteUrlError = 'Please select site URL.';
      throw new DIException('');
    }
    return true;
  }

  private resetSiteUrlError() {
    this.siteUrlError = '';
  }

  private resetDataStateError() {
    this.dataStateError = '';
  }

  private resetTableTypeError() {
    this.tableTypeError = '';
  }

  private resetSearchTypeError() {
    this.searchTypeError = '';
  }

  private setWarehouseDestDatabase(name: string) {
    if (!this.syncedJob.destDatabaseName) {
      this.$emit('selectDatabase', name);
    }
  }

  private setWarehouseDestTable(name: string) {
    if (!this.syncedJob.destTableName && this.isSingleTable) {
      this.$emit('selectTable', name);
    }
  }

  @Watch('syncedJob.siteUrl')
  onSiteUrlChanged(siteUrl: string) {
    this.setWarehouseDestDatabase('google_search_console');
    this.setWarehouseDestTable(this.syncedJob.tableType);
  }

  @Watch('isSingleTable')
  onIsSingleTableChanged(isSingleTable: boolean) {
    this.setWarehouseDestTable(this.syncedJob.tableType);
  }
}
</script>

<style lang="scss">
.google-analytics-config {
  .di-input-component--input {
    height: 34px !important;
    > div {
      margin-right: 4.5px;
      display: flex;
      align-items: center;
      justify-content: center;
      i {
        font-size: 14px !important;
      }
    }
  }

  .di-date-picker {
    input {
      height: 34px;
    }
  }
}
</style>
