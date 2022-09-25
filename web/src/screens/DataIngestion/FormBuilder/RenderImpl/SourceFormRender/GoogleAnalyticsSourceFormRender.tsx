import '@/screens/DataIngestion/components/DataSourceConfigForm/scss/form.scss';
import { BFormInput } from 'bootstrap-vue';
import { DataSourceFormRender } from '@/screens/DataIngestion/FormBuilder/DataSourceFormRender';
import { DataSourceInfo } from '@core/DataIngestion/Domain/DataSource/DataSourceInfo';
import { GoogleAnalyticsSourceInfo } from '@core/DataIngestion/Domain/DataSource/GoogleAnalyticsSourceInfo';

export class GoogleAnalyticsSourceFormRender implements DataSourceFormRender {
  private googleAnalyticsSourceInfo: GoogleAnalyticsSourceInfo;

  constructor(googleAnalyticsSourceInfo: GoogleAnalyticsSourceInfo) {
    this.googleAnalyticsSourceInfo = googleAnalyticsSourceInfo;
  }

  private get displayName() {
    return this.googleAnalyticsSourceInfo.displayName;
  }

  private set displayName(value: string) {
    this.googleAnalyticsSourceInfo.displayName = value;
  }

  renderForm(h: any): any {
    return (
      <div>
        <div class="form-item d-flex w-100 justify-content-center align-items-center">
          <div class="title">Display name:</div>
          <div class="input">
            <BFormInput placeholder="Input display name" autocomplete="off" v-model={this.displayName}></BFormInput>
          </div>
        </div>
      </div>
    );
  }

  createDataSourceInfo(): DataSourceInfo {
    return GoogleAnalyticsSourceInfo.fromObject(this.googleAnalyticsSourceInfo);
  }
}
