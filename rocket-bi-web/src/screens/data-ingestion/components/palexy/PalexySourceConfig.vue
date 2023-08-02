<template>
  <div class="palexy-source-config">
    <div class="job-section">
      <label>Dimensions</label>
      <div class="input">
        <TagsInput
          id="palexy-dimensions"
          labelProp="id"
          :defaultTags="dimensions"
          :suggestTags="suggestDimensions"
          addOnlyFromAutocomplete
          @tagsChanged="handleDimensionsChanged"
        />
      </div>
    </div>
    <div class="job-section">
      <label>Metrics</label>
      <div class="input">
        <TagsInput
          id="metric"
          labelProp="id"
          :defaultTags="metrics"
          :suggestTags="suggestMetrics"
          addOnlyFromAutocomplete
          @tagsChanged="handleMetricsChanged"
        />
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import { Component, Prop, PropSync, Vue } from 'vue-property-decorator';
import { PalexyDateRange, PalexyJob, PalexyTime } from '@core/data-ingestion';
import { Inject } from 'typescript-ioc';
import { DataSourceService } from '@core/common/services/DataSourceService';
import { DataSourceModule } from '@/screens/data-ingestion/store/DataSourceStore';
import DiToggle from '@/shared/components/common/DiToggle.vue';
import DiCalendar from '@filter/main-date-filter-v2/DiCalendar.vue';
import { DropdownData } from '@/shared/components/common/di-dropdown';
import { Log } from '@core/utils';
import { StringUtils } from '@/utils';
import { DIException } from '@core/common/domain';

@Component({
  components: { DiToggle, DiCalendar }
})
export default class PalexySourceConfig extends Vue {
  @Inject
  private readonly sourcesService!: DataSourceService;
  @PropSync('job')
  syncedJob!: PalexyJob;

  @Prop({ required: false, default: false, type: Boolean })
  hideSyncAllTableOption!: boolean;

  beforeDestroy() {
    DataSourceModule.setTableNames([]);
  }

  private get dimensions() {
    return this.syncedJob.dimensions.map(dimension => {
      return {
        id: dimension
      };
    });
  }

  private get metrics() {
    return this.syncedJob.metrics.map(metric => {
      return {
        id: metric
      };
    });
  }

  private get suggestMetrics() {
    return this.syncedJob.getSuggestedMetrics().map(metric => {
      return {
        id: metric
      };
    });
  }

  private get suggestDimensions() {
    return this.syncedJob.getSuggestedDimension().map(metric => {
      return {
        id: metric
      };
    });
  }

  private handleMetricsChanged(data: any[]) {
    this.syncedJob.metrics = data.map(data => data.text);
    Log.debug('PalexySourceConfig::handleMetricsChanged::data::', data);
  }
  private handleDimensionsChanged(data: any[]) {
    this.syncedJob.dimensions = data.map(data => data.text);
    Log.debug('PalexySourceConfig::handleDimensionsChanged::data::', data);
  }

  isValidSource() {
    return true;
  }
}
</script>

<style lang="scss">
.palexy-source-config {
  .vue-tags-input {
    .ti-input {
      max-height: unset !important;
    }
  }
}
</style>
