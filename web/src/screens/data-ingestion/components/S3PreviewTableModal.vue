<template>
  <div class="di-theme">
    <Modal ref="modal" hide-footer width="1030" backdrop="static" :keyboard="false" disable-scroll-h :show="showModal">
      <template slot="header">
        <div class="w-100 text-center">
          <h5 class="modal-title">Preview CSV schema</h5>
          <div class="text-muted">Config CSV schema of your files in S3</div>
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
                        <span v-if="job.fileConfig.useFirstRowAsHeader">{{ header.displayName }}</span>
                        <input :id="genInputId('column-name')" v-else v-model="header.displayName" type="text" class="bg-transparent border-0" />
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
            <div class="form-group form-group-di">
              <label>Column Headers</label>
              <div class="d-flex align-items-center mb-3">
                <label class="di-radio">
                  <input
                    :id="genCheckboxId('use-first-row-headers')"
                    v-model="job.fileConfig.useFirstRowAsHeader"
                    @change="calcPreviewData"
                    :value="true"
                    type="radio"
                    name="header"
                  />
                  <span></span>
                  <span>Use first row as headers</span>
                </label>
                <i class="ml-auto">
                  <img src="di-upload-document/assets/icons/question.svg" alt="" width="16" height="16" />
                </i>
              </div>
              <div class="d-flex align-items-center">
                <label class="di-radio">
                  <input
                    :id="genCheckboxId('generate-headers')"
                    v-model="job.fileConfig.useFirstRowAsHeader"
                    @change="calcPreviewData"
                    type="radio"
                    name="header"
                  />
                  <span></span>
                  <span>Generate headers</span>
                </label>
                <i class="ml-auto">
                  <img src="di-upload-document/assets/icons/question.svg" alt="" width="16" height="16" />
                </i>
              </div>
            </div>
            <div class="form-group form-group-di">
              <label>Delimiter</label>
              <div class="d-flex align-items-center">
                <div class="dropdown delimiter-dropdown">
                  <a href="#" class="btn btn-di-default w-auto dropdown-toggle" data-toggle="dropdown">
                    {{ job.fileConfig.separator === '\t' ? '\\t' : job.fileConfig.separator }}
                  </a>
                  <div class="dropdown-menu">
                    <a @click.prevent="changeDelimiter(item)" v-for="item in delimiters" :key="item" href="#" class="dropdown-item"
                      ><code>{{ item === '\t' ? '\\t' : item }}</code></a
                    >
                  </div>
                </div>
                <i class="ml-auto">
                  <img src="di-upload-document/assets/icons/question.svg" alt="" width="16" height="16" />
                </i>
              </div>
            </div>
            <div class="form-group form-group-di">
              <label>Skip row</label>
              <div class="d-flex align-items-center">
                <div class="dropdown delimiter-dropdown">
                  <a href="#" class="btn btn-di-default w-auto dropdown-toggle" data-toggle="dropdown">
                    {{ job.fileConfig.skipRows }}
                  </a>
                  <div class="dropdown-menu">
                    <a @click.prevent="changeSkipRows(item)" v-for="item in skipRowsOptions" :key="item" href="#" class="dropdown-item"
                      ><code>{{ item }}</code></a
                    >
                  </div>
                </div>
                <i class="ml-auto">
                  <img src="di-upload-document/assets/icons/question.svg" alt="" width="16" height="16" />
                </i>
              </div>
            </div>
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
} from '@/screens/data-ingestion/components/di-upload-document/entities/Enum.js';
import { Modal } from '@/shared/components/builder';
import { PreviewResponse, S3Job, S3SourceInfo } from '@core/data-ingestion';
import { Column, ColumnType } from '@core/common/domain';
import { DataSourceService } from '@core/common/services/DataSourceService';
import { TrackEvents } from '@core/tracking/enum/TrackEvents';
import { TrackingUtils } from '@core/tracking/TrackingUtils';
import { Log } from '@core/utils';
import { cloneDeep, toNumber } from 'lodash';
import { Inject } from 'typescript-ioc';
import { Component, Ref, Vue, Watch } from 'vue-property-decorator';

@Component({ components: { Modal } })
export default class S3PreviewTableModal extends Vue {
  private source: S3SourceInfo | null = null;

  private job: S3Job | null = null;

  private showModal = false;

  private loading = true;

  private error = '';

  private response: PreviewResponse | null = null;

  private callback: ((source: S3SourceInfo, job: S3Job) => void) | null = null;

  private onBack: (() => void) | null = null;

  @Inject
  private readonly dataSourceService!: DataSourceService;

  @Ref()
  private modal!: Modal;

  show(source: S3SourceInfo, job: S3Job, options?: { onCompleted?: (source: S3SourceInfo, job: S3Job) => void; onBack?: () => void }) {
    this.resetModal();
    this.source = cloneDeep(source);
    this.job = cloneDeep(job);
    this.callback = options?.onCompleted || null;
    this.onBack = options?.onBack || null;
    this.calcPreviewData();
    this.showModal = true;
  }

  private resetModal() {
    this.source = null;
    this.job = null;
    this.callback = null;
    this.callback = null;
    this.onBack = null;
    this.response = null;
    this.error = '';
    this.loading = false;
  }

  private handleNext() {
    if (this.callback) {
      this.callback(this.source!, this.job!);
    }
    this.showModal = false;
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

  private changeDelimiter(newDelimiter: string) {
    if (this.job?.fileConfig?.separator !== newDelimiter) {
      this.job!.fileConfig.separator = newDelimiter;
      this.calcPreviewData();
      TrackingUtils.track(TrackEvents.SelectSelectDelimiter, { type: newDelimiter });
    }
  }

  private async calcPreviewData() {
    this.loading = true;
    try {
      this.response = await this.dataSourceService.previewSchema(this.source!, this.job!);
      this.job?.setTableSchema(this.response.tableSchema);
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
      this.onBack();
    }
    this.showModal = false;
  }

  private get skipRowsOptions() {
    return Object.values(SKIP_ROWS);
  }

  private changeSkipRows(item: number) {
    if (this.job?.fileConfig.skipRows != item) {
      this.job!.fileConfig.skipRows = toNumber(item);
      this.calcPreviewData();
    }
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
}
</style>
