import '@/screens/data-ingestion/components/data-source-config-form/scss/Form.scss';
import { BFormInput } from 'bootstrap-vue';
import { DataSourceFormRender } from '@/screens/data-ingestion/form-builder/DataSourceFormRender';
import { DataSourceInfo } from '@core/data-ingestion/domain/data-source/DataSourceInfo';
import { GoogleAdsSourceInfo } from '@core/data-ingestion';
import KeyDownEvent = JQuery.KeyDownEvent;
import { Log } from '@core/utils';
import { StringUtils } from '@/utils';
import { DIException } from '@core/common/domain';

export class GoogleAdsSourceFormRender implements DataSourceFormRender {
  private sourceInfo: GoogleAdsSourceInfo;
  private onSubmit: (() => void) | null;

  constructor(ga4SourceInfo: GoogleAdsSourceInfo, onSubmit?: () => void) {
    this.sourceInfo = ga4SourceInfo;
    this.onSubmit = onSubmit ?? null;
  }

  private get displayName() {
    return this.sourceInfo.displayName;
  }

  private set displayName(value: string) {
    this.sourceInfo.displayName = value;
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
              autofocus={true}
              onKeydown={(event: KeyDownEvent) => this.onKeyDown(event)}
              autocomplete="off"
              v-model={this.displayName}></BFormInput>
          </div>
        </div>
      </div>
    );
  }

  private onKeyDown(event: KeyDownEvent) {
    const isEnter = event.code === 'Enter';
    Log.debug('onKeyDown::', this.onSubmit);
    if (isEnter && this.onSubmit) {
      this.onSubmit();
    }
  }

  createDataSourceInfo(): DataSourceInfo {
    return GoogleAdsSourceInfo.fromObject(this.sourceInfo);
  }

  validSource(source: GoogleAdsSourceInfo) {
    if (StringUtils.isEmpty(source.displayName)) {
      throw new DIException('Display name is required!');
    }
  }
}
