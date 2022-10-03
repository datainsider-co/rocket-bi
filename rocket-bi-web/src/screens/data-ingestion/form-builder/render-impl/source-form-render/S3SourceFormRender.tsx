import '@/screens/data-ingestion/components/data-source-config-form/scss/Form.scss';
import { SelectOption } from '@/shared';
import { S3Region, S3SourceInfo } from '@core/data-ingestion';
import { BFormInput } from 'bootstrap-vue';
import { DataSourceFormRender } from '@/screens/data-ingestion/form-builder/DataSourceFormRender';
import { DataSourceInfo } from '@core/data-ingestion/domain/data-source/DataSourceInfo';
import DiDropdown from '@/shared/components/common/di-dropdown/DiDropdown.vue';

export class S3SourceFormRender implements DataSourceFormRender {
  private sourceInfo: S3SourceInfo;

  constructor(sourceInfo: S3SourceInfo) {
    this.sourceInfo = sourceInfo;
  }

  private get displayName() {
    return this.sourceInfo.displayName;
  }

  private set displayName(value: string) {
    this.sourceInfo.displayName = value;
  }

  private get awsAccessKeyId() {
    return this.sourceInfo.awsAccessKeyId;
  }

  private set awsAccessKeyId(value: string) {
    this.sourceInfo.awsAccessKeyId = value;
  }

  private get awsSecretAccessKey() {
    return this.sourceInfo.awsSecretAccessKey;
  }

  private set awsSecretAccessKey(value: string) {
    this.sourceInfo.awsSecretAccessKey = value;
  }

  private get region() {
    return this.sourceInfo.region;
  }

  private set region(value: S3Region) {
    this.sourceInfo.region = value;
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

  renderForm(h: any): any {
    return (
      <div>
        <div class="form-item d-flex w-100 justify-content-center align-items-center">
          <div class="title">Display name:</div>
          <div class="input">
            <BFormInput id="input-display-name" placeholder="Input display name" autocomplete="off" v-model={this.displayName}></BFormInput>
          </div>
        </div>
        <div class="form-item d-flex w-100 align-items-start">
          <div class="title mt-1">Access Key:</div>
          <div class="input">
            <BFormInput id="input-api-url" hide-track-value placeholder="Input access key" v-model={this.awsAccessKeyId}></BFormInput>
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
              v-model={this.awsSecretAccessKey}></BFormInput>
          </div>
        </div>
        <div class="form-item d-flex w-100 justify-content-center align-items-center">
          <div class="title">Region:</div>
          <div class="input">
            <DiDropdown
              id="select-region"
              labelProps="displayName"
              valueProps="id"
              appendAtRoot={true}
              data={this.regionOptions}
              v-model={this.region}></DiDropdown>
          </div>
        </div>
        <div class="form-item d-flex w-100 justify-content-center align-items-center">
          <div class="title">Region:</div>
          <div class="input">
            <DiDropdown
              id="select-region"
              labelProps="displayName"
              valueProps="id"
              appendAtRoot={true}
              data={this.regionOptions}
              v-model={this.region}></DiDropdown>
          </div>
        </div>
      </div>
    );
  }

  createDataSourceInfo(): DataSourceInfo {
    return S3SourceInfo.fromObject(this.sourceInfo);
  }
}
