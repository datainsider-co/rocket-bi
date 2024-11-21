import '@/screens/data-ingestion/components/data-source-config-form/scss/Form.scss';
import { BFormInput } from 'bootstrap-vue';
import { DataSourceFormRender } from '@/screens/data-ingestion/form-builder/DataSourceFormRender';
import { DataSourceInfo } from '@core/data-ingestion/domain/data-source/DataSourceInfo';
import { BigQuerySourceInfoV2 } from '@core/data-ingestion/domain/data-source/BigQuerySourceInfoV2';
import { GA4SourceInfo } from '@core/data-ingestion/domain/data-source/GA4SourceInfo';
import { StringUtils } from '@/utils';
import { DIException } from '@core/common/domain';
import { Log } from '@core/utils';
import KeyDownEvent = JQuery.KeyDownEvent;

export class Ga4SourceFormRender implements DataSourceFormRender {
  private ga4SourceInfo: GA4SourceInfo;
  private onSubmit: (() => void) | null;

  constructor(ga4SourceInfo: GA4SourceInfo, onSubmit?: () => void) {
    this.ga4SourceInfo = ga4SourceInfo;
    this.onSubmit = onSubmit ?? null;
  }

  private get displayName() {
    return this.ga4SourceInfo.displayName;
  }

  private set displayName(value: string) {
    this.ga4SourceInfo.displayName = value;
  }

  private get accessToken() {
    return this.ga4SourceInfo.accessToken;
  }

  private set accessToken(value: string) {
    this.ga4SourceInfo.accessToken = value;
  }

  private get refreshToken() {
    return this.ga4SourceInfo.refreshToken;
  }

  private set refreshToken(value: string) {
    this.ga4SourceInfo.refreshToken = value;
  }

  renderForm(h: any): any {
    return (
      <div>
        <div class="form-item d-flex w-100 justify-content-center align-items-center">
          <div class="title">Display name:</div>
          <div class="input">
            <BFormInput
              id="input-display-name"
              placeholder="Input display name"
              autofocus
              autocomplete="off"
              v-model={this.displayName}
              onKeydown={(event: KeyDownEvent) => this.onKeyDown(event)}></BFormInput>
          </div>
        </div>
      </div>
    );
  }

  createDataSourceInfo(): DataSourceInfo {
    return GA4SourceInfo.fromObject(this.ga4SourceInfo);
  }
  validSource(source: GA4SourceInfo) {
    if (StringUtils.isEmpty(source.displayName)) {
      throw new DIException('Display name is required!');
    }
  }

  private onKeyDown(event: KeyDownEvent) {
    const isEnter = event.code === 'Enter';
    Log.debug('onKeyDown::', this.onSubmit);
    if (isEnter && this.onSubmit) {
      this.onSubmit();
    }
  }
}
