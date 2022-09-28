<template>
  <div class="di-theme">
    <Modal ref="modal" hide-footer width="1030" backdrop="static" :keyboard="false" disable-scroll-h :show="showModal">
      <template slot="header">
        <div class="w-100 text-center">
          <h5 class="modal-title">Preview Kafka table schema</h5>
          <div class="text-muted">Config Kafka table schema</div>
        </div>
      </template>
      <div>
        <div class="row">
          <div class="col-12 col-sm-7 col-lg-8">
            <div v-if="error" class="d-flex flex-column justify-content-center align-items-center text-center" style="height: 400px">
              <h6 class="text-danger">Error when calculate preview data!</h6>
              <p class="text-muted error-subtitle">{{ error }}</p>
              <button @click.prevent="calcPreviewData" class="btn btn-di-primary">Retry</button>
            </div>
            <div v-else-if="loading" class="d-flex flex-column justify-content-center align-items-center text-center" style="height: 400px">
              <p class="text-muted">Calculate preview data...</p>
            </div>
            <div v-else class="table-container" style="height: 400px">
              <vuescroll>
                <table class="table table-striped mb-0">
                  <thead>
                    <tr>
                      <th class="text-center">Name</th>
                      <th v-for="header in responseColumns" :key="header.key">
                        <span>{{ header.displayName }}</span>
                        <!--                        <input :id="genInputId('column-name')" v-model="header.displayName" type="text" class="bg-transparent border-0" />-->
                      </th>
                    </tr>
                    <tr>
                      <th class="text-center">Type</th>
                      <th v-for="column in responseColumns" :key="column.name">
                        <div class="dropdown dropdown-th">
                          <a href="#" class="font-weight-normal dropdown-toggle" data-toggle="dropdown">{{ columnDataTypeName[column.className] }}</a>
                          <div class="dropdown-menu">
                            <a @click.prevent="changeColumnClassName(column, item)" v-for="item in classNames" :key="item.id" href="#" class="dropdown-item">
                              {{ item.name }}
                            </a>
                          </div>
                        </div>
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr v-for="(item, idx) in responseRecords" :key="idx">
                      <td class="text-center">{{ idx + 1 }}</td>
                      <td v-for="(column, hIdx) in responseColumns" :key="hIdx">{{ item[hIdx] }}</td>
                    </tr>
                  </tbody>
                </table>
              </vuescroll>
            </div>
          </div>
          <div class="col-12 col-sm-5 col-lg-4 text-left" v-if="job">
            <DiInputComponent
              v-if="isJSONFormat"
              class="flatter-depth"
              label="Flatten Depth"
              type="number"
              min="0"
              placeholder="Flatter depth number"
              v-model="job.config.format.flattenDepth"
              @change="handleFlattenDepthChanged"
            ></DiInputComponent>
          </div>
        </div>
        <div class="d-flex mt-5 align-items-center">
          <span class="text-muted">Previewing first {{ totalRecords }} rows</span>
          <div class="ml-auto">
            <button @click.prevent="handleBack" class="btn btn-secondary mr-3">Back</button>
            <button @click.prevent="handleNext" class="btn btn-di-primary">Create</button>
          </div>
        </div>
      </div>
    </Modal>
  </div>
</template>

<script lang="ts">
import {
  COLUMN_DATA_TYPE,
  COLUMN_DATA_TYPE_NAME,
  DELIMITER,
  SKIP_ROWS
  //@ts-ignored
} from '@/screens/DataIngestion/components/DiUploadDocument/entities/Enum.js';
import { Modal } from '@/shared/components/builder';
import { ClickhouseDestinationConfig, KafkaFormat, KafkaStreamingJob, PreviewResponse, StreamingJobService, JSONFormat } from '@core/DataIngestion';
import { Column, ColumnType, DIException } from '@core/domain';
import { DataSourceService } from '@core/services/DataSourceService';
import { Log } from '@core/utils';
import { cloneDeep, isNumber, toNumber } from 'lodash';
import { Inject } from 'typescript-ioc';
import { Component, Ref, Vue, Watch } from 'vue-property-decorator';
import DiInputComponent from '@/shared/components/DiInputComponent.vue';

@Component({ components: { DiInputComponent, Modal } })
export default class KafkaStreamingPreviewSchemaModal extends Vue {
  private job: KafkaStreamingJob | null = null;

  private response: PreviewResponse | null = null;

  private loading = true;

  private showModal = false;

  private error = '';

  private callback: ((job: KafkaStreamingJob) => void) | null = null;

  private onBack: ((job: KafkaStreamingJob) => void) | null = null;

  @Inject
  private readonly streamingJobService!: StreamingJobService;

  @Ref()
  private modal!: Modal;

  private get isJSONFormat() {
    return this.job ? KafkaFormat.isJSONFormat(this.job.config.format) : false;
  }

  show(job: KafkaStreamingJob, options?: { onCompleted?: (job: KafkaStreamingJob) => void; onBack?: (job: KafkaStreamingJob) => void }) {
    this.resetModal();
    this.job = cloneDeep(job);
    this.callback = options?.onCompleted || null;
    this.onBack = options?.onBack || null;
    this.calcPreviewData();
    this.showModal = true;
  }

  private resetModal() {
    this.job = null;
    this.callback = null;
    this.callback = null;
    this.onBack = null;
    this.error = '';
    this.loading = false;
  }

  private handleNext() {
    try {
      this.ensureFlattenDepth();
      if (this.callback) {
        this.callback(this.job!);
      }
      this.showModal = false;
    } catch (e) {
      this.error = e.message;
    }
  }

  private ensureFlattenDepth() {
    const validDepth = isNumber(+(this.job?.config.format as JSONFormat).flattenDepth);
    if (!validDepth) {
      throw new DIException('Flatter Depth is a number.');
    }
  }

  private get columnDataTypeName() {
    return COLUMN_DATA_TYPE_NAME;
  }

  private get classNames() {
    return Object.values(COLUMN_DATA_TYPE).map(id => ({ id, name: COLUMN_DATA_TYPE_NAME[id] }));
  }

  private changeColumnClassName(column: Column, newClassName: { name: string; id: string }) {
    column.className = newClassName.id as ColumnType;
    this.calcPreviewData();
  }

  private get delimiters() {
    return Object.values(DELIMITER);
  }

  private async calcPreviewData() {
    this.loading = true;
    this.error = '';
    try {
      //todo: handle get and set table to kafka here
      this.response = await this.streamingJobService.preview(this.job!.config);
      this.job?.config.setTableSchema(this.response.tableSchema);
    } catch (ex) {
      Log.error(ex);
      this.error = ex.message;
    } finally {
      this.loading = false;
    }
  }

  private get totalRecords(): number {
    return this.response?.records?.length ?? 0;
  }

  private get responseColumns(): Column[] {
    return this.response?.tableSchema?.columns ?? [];
  }

  private get responseRecords(): any[][] {
    return this.response?.records ?? [];
  }

  private handleBack() {
    if (this.onBack) {
      this.onBack(this.job!);
    }
    this.showModal = false;
  }

  private handleFlattenDepthChanged() {
    this.calcPreviewData();
  }

  private get skipRowsOptions() {
    return Object.values(SKIP_ROWS);
  }
}
</script>

<style lang="scss" scoped>
.di-theme {
  .error-subtitle {
    font-size: 12px;
    max-width: 100%;
    text-overflow: clip;
  }
  ::v-deep {
    @media (min-width: 576px) {
      .modal-dialog {
        max-width: 60%;
      }
    }
  }

  .di-input-component {
  }
  .flatter-depth {
    ::v-deep {
      .form-control {
        border: 0 !important;
      }

      .di-input-component--label {
        font-size: 12px;
        font-weight: 500;
      }
    }
  }
}
</style>
