import '@/screens/data-ingestion/components/data-source-config-form/scss/Form.scss';
import { BFormInput } from 'bootstrap-vue';
import { DataSourceFormRender } from '@/screens/data-ingestion/form-builder/DataSourceFormRender';
import { DataSourceInfo } from '@core/data-ingestion/domain/data-source/DataSourceInfo';
import { StringUtils } from '@/utils';
import { DIException } from '@core/common/domain';
import { GASourceInfo } from '@core/data-ingestion/domain/data-source/GASourceInfo';
import KeyDownEvent = JQuery.KeyDownEvent;
import { Log } from '@core/utils';

export class GoogleAnalyticsSourceFormRender implements DataSourceFormRender {
  private googleAnalyticsSourceInfo: GASourceInfo;
  private onSubmit: (() => void) | null;

  constructor(googleAnalyticsSourceInfo: GASourceInfo, onSubmit?: () => void) {
    this.googleAnalyticsSourceInfo = googleAnalyticsSourceInfo;
    this.onSubmit = onSubmit ?? null;
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
            <BFormInput
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
    return GASourceInfo.fromObject(this.googleAnalyticsSourceInfo);
  }
  validSource(source: GASourceInfo) {
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
