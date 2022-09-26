<template>
  <div class="streaming-job-config kafka-streaming-config">
    <div class="job-section">
      <DiInputComponent label="Job Name" placeholder="Input job name" autofocus autocomplete="off" v-model="kafkaStreamingJob.name"></DiInputComponent>
      <div v-if="$v.kafkaStreamingJob.name.$error" class="error mt-1">
        Job name is required.
      </div>
    </div>
    <div class="job-section">
      <DiInputComponent
        label="Bootstrap Servers"
        placeholder="Input bootstrap servers"
        @change="handleLoadTopics"
        autocomplete="off"
        v-model="kafkaStreamingJob.config.bootstrapServers"
      ></DiInputComponent>
      <div v-if="$v.kafkaStreamingJob.config.bootstrapServers.$error" class="error mt-1">
        Bootstrap servers is required.
      </div>
    </div>
    <div class="job-section">
      <label>Topic</label>
      <DiDropdown
        :appendAtRoot="true"
        :data="topicOptions"
        labelProps="label"
        valueProps="value"
        placeholder="Select topic..."
        v-model="kafkaStreamingJob.config.topic"
      >
        <template slot="icon-dropdown">
          <i v-if="topicLoading" alt="dropdown" class="fa fa-spin fa-spinner text-muted"></i>
          <i v-else alt="dropdown" class="di-icon-arrow-down text-muted"></i>
        </template>
      </DiDropdown>
      <div v-if="$v.kafkaStreamingJob.config.topic.$error" class="error mt-1">
        Topic is required.
      </div>
    </div>
    <!--      <DiDropdown-->
    <!--        :data=""-->
    <!--        placeholder="Select key deserializer..."-->
    <!--        :appendAtRoot="true"-->
    <!--        v-model="syncedKafkaJob.config.keyDeserializer"-->
    <!--        labelProps="label"-->
    <!--        valueProps="value"-->
    <!--      ></DiDropdown>-->
    <!--     Kafka Format -->
    <!--      <template v-if="isJSONFormat">-->
    <!--        <DiInputComponent-->
    <!--          class="job-section"-->
    <!--          label="JSON Depth"-->
    <!--          placeholder="Input JSON depth"-->
    <!--          autocomplete="off"-->
    <!--          v-model="syncedKafkaJob.config.format.flattenDepth"-->
    <!--        ></DiInputComponent>-->
    <!--      </template>-->
    <SelectDatabaseAndTable :disabled="false" ref="selectDatabaseAndTable" :databaseName="warehouseConfig.dbName" :tableName="warehouseConfig.tblName">
    </SelectDatabaseAndTable>
    <div v-if="$v.kafkaStreamingJob.destinationConfigs.$error" class="error mt-1">
      Warehouse config is required.
    </div>
  </div>
</template>
<script lang="ts">
import { Component, Vue, Prop, Watch, Ref } from 'vue-property-decorator';
import DiInputComponent from '@/shared/components/DiInputComponent.vue';
import { ClickhouseDestinationConfig, DestinationConfig, KafkaStreamingJob, StreamingJobService } from '@core/DataIngestion';
import DiDropdown from '@/shared/components/Common/DiDropdown/DiDropdown.vue';
import WareHouseConfig from '@/screens/LakeHouse/views/Job/OutputForm/WareHouseConfig.vue';
import { StreamingJobConfig } from '@/screens/DataIngestion/components/StreamingJob/StreamingJobConfig';
import { KafkaTopic } from '@core/DataIngestion/Domain/Response/StreamingJob/KafkaTopic';
import { Log } from '@core/utils';
import { Inject } from 'typescript-ioc';
import { cloneDeep } from 'lodash';
import { required } from 'vuelidate/lib/validators';
import { StringUtils } from '@/utils/string.utils';
import { ListUtils } from '@/utils';
import SelectDatabaseAndTable from '@/screens/DataCook/components/SelectDatabaseAndTable/SelectDatabaseAndTable.vue';
import SelectDatabaseAndTableCtrl from '@/screens/DataCook/components/SelectDatabaseAndTable/SelectDatabaseAndTable';
import { StringColumn, TableSchema } from '@core/domain';

const requiredDestConfigs = (configs: string[]) => ListUtils.isNotEmpty(configs);

@Component({
  components: { WareHouseConfig, DiDropdown, DiInputComponent, SelectDatabaseAndTable },
  validations: {
    kafkaStreamingJob: {
      name: { required },
      config: {
        bootstrapServers: { required },
        topic: { required }
      },
      destinationConfigs: {
        requiredDestConfigs
      }
    }
  }
})
export default class KafkaStreamingJobConfig extends Vue implements StreamingJobConfig {
  private topics: KafkaTopic[] = [];
  private topicLoading = false;
  private warehouseConfig: ClickhouseDestinationConfig = ClickhouseDestinationConfig.default();
  private kafkaStreamingJob = KafkaStreamingJob.default();

  @Prop()
  private job!: KafkaStreamingJob;

  @Ref()
  private selectDatabaseAndTable?: SelectDatabaseAndTableCtrl;

  @Inject
  private streamingJobService!: StreamingJobService;

  private get topicOptions() {
    return this.topics.map(topic => {
      return {
        label: topic.name,
        value: topic.name
      };
    });
  }

  private getWarehouseConfig(kafkaStreamingJob: KafkaStreamingJob): ClickhouseDestinationConfig | null {
    const warehouseConfig = kafkaStreamingJob.destinationConfigs.find(config => DestinationConfig.isClickhouseConfig(config));
    if (warehouseConfig) {
      return warehouseConfig as ClickhouseDestinationConfig;
    } else {
      return null;
    }
  }

  private async handleLoadTopics() {
    try {
      this.topicLoading = true;
      this.topics = await this.streamingJobService.listTopic(this.kafkaStreamingJob.config);
    } catch (e) {
      Log.error('KafkaStreamingJobConfig::handleLoadTopics::error::', e);
    } finally {
      this.topicLoading = false;
    }
  }

  async getJob(): Promise<KafkaStreamingJob> {
    await this.updateWarehouseConfig();
    return this.kafkaStreamingJob;
  }

  async updateWarehouseConfig() {
    const warehouseConfigIndex = this.kafkaStreamingJob.destinationConfigs.findIndex(config => DestinationConfig.isClickhouseConfig(config));
    //todo: fixhere not create table
    const tableSchema: TableSchema | undefined | null = await this.selectDatabaseAndTable?.getData(TableSchema.empty());
    Log.debug('KafkaStreamingJobConfig::updateWarehouseConfig::error::', tableSchema);
    if (tableSchema) {
      const warehouseConfig = new ClickhouseDestinationConfig(tableSchema.dbName, tableSchema.name);
      if (warehouseConfigIndex >= 0) {
        this.kafkaStreamingJob.destinationConfigs[warehouseConfigIndex] = warehouseConfig;
      } else {
        this.kafkaStreamingJob.destinationConfigs.push(warehouseConfig);
      }
    }
  }

  isValidJob(): boolean {
    this.$v.$touch();
    if (this.$v.$invalid) {
      return false;
    }
    return true;
  }

  resetData(): void {
    this.topics = [];
    this.topicLoading = false;
    this.warehouseConfig = ClickhouseDestinationConfig.default();
    this.kafkaStreamingJob = KafkaStreamingJob.default();
  }

  initData(): void {
    Log.debug('KafkaStreamingJobConfig::loadData::job::', this.job);
    this.kafkaStreamingJob = cloneDeep(this.job);
    const warehouseConfig = this.getWarehouseConfig(this.kafkaStreamingJob);
    if (warehouseConfig) {
      this.warehouseConfig = warehouseConfig;
    }

    if (StringUtils.isNotEmpty(this.kafkaStreamingJob.config.bootstrapServers)) {
      this.handleLoadTopics();
    }
    this.reloadDatabaseAndTable();
  }

  @Watch('warehouseConfig.database')
  reloadDatabaseAndTable() {
    this.$nextTick(() => {
      //@ts-ignore
      this.selectDatabaseAndTable?.loadData();
    });
  }
}
</script>

<style lang="scss">
.kafka-streaming-config {
  .warehouse-config {
    &-save-mode {
      display: none;
    }
  }
  @import '~@/screens/LakeHouse/views/Job/OutputForm/OutputForm.scss';
}
</style>
