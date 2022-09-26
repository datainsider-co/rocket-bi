<template>
  <BModal v-model="isShowSync" class="position-relative" :ok-title="title" centered size="lg" :hide-header="true" @ok="handleSubmit" @hide="onHide">
    <img class="btn-close btn-ghost position-absolute" src="@/assets/icon/ic_close.svg" alt="" @click="closeModal" />
    <div class="modal-title text-center">DataSource Config</div>
    <div class="modal-sub-title text-center">Config information of DataSource</div>

    <div class="d-flex flex-column justify-content-center" v-if="source">
      <div>
        <div class="form-item d-flex w-100 justify-content-center align-items-center">
          <div class="title">Display name:</div>
          <div class="input">
            <BFormInput id="input-display-name" placeholder="Input display name" autocomplete="off" v-model="source.displayName"></BFormInput>
          </div>
        </div>
        <div class="form-item d-flex w-100 align-items-center">
          <div class="title mt-1">Access Key:</div>
          <div class="input">
            <BFormInput id="input-api-url" hide-track-value placeholder="Input access key" v-model="source.awsAccessKeyId"></BFormInput>
          </div>
        </div>
        <div class="form-item d-flex w-100 justify-content-center align-items-center">
          <div class="title">Secret Key:</div>
          <div class="input">
            <BFormInput
              id="input-access-token"
              hide-track-value
              placeholder="Input secret key"
              autocomplete="off"
              trim
              v-model="source.awsSecretAccessKey"
            ></BFormInput>
          </div>
        </div>
        <div class="form-item d-flex w-100 justify-content-center align-items-center">
          <div class="title">Region:</div>
          <div class="input">
            <DiDropdown
              id="select-region"
              labelProps="displayName"
              valueProps="id"
              :appendAtRoot="true"
              :data="regionOptions"
              v-model="source.region"
            ></DiDropdown>
          </div>
        </div>
        <div class="d-flex form-item w-100 justify-content-center align-items-center">
          <div class="title"></div>
          <div class="input test-connection d-flex justify-content-between">
            <div class="p-0 text-center">
              <BSpinner v-if="isLoading" small class="text-center"></BSpinner>
              <div v-if="error" class="text-right">{{ error }}</div>
            </div>
          </div>
        </div>
      </div>
    </div>
    <template #modal-footer>
      <div class="custom-footer d-flex col-12 p-0 m-0 mr-1">
        <DiButton id="button-submit" class="ml-auto button-add btn-primary col-6" :title="title" @click="handleSubmit"></DiButton>
      </div>
    </template>
  </BModal>
</template>

<script lang="ts">
import { DataSourceModule } from '@/screens/DataIngestion/store/DataSourceStore';
import { SelectOption } from '@/shared';
import { FormMode, S3Job, S3Region, S3SourceInfo } from '@core/DataIngestion';
import { DIException } from '@core/domain';
import { TrackEvents } from '@core/tracking/enum/TrackEvents';
import { TrackingUtils } from '@core/tracking/TrackingUtils';
import { Log } from '@core/utils';
import { cloneDeep } from 'lodash';
import { Component, Vue } from 'vue-property-decorator';

@Component({ components: {} })
export default class S3SourceInfoConfigModal extends Vue {
  private isShowSync = false;
  private action: FormMode = FormMode.Create;
  private source: S3SourceInfo | null = null;
  private callback: ((source: S3SourceInfo) => void) | null = null;
  private error = '';
  private isLoading = false;

  show(source: S3SourceInfo, options?: { action?: FormMode; onCompleted?: (source: S3SourceInfo) => void }) {
    this.source = cloneDeep(source);
    this.action = options?.action || FormMode.Create;
    this.callback = options?.onCompleted || null;
    this.isShowSync = true;
  }

  closeModal() {
    this.isShowSync = false;
  }

  private get title(): string {
    return this.action === FormMode.Create ? 'Add' : 'Update';
  }

  private onHide() {
    this.action = FormMode.Create;
    this.callback = null;
    this.source = null;
  }

  private async handleSubmit() {
    try {
      this.error = '';
      this.validSource(this.source);
      this.isLoading = true;
      const sourceInfo = await this.submitSource(this.source!, this.action);
      this.isLoading = false;
      if (this.callback) {
        this.callback(sourceInfo);
      }
      this.isShowSync = false;
    } catch (e) {
      this.error = e.message;
      Log.error(e);
    }
  }

  private validSource(source: S3SourceInfo | null | undefined) {
    if (!source?.displayName) {
      throw new DIException('Display must be not empty!');
    }
    if (!source?.awsAccessKeyId) {
      throw new DIException('Access key must be not empty!');
    }
    if (!source.awsSecretAccessKey) {
      throw new DIException('Secret key must be not empty!');
    }
  }

  private validJob(job: S3Job | null | undefined) {
    if (!job?.bucketName) {
      throw new DIException('Bucket name must be not empty!');
    }
  }

  private async submitSource(source: S3SourceInfo, action: FormMode): Promise<S3SourceInfo> {
    switch (action) {
      case FormMode.Edit: {
        TrackingUtils.track(TrackEvents.DataSourceSubmitEdit, {
          source_id: source.id,
          source_type: source.sourceType,
          source_name: source.getDisplayName()
        });
        const success = await DataSourceModule.editDataSource(source);
        if (!success) {
          throw new DIException('Update data source failed!');
        }
        return source;
      }
      case FormMode.Create: {
        {
          TrackingUtils.track(TrackEvents.DataSourceSubmitCreate, {
            source_type: source.sourceType,
            source_name: source.getDisplayName()
          });
          return (await DataSourceModule.createDataSource(source)) as S3SourceInfo;
        }
      }
      default:
        throw new DIException(`Unsupported DataSourceConfigMode ${action}`);
    }
  }

  private get regionOptions(): SelectOption[] {
    return [
      { id: S3Region.GovCloud, displayName: 'us-gov-west-1' },
      { id: S3Region.US_GOV_EAST_1, displayName: 'us-gov-east-1' },
      { id: S3Region.US_EAST_1, displayName: 'us-east-1' },
      { id: S3Region.US_EAST_2, displayName: 'us-east-2' },
      { id: S3Region.US_WEST_1, displayName: 'us-west-1' },
      { id: S3Region.US_WEST_2, displayName: 'us-west-2' },
      { id: S3Region.EU_WEST_1, displayName: 'eu-west-1' },
      { id: S3Region.EU_WEST_2, displayName: 'eu-west-2' },
      { id: S3Region.EU_WEST_3, displayName: 'eu-west-3' },
      { id: S3Region.EU_CENTRAL_1, displayName: 'eu-central-1' },
      { id: S3Region.EU_NORTH_1, displayName: 'eu-north-1' },
      { id: S3Region.EU_SOUTH_1, displayName: 'eu-south-1' },
      { id: S3Region.AP_EAST_1, displayName: 'ap-east-1' },
      { id: S3Region.AP_SOUTH_1, displayName: 'ap-south-1' },
      { id: S3Region.AP_SOUTHEAST_1, displayName: 'ap-southeast-1' },
      { id: S3Region.AP_SOUTHEAST_2, displayName: 'ap-southeast-2' },
      { id: S3Region.AP_SOUTHEAST_3, displayName: 'ap-southeast-3' },
      { id: S3Region.AP_NORTHEAST_1, displayName: 'ap-northeast-1' },
      { id: S3Region.AP_NORTHEAST_2, displayName: 'ap-northeast-2' },
      { id: S3Region.AP_NORTHEAST_3, displayName: 'ap-northeast-3' },
      { id: S3Region.SA_EAST_1, displayName: 'sa-east-1' },
      { id: S3Region.CN_NORTH_1, displayName: 'cn-north-1' },
      { id: S3Region.CN_NORTHWEST_1, displayName: 'cn-northwest-1' },
      { id: S3Region.CA_CENTRAL_1, displayName: 'ca-central-1' },
      { id: S3Region.ME_SOUTH_1, displayName: 'me-south-1' },
      { id: S3Region.AF_SOUTH_1, displayName: 'af-south-1' },
      { id: S3Region.US_ISO_EAST_1, displayName: 'us-iso-east-1' },
      { id: S3Region.US_ISOB_EAST_1, displayName: 'us-isob-east-1' },
      { id: S3Region.US_ISO_WEST_1, displayName: 'us-iso-west-1' }
    ];
  }
}
</script>

<style lang="scss" scoped>
@import '~@/themes/scss/mixin.scss';

.modal-title {
  font-size: 16px;
  padding: 10px 25px 8px 25px;
  line-height: 1.5;
  letter-spacing: 0.4px;
  font-weight: 500;
  color: var(--text-color);
}

.modal-sub-title {
  font-size: 16px;
  line-height: 1.5;
  letter-spacing: 0.4px;
  padding-bottom: 32px;
  color: var(--secondary-text-color);
}

.btn-close {
  top: 12px;
  right: 12px;

  .title {
    width: 0;
  }
}

.test-connection {
  height: 21px;
}

.form-item {
  display: flex;
  justify-content: center;
  align-items: center;
  width: 450px;
  //class="item d-flex w-100 justify-content-center align-items-center"
  margin-top: 16px;

  .title {
    width: 110px;
  }

  .input {
    width: 350px;

    input {
      padding-left: 16px;
      cursor: text !important;
    }
  }

  .text-connection {
    color: var(--accent);
  }
}

.status-error {
  color: var(--warning);
}

.status-success {
  color: var(--success);
}

.form-item + .form-item {
  margin-top: 16px;
}

::v-deep {
  .modal-dialog {
    max-width: fit-content;
  }

  .modal-body {
    padding: 24px 24px 8px;
  }

  .modal-footer {
    width: 394px;
    padding: 8px 24px 24px 24px;
    margin-left: auto;
    display: flex;
    @media (max-width: 500px) {
      width: 100%;
    }

    .button-test {
      justify-content: center;
      height: 42px;

      .title {
        width: fit-content;
        color: var(--accent);
      }
    }

    .button-add {
      height: 42px;
      margin-left: 6px;
    }
  }
}
</style>
