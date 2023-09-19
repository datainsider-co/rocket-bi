<template>
  <DiCustomModal id="streaming-job-details" ref="modal" title="Streaming Job Details" @hidden="reset" hide-footer>
    <div class="streaming-detail-info-container">
      <StatusWidget :status="status" :error="errorMessage">
        <div v-if="job && jobDetails" class="streaming-detail-info">
          <div class="detail-info-left">
            <div class="detail-info">
              <div class="detail-info-label">Job Name:</div>
              <div class="detail-info-value text-truncate" :title="job.name">{{ job.name }}</div>
            </div>
            <div class="detail-info">
              <div class="detail-info-label">Job Type:</div>
              <div class="detail-info-value text-truncate" title="kafka">Kafka</div>
            </div>
            <div class="detail-info">
              <div class="detail-info-label">Topic:</div>
              <div class="detail-info-value text-truncate" :title="jobDetails.topic">{{ jobDetails.topic }}</div>
            </div>
            <div class="detail-info">
              <div class="detail-info-label">Total Messages:</div>
              <div class="detail-info-value text-truncate" :title="formatNumber(jobDetails.totalMessages)">{{ formatNumber(jobDetails.totalMessages) }}</div>
            </div>
            <div class="detail-info">
              <div class="detail-info-label">Total Errors:</div>
              <div class="detail-info-value text-truncate" :title="formatNumber(jobDetails.totalErrors)">{{ formatNumber(jobDetails.totalErrors) }}</div>
            </div>
            <!--          <div class="detail-info">-->
            <!--            <div class="detail-info-label">Message:</div>-->
            <!--            <div class="detail-info-value message" :title="job.message">{{ job.message || '&#45;&#45;' }}</div>-->
            <!--          </div>-->
          </div>
          <div class="detail-info-right">
            <div class="detail-info d-flex align-items-center">
              <div class="detail-info-label">Created Time:</div>
              <div class="detail-info-value d-flex align-items-center" :title="formatDateTime(job.createdAt)">
                {{ formatDateTime(job.createdAt) }}
              </div>
            </div>
            <div class="detail-info d-flex align-items-center">
              <div class="detail-info-label">Updated Time:</div>
              <div class="detail-info-value d-flex align-items-center" :title="formatDateTime(job.updatedAt)">
                {{ formatDateTime(job.updatedAt) }}
              </div>
            </div>
            <div v-for="(offset, index) in jobDetails.offsets" :key="index" class="detail-info d-flex align-items-center">
              <div class="detail-info-label">Partition:</div>
              <div style="width: 80px" class="detail-info-value d-flex align-items-center mr-2" :title="formatNumber(offset.partition)">
                <div class="text-truncate">{{ formatNumber(offset.partition) }}</div>
              </div>

              <div class="detail-info-label">Offset:</div>
              <div class="detail-info-value d-flex align-items-center" :title="formatNumber(offset.offset)">
                {{ formatNumber(offset.offset) }}
              </div>
            </div>
          </div>
        </div>
      </StatusWidget>
    </div>
  </DiCustomModal>
</template>
<script lang="ts">
import { Component, Ref, Vue } from 'vue-property-decorator';
import DiCustomModal from '@/shared/components/DiCustomModal.vue';
import vuescroll from 'vuescroll';
import { DateTimeUtils } from '@/utils';
import { Log } from '@core/utils/Log';
import Highcharts from 'highcharts';
import { KafkaStreamingJob, StreamingJobService, StreamingStatusResponse } from '@core/data-ingestion';
import { Status } from '@/shared';
import { Inject } from 'typescript-ioc';
import { DIException } from '@core/common/domain';
import StatusWidget from '@/shared/components/StatusWidget.vue';

@Component({
  components: {
    DiCustomModal,
    vuescroll,
    StatusWidget
  }
})
export default class StreamingJobDetailsModal extends Vue {
  private job: KafkaStreamingJob | null = null;
  private status: Status = Status.Loaded;
  private errorMessage = '';
  private jobDetails: StreamingStatusResponse | null = null;

  @Ref()
  private readonly modal!: DiCustomModal;

  @Inject
  private readonly streamingJobService!: StreamingJobService;

  show(job: KafkaStreamingJob) {
    this.job = job;
    this.modal.show();
    this.handleLoadJobInfo(job);
  }

  private showLoaded() {
    this.status = Status.Loaded;
  }

  private showLoading() {
    this.status = Status.Loading;
  }

  private showError(message: string) {
    this.status = Status.Error;
    this.errorMessage = message;
  }

  private async handleLoadJobInfo(job: KafkaStreamingJob) {
    try {
      this.showLoading();
      this.jobDetails = await this.streamingJobService.getInfo(job.id);
      this.showLoaded();
    } catch (e) {
      const ex = DIException.fromObject(e);
      Log.error('StreamingJobDetailsModal::handleLoadJobInfo::error::', e);
      this.showError(ex.getPrettyMessage());
    }
  }

  reset() {
    this.job = null;
    this.jobDetails = null;
  }

  private formatDateTime(data: any): any {
    try {
      return DateTimeUtils.formatAsDDMMYYYYHms(data);
    } catch (error) {
      return data;
    }
  }

  private formatNumber(number?: number) {
    return Highcharts.numberFormat(number ?? 0, 0);
  }
}
</script>
<style lang="scss">
#streaming-job-details {
  .modal-lg {
    max-height: fit-content;
    max-width: 85%;
    width: fit-content;
    min-width: 700px;
  }

  .streaming-detail-info-container {
    .chart-error {
      height: 150px !important;
    }

    .streaming-detail-info {
      padding: 16px;
      display: flex;
      border-radius: 4px;
      background: var(--primary);

      .detail-info-right {
        width: 50%;
      }

      .detail-info-left {
        width: 50%;
        padding-right: 16px;
      }

      .detail-info-left,
      .detail-info-right {
        padding-right: 16px;
        .detail-info {
          display: flex;

          &-label {
            line-height: 1;
            white-space: nowrap;
            font-weight: 500;
          }

          &-value {
            padding-left: 8px;
            line-height: 1;
            img {
              margin-right: 4px;
            }
          }

          &:not(:last-child) {
            padding-bottom: 12px;
          }

          &-value.message {
            line-height: 18px;

            display: -webkit-box;
            -webkit-line-clamp: 6;
            -webkit-box-orient: vertical;
            overflow: hidden;
            text-overflow: ellipsis;
          }
        }
      }
    }

    .difference-detail-info {
      display: flex;
      align-items: center;
      margin-top: 16px;

      .difference-detail-info-left {
        padding-right: 8px;
      }
      .difference-detail-info-right {
        padding-left: 8px;
      }
      .difference-detail-info-left,
      .difference-detail-info-right {
        max-width: 50%;
        max-height: 400px;
        &-title {
          font-weight: 500;
          margin-bottom: 8px;
        }

        .left-scroll-body,
        .right-scroll-body {
          max-width: 100%;
          max-height: calc(400px - 29px);
        }
      }
    }
  }
}
</style>
