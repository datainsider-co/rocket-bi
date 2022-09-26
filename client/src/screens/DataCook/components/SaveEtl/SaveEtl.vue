<template>
  <EtlModal ref="modal" @submit="submit" :loading="loading" @hidden="resetModel" :width="530" action-name="Save" title="Save ETL" class="modal-operator">
    <vuescroll :ops="scrollConfig">
      <div class="form-container">
        <form @submit.prevent="submit" class="oblock">
          <div v-if="errorMsg" class="form-group">
            <p class="text-danger">Error: {{ errorMsg }}</p>
          </div>
          <template v-if="model">
            <div class="form-group" :class="{ 'is-invalid': nameError }">
              <label>Name</label>
              <input
                :disabled="loading"
                v-model.trim="model.displayName"
                ref="input"
                type="text"
                class="form-control"
                :class="{ 'is-invalid': nameError }"
                autofocus
              />
              <div v-if="nameError" class="invalid-feedback">
                {{ nameError }}
              </div>
            </div>
            <SchedulerSettingV2 ref="schedulerSetting" @change="handleScheduler" :schedulerTime="model.scheduleTime"></SchedulerSettingV2>

            <div class="etl-config">
              <PanelHeader header="Incremental Setting" target-id="incremental-config">
                <EtlIncrementalConfig ref="etlIncrementalConfig" :etl-config="etlConfig" :data-sources="dataSources" />
              </PanelHeader>
            </div>
          </template>
          <input type="submit" class="d-none" />
        </form>
      </div>
    </vuescroll>
  </EtlModal>
</template>
<script lang="ts">
import { Component, Ref, Vue } from 'vue-property-decorator';
import { Config, DataCookService, EtlConfig, EtlJobRequest, EtlOperator, FullModeConfig, GetDataOperator, IncrementalConfig } from '@core/DataCook';
import cloneDeep from 'lodash/cloneDeep';
import { Log } from '@core/utils';
import { Inject as InjectService } from 'typescript-ioc/dist/decorators';
import { TimeScheduler } from '@/screens/DataIngestion/components/JobSchedulerForm/SchedulerTime/TimeScheduler';
import EtlModal from '../EtlModal/EtlModal.vue';
import { ETL_JOB_NAME_INVALID_REGEX } from '@/screens/DataCook/components/ManageEtlOperator/constance';
import SchedulerSettingV2 from '@/screens/DataIngestion/components/JobSchedulerForm/SchedulerSettingV2.vue';
import { Track } from '@/shared/anotation';
import { TrackEvents } from '@core/tracking/enum/TrackEvents';
import { SelectOption, VerticalScrollConfigs } from '@/shared';
import { WriteMode } from '@core/LakeHouse';
import EtlIncrementalConfig from '@/screens/DataCook/components/SaveEtl/EtlIncrementalConfig.vue';
import PanelHeader from '@/screens/ChartBuilder/SettingModal/PanelHeader.vue';

@Component({
  components: {
    EtlIncrementalConfig,
    SchedulerSettingV2,
    EtlModal,
    PanelHeader
  }
})
export default class SaveEtl extends Vue {
  private readonly scrollConfig = VerticalScrollConfigs;

  @InjectService
  private dataCookService!: DataCookService;

  private loading = false;
  private id: number | null = null;
  private model: EtlJobRequest | null = null;
  private errorMsg = '';
  private nameError = '';

  @Ref()
  private readonly schedulerSetting!: SchedulerSettingV2;

  @Ref()
  private readonly etlIncrementalConfig!: EtlIncrementalConfig;

  private resetModel() {
    this.loading = false;
    this.id = null;
    this.model = null;
    this.errorMsg = '';
    this.nameError = '';
  }

  save(id: number, etlJob: EtlJobRequest) {
    this.id = id;
    this.model = cloneDeep(etlJob);
    this.loading = false;
    this.show();
  }

  show() {
    // @ts-ignore
    this.$refs.modal.show();
  }

  hide() {
    // @ts-ignore
    this.$refs.modal.hide();
  }

  @Track(TrackEvents.ETLSubmitSave, {
    etl_id: (_: SaveEtl) => _.id,
    etl_name: (_: SaveEtl) => _.model?.displayName
  })
  private submit() {
    if (this.id && this.model) {
      this.errorMsg = '';
      this.nameError = '';
      if (!this.model.displayName) {
        this.nameError = 'Display name is empty';
      }
      if (ETL_JOB_NAME_INVALID_REGEX.test(this.model.displayName)) {
        this.nameError = "Display name can't contain special characters";
      }
      if (this.model.displayName.length > 250) {
        this.nameError = 'Display name: max length is 250 chars.';
      }
      if (this.nameError) {
        (this.$refs.input as HTMLInputElement).focus();
        return;
      }
      if (this.schedulerSetting) {
        this.model.scheduleTime = this.schedulerSetting.getJobScheduler();
      }
      this.loading = true;
      const clonedJob = cloneDeep(this.model);
      clonedJob.scheduleTime = TimeScheduler.toSchedulerV2(this.model.scheduleTime!);
      clonedJob.config = this.etlIncrementalConfig.getIncrementalConfig();
      this.dataCookService
        .updateEtl(this.id, clonedJob)
        .then(resp => {
          Log.info(resp);
          //get scheduler to display on ui
          this.model!.scheduleTime = this.schedulerSetting.getJobschedulerUI();
          this.hide();
          this.loading = false;
          this.$emit('saved', this.model);
        })
        .catch(e => {
          this.errorMsg = e.message;
          this.loading = false;
        });
    }
  }

  private handleScheduler(scheduler: TimeScheduler) {
    if (this.model) {
      this.model.scheduleTime = scheduler;
    }
  }

  private get dataSources(): GetDataOperator[] {
    const allDataSources: GetDataOperator[] = (this.model?.operators ?? []).flatMap(op => op.getAllGetDataOperators());
    return EtlOperator.unique(allDataSources) as GetDataOperator[];
  }

  private get etlConfig(): EtlConfig {
    const etlConfigAsMap = new Map<string, Config>();
    if (this.model) {
      const configAsMap: Map<string, Config> = this.model?.config?.mapIncrementalConfig ?? new Map<string, Config>();
      this.dataSources.map(source => {
        Log.debug('SaveEtl::etlConfig::source::', source);
        if (configAsMap.has(source.destTableConfig.tblName)) {
          etlConfigAsMap.set(source.destTableConfig.tblName, configAsMap.get(source.destTableConfig.tblName)!);
        } else {
          etlConfigAsMap.set(source.destTableConfig.tblName, FullModeConfig.default());
        }
      });
    }
    Log.debug('SaveEtl::etlConfig::etlAsMap::', etlConfigAsMap);
    return new EtlConfig(etlConfigAsMap);
  }
}
</script>
<style lang="scss" scoped>
.modal-operator {
  ::v-deep .modal-content {
    background-color: var(--primary) !important;
  }

  .form-container {
    max-height: 440px;
    .oblock {
      background-color: var(--secondary);
      padding: 24px;
      border-radius: 4px;
    }
  }

  ::v-deep .etl-config {
    margin-top: 1.6rem;

    .header {
      opacity: 0.8;
      color: var(--secondary-text-color);
    }
  }
}
</style>
