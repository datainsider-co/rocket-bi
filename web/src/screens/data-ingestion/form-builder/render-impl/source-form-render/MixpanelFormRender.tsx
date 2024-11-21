import '@/screens/data-ingestion/components/data-source-config-form/scss/Form.scss';
import { DataSourceFormRender } from '@/screens/data-ingestion/form-builder/DataSourceFormRender';
import DiButtonGroup, { ButtonInfo } from '@/shared/components/common/DiButtonGroup.vue';
import { StringUtils } from '@/utils';
import { DIException } from '@core/common/domain';
import { HubspotSourceInfo, MixpanelRegion, MixpanelSourceInfo } from '@core/data-ingestion';
import { DataSourceInfo } from '@core/data-ingestion/domain/data-source/DataSourceInfo';
import { Log } from '@core/utils';
import { BFormInput } from 'bootstrap-vue';
import KeyDownEvent = JQuery.KeyDownEvent;

export class MixpanelFormRender implements DataSourceFormRender {
  private sourceInfo: MixpanelSourceInfo;
  private onSubmit: (() => void) | null;

  constructor(source: MixpanelSourceInfo, onSubmit?: () => void) {
    this.sourceInfo = source;
    this.onSubmit = onSubmit ?? null;
  }

  private get displayName() {
    return this.sourceInfo.displayName;
  }

  private set displayName(value: string) {
    this.sourceInfo.displayName = value;
  }

  private get accountUsername(): string {
    return this.sourceInfo.accountUsername;
  }

  private set accountUsername(value: string) {
    this.sourceInfo.accountUsername = value;
  }

  private get accountSecret(): string {
    return this.sourceInfo.accountSecret;
  }

  private set accountSecret(value: string) {
    this.sourceInfo.accountSecret = value;
  }

  private get timezone(): string {
    return this.sourceInfo.timezone;
  }

  private set timezone(value: string) {
    this.sourceInfo.timezone = value;
  }

  private get projectId(): string {
    return this.sourceInfo.projectId;
  }

  private set projectId(value: string) {
    this.sourceInfo.projectId = value;
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
          <div class="title">Username:</div>
          <div class="input">
            <BFormInput
              id="input-api-key"
              placeholder="Input account username"
              autocomplete="off"
              class="text-truncate"
              trim
              v-model={this.accountUsername}
              onKeydown={(event: KeyDownEvent) => this.onKeyDown(event)}></BFormInput>
          </div>
        </div>
        <div class="form-item d-flex w-100 justify-content-center align-items-center">
          <div class="title">Account secret:</div>
          <div class="input">
            <BFormInput
              id="input-api-key"
              placeholder="Input account secret"
              autocomplete="off"
              class="text-truncate"
              trim
              v-model={this.accountSecret}
              onKeydown={(event: KeyDownEvent) => this.onKeyDown(event)}></BFormInput>
          </div>
        </div>
        <div class="form-item d-flex w-100 justify-content-center align-items-center">
          <div class="title">Project Id:</div>
          <div class="input">
            <BFormInput
              id="input-api-key"
              placeholder="Input Project Id"
              autocomplete="off"
              class="text-truncate"
              trim
              v-model={this.projectId}
              onKeydown={(event: KeyDownEvent) => this.onKeyDown(event)}></BFormInput>
          </div>
        </div>
        <div class="form-item d-flex w-100 justify-content-center align-items-center">
          <div class="title">Timezone:</div>
          <div class="input">
            <BFormInput
              id="input-api-key"
              placeholder="Input timezone"
              autocomplete="off"
              class="text-truncate"
              trim
              v-model={this.timezone}
              onKeydown={(event: KeyDownEvent) => this.onKeyDown(event)}></BFormInput>
          </div>
        </div>
        <div class="form-item d-flex w-100 justify-content-center align-items-center">
          <div class="title">Region:</div>
          <div class="input">
            <DiButtonGroup buttons={this.buttonInfos} />
          </div>
        </div>
      </div>
    );
  }

  createDataSourceInfo(): DataSourceInfo {
    return MixpanelSourceInfo.fromObject(this.sourceInfo);
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

  private get buttonInfos(): ButtonInfo[] {
    return [
      {
        id: MixpanelRegion.US,
        displayName: 'US',
        isActive: this.sourceInfo.region === MixpanelRegion.US,
        onClick: () => (this.sourceInfo.region = MixpanelRegion.US)
      },
      {
        id: MixpanelRegion.EU,
        displayName: 'EU',
        isActive: this.sourceInfo.region === MixpanelRegion.EU,
        onClick: () => (this.sourceInfo.region = MixpanelRegion.EU)
      }
    ] as ButtonInfo[];
  }
}
