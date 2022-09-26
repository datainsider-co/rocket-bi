<template>
  <div>
    <b-collapse :visible="syncedBigQueryJob.className === jobName.BigQueryJob">
      <div class="job-section">
        <label>Project name</label>
        <div class="input">
          <BFormInput
            :id="genInputId('big-query-project-name')"
            placeholder="Input project name"
            autocomplete="off"
            :debounce="500"
            v-model="syncedBigQueryJob.projectName"
            @change="handleLoadBigQueryFromData"
          ></BFormInput>
        </div>
      </div>
    </b-collapse>
    <div v-if="syncedBigQueryJob.className === jobName.BigQueryJob" class=" export-form mb-0 mt-12px">
      <div class="input">
        <label id="big-query-advanced-option" class="input mar-b-12">Location</label>
        <DiDropdown
          id="location-dropdown"
          class="swm-select"
          v-model="syncedBigQueryJob.location"
          :data="locations"
          label-props="label"
          value-props="type"
          hidePlaceholderOnMenu
          boundary="viewport"
          placeholder="Default"
          @change="handleSelectLocation"
          :appendAtRoot="true"
        >
          <template slot="before-menu" slot-scope="{ hideDropdown }">
            <li class="active color-di-primary font-weight-normal" @click.prevent="selectNewDatabaseOption(hideDropdown)">
              Default
            </li>
          </template>
        </DiDropdown>
      </div>
    </div>
  </div>
</template>
<script lang="ts">
import { Component, Prop, PropSync, Ref, Vue, Watch } from 'vue-property-decorator';
import DynamicSuggestionInput from '@/screens/DataIngestion/components/DynamicSuggestionInput.vue';
import { BigQueryJob } from '@core/DataIngestion/Domain/Job/BigQueryJob';
import { Log } from '@core/utils';
import { required } from 'vuelidate/lib/validators';
import DropdownInput from '@/screens/DataIngestion/DropdownInput.vue';
import { JobName } from '@core/DataIngestion/Domain/Job/JobName';
import { DataSourceModule } from '@/screens/DataIngestion/store/DataSourceStore';
import { Track } from '@/shared/anotation';
import { TrackEvents } from '@core/tracking/enum/TrackEvents';

@Component({
  components: {
    DynamicSuggestionInput,
    DropdownInput
  },
  validations: {
    syncedBigQueryJob: {
      tableName: { required },
      datasetName: { required }
    }
  }
})
export default class BigQueryExtraForm extends Vue {
  private readonly jobName = JobName;
  private readonly locations = require('@/screens/DataIngestion/constants/locations.json');

  @PropSync('bigQueryJob')
  syncedBigQueryJob!: BigQueryJob;

  @PropSync('databaseLoading')
  fromDatabaseLoading!: boolean;
  @PropSync('tableLoading')
  fromTableLoading!: boolean;

  @Ref()
  private readonly fromTableDropdownInput!: DropdownInput;

  private selectNewDatabaseOption(callback?: Function) {
    this.syncedBigQueryJob.location = '';
    callback ? callback() : null;
  }

  @Watch('syncedBigQueryJob.projectName')
  onLocationChange() {
    this.handleLoadBigQueryFromData();
  }

  @Track(TrackEvents.BigQueryLocationSelect, { location: (_: BigQueryExtraForm, args: any) => args[0] })
  private handleSelectLocation(location: string) {
    try {
      Log.error('handleSelectLocation::', location);
      this.handleLoadBigQueryFromData();
    } catch (e) {
      Log.error('handleClickAdvancedOption::', e.message);
    } finally {
      this.fromTableLoading = false;
      this.fromDatabaseLoading = false;
    }
  }

  public async handleLoadBigQueryFromData() {
    try {
      await DataSourceModule.loadDatabaseNames({
        id: this.syncedBigQueryJob.sourceId!,
        projectName: this.syncedBigQueryJob.projectName,
        location: this.syncedBigQueryJob.location
      });
      this.fromDatabaseLoading = false;
      await DataSourceModule.loadTableNames({
        id: this.syncedBigQueryJob.sourceId,
        dbName: this.syncedBigQueryJob.datasetName,
        projectName: this.syncedBigQueryJob.projectName,
        location: this.syncedBigQueryJob.location
      });
      this.fromTableLoading = false;
    } catch (e) {
      Log.error('handleLoadBigQueryFromData::Error::', e);
    }
  }
}
</script>
