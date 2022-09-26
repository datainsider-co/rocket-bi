import '@/screens/DataIngestion/components/DataSourceConfigForm/scss/form.scss';
import { BFormInput, BFormTextarea } from 'bootstrap-vue';
import { DataSourceFormRender } from '@/screens/DataIngestion/FormBuilder/DataSourceFormRender';
import { DataSourceInfo } from '@core/DataIngestion/Domain/DataSource/DataSourceInfo';
import { BigQuerySourceInfo } from '@core/DataIngestion/Domain/DataSource/BigQuerySourceInfo';
import { BigQuerySourceInfoV2 } from '@core/DataIngestion/Domain/DataSource/BigQuerySourceInfoV2';

export class BigQueryDataSourceFormRender implements DataSourceFormRender {
  private bigQuerySourceInfo: BigQuerySourceInfoV2;

  constructor(bigQuerySourceInfo: BigQuerySourceInfoV2) {
    this.bigQuerySourceInfo = bigQuerySourceInfo;
  }

  private get displayName() {
    return this.bigQuerySourceInfo.displayName;
  }

  private set displayName(value: string) {
    this.bigQuerySourceInfo.displayName = value;
  }

  private get password() {
    return this.bigQuerySourceInfo.credential;
  }

  private set password(value: string) {
    this.bigQuerySourceInfo.credential = value;
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
          <div class="title">Service account key:</div>
          <div class="input">
            <BFormTextarea id="service-account-key" hide-track-value placeholder="Input service account key" v-model={this.password}></BFormTextarea>
          </div>
        </div>
      </div>
    );
  }

  createDataSourceInfo(): DataSourceInfo {
    return BigQuerySourceInfoV2.fromObject(this.bigQuerySourceInfo);
  }
}
