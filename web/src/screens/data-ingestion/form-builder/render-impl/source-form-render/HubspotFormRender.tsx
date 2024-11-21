import '@/screens/data-ingestion/components/data-source-config-form/scss/Form.scss';
import { BFormInput } from 'bootstrap-vue';
import { DataSourceFormRender } from '@/screens/data-ingestion/form-builder/DataSourceFormRender';
import { DataSourceInfo } from '@core/data-ingestion/domain/data-source/DataSourceInfo';
import { StringUtils } from '@/utils';
import { DIException } from '@core/common/domain';
import { Log } from '@core/utils';
import { HubspotSourceInfo } from '@core/data-ingestion';
import KeyDownEvent = JQuery.KeyDownEvent;

export class HubspotFormRender implements DataSourceFormRender {
  private sourceInfo: HubspotSourceInfo;
  private onSubmit: (() => void) | null;

  constructor(source: HubspotSourceInfo, onSubmit?: () => void) {
    this.sourceInfo = source;
    this.onSubmit = onSubmit ?? null;
  }

  private get displayName() {
    return this.sourceInfo.displayName;
  }

  private set displayName(value: string) {
    this.sourceInfo.displayName = value;
  }

  private get apiKey() {
    return this.sourceInfo.apiKey;
  }

  private set apiKey(value: string) {
    this.sourceInfo.apiKey = value;
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
        <div class="form-item d-flex w-100 justify-content-center align-items-center">
          <div class="title">API key:</div>
          <div class="input">
            <BFormInput
              id="input-api-key"
              placeholder="Input API key"
              autocomplete="off"
              class="text-truncate"
              trim
              v-model={this.apiKey}
              onKeydown={(event: KeyDownEvent) => this.onKeyDown(event)}></BFormInput>
          </div>
        </div>
      </div>
    );
  }

  createDataSourceInfo(): DataSourceInfo {
    return HubspotSourceInfo.fromObject(this.sourceInfo);
  }
  validSource(source: HubspotSourceInfo) {
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
