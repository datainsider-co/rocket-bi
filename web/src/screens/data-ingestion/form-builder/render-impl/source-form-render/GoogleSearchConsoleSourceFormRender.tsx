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
import { GoogleSearchConsoleSourceInfo } from '@core/data-ingestion/domain/data-source/GoogleSearchConsoleSourceInfo';

export class GoogleSearchConsoleSourceFormRender implements DataSourceFormRender {
  private sourceInfo: GoogleSearchConsoleSourceInfo;
  private onSubmit: (() => void) | null;

  constructor(googleSearchConsoleSourceInfo: GoogleSearchConsoleSourceInfo, onSubmit?: () => void) {
    this.sourceInfo = googleSearchConsoleSourceInfo;
    this.onSubmit = onSubmit ?? null;
  }

  private get displayName() {
    return this.sourceInfo.displayName;
  }

  private set displayName(value: string) {
    this.sourceInfo.displayName = value;
  }

  private get accessToken() {
    return this.sourceInfo.accessToken;
  }

  private set accessToken(value: string) {
    this.sourceInfo.accessToken = value;
  }

  private get refreshToken() {
    return this.sourceInfo.refreshToken;
  }

  private set refreshToken(value: string) {
    this.sourceInfo.refreshToken = value;
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
    return GoogleSearchConsoleSourceInfo.fromObject(this.sourceInfo);
  }
  validSource(source: GoogleSearchConsoleSourceInfo) {
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
