import '@/screens/data-ingestion/components/data-source-config-form/scss/Form.scss';
import { BFormInput } from 'bootstrap-vue';
import { MySqlSourceInfo } from '@core/data-ingestion/domain/data-source/MySqlSourceInfo';
import { DataSourceFormRender } from '@/screens/data-ingestion/form-builder/DataSourceFormRender';
import { DataSourceInfo } from '@core/data-ingestion/domain/data-source/DataSourceInfo';
import { StringUtils } from '@/utils';
import { cloneDeep } from 'lodash';
import { DIException } from '@core/common/domain';
import { PalexySourceInfo } from '@core/data-ingestion/domain/data-source/PalexySourceInfo';
import { Log } from '@core/utils';
import KeyDownEvent = JQuery.KeyDownEvent;

export class PalexySourceFormRender implements DataSourceFormRender {
  private sourceInfo: PalexySourceInfo;
  private onSubmit: (() => void) | null;

  constructor(sourceInfo: PalexySourceInfo, onSubmit?: () => void) {
    this.sourceInfo = sourceInfo;
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

  private onKeyDown(event: KeyDownEvent) {
    const isEnter = event.code === 'Enter';
    Log.debug('onKeyDown::', this.onSubmit);
    if (isEnter && this.onSubmit) {
      this.onSubmit();
    }
  }

  renderForm(h: any): any {
    return (
      <vuescroll style="position: unset">
        <div style="max-height: 40vh">
          <div class="form-item d-flex w-100 justify-content-center align-items-center">
            <div class="title">Display name:</div>
            <div class="input">
              <BFormInput
                autofocus
                id="input-display-name"
                placeholder="Input display name"
                autocomplete="off"
                class="text-truncate"
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
      </vuescroll>
    );
  }

  createDataSourceInfo(): DataSourceInfo {
    return PalexySourceInfo.fromObject(this.sourceInfo);
  }
  validSource(source: PalexySourceInfo) {
    Log.debug('PalexySourceFormRender::validSource::');
    if (StringUtils.isEmpty(source.displayName)) {
      throw new DIException('Display name is required!');
    }
    if (StringUtils.isEmpty(source.apiKey)) {
      throw new DIException('API key is required!');
    }
  }
}
