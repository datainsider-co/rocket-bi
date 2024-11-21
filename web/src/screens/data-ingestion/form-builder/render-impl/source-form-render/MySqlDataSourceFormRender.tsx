import '@/screens/data-ingestion/components/data-source-config-form/scss/Form.scss';
import { BFormInput } from 'bootstrap-vue';
import { MySqlSourceInfo } from '@core/data-ingestion/domain/data-source/MySqlSourceInfo';
import { DataSourceFormRender } from '@/screens/data-ingestion/form-builder/DataSourceFormRender';
import { DataSourceInfo } from '@core/data-ingestion/domain/data-source/DataSourceInfo';
import { StringUtils } from '@/utils';
import { cloneDeep } from 'lodash';
import { DIException } from '@core/common/domain';

export class MySqlDataSourceFormRender implements DataSourceFormRender {
  private mySqlSourceInfo: MySqlSourceInfo;

  constructor(mySqlSourceInfo: MySqlSourceInfo) {
    this.mySqlSourceInfo = mySqlSourceInfo;
  }

  private get displayName() {
    return this.mySqlSourceInfo.displayName;
  }

  private set displayName(value: string) {
    this.mySqlSourceInfo.displayName = value;
  }

  private get host() {
    return this.mySqlSourceInfo.host;
  }

  private set host(value: string) {
    this.mySqlSourceInfo.host = value;
  }

  private get port() {
    return this.mySqlSourceInfo.port;
  }

  private set port(value: string) {
    this.mySqlSourceInfo.port = value;
  }

  private get username() {
    return this.mySqlSourceInfo.username;
  }

  private set username(value: string) {
    this.mySqlSourceInfo.username = value;
  }

  private get password() {
    return this.mySqlSourceInfo.password ?? '';
  }

  private set password(value: string) {
    this.mySqlSourceInfo.password = value;
  }

  renderForm(h: any): any {
    return (
      <vuescroll style="position: unset">
        <div style="max-height: 40vh">
          <div class="form-item d-flex w-100 justify-content-center align-items-center">
            <div class="title">Display name:</div>
            <div class="input">
              <BFormInput id="input-display-name" placeholder="Input display name" autocomplete="off" v-model={this.displayName}></BFormInput>
            </div>
          </div>
          <div class="form-item d-flex w-100 justify-content-center align-items-center">
            <div class="title">Host:</div>
            <div class="input">
              <BFormInput id="input-host" placeholder="Input host" autocomplete="off" trim v-model={this.host}></BFormInput>
            </div>
          </div>
          <div class="form-item d-flex w-100 justify-content-center align-items-center">
            <div class="title">Port:</div>
            <div class="input">
              <BFormInput id="input-port" placeholder="Input port" autocomplete="off" trim v-model={this.port}></BFormInput>
            </div>
          </div>
          <div class="form-item d-flex w-100 justify-content-center align-items-center">
            <div class="title">Username:</div>
            <div class="input">
              <BFormInput id="input-username" hide-track-value hide placeholder="Input username" autocomplete="off" trim v-model={this.username}></BFormInput>
            </div>
          </div>
          <div class="form-item d-flex w-100 justify-content-center align-items-center">
            <div class="title">Password:</div>
            <div class="input">
              <BFormInput id="input-password" hide-track-value placeholder="Input password" v-model={this.password} type="password"></BFormInput>
            </div>
          </div>
          {...this.renderUpdateExtraFields(h, this.mySqlSourceInfo)}
        </div>
      </vuescroll>
    );
  }

  private renderUpdateExtraFields(h: any, source: MySqlSourceInfo): any[] {
    const uiFields: any[] = [];
    for (const key in source.extraFields) {
      const displayKey = key;
      const placeHolder = `Input value of '${displayKey}'`;
      uiFields.push(
        <div class="form-item d-flex w-100 justify-content-center align-items-center">
          <div class="title single-line">{displayKey}</div>
          <div class="extra-input input">
            <BFormInput
              hide-track-value
              placeholder={placeHolder}
              value={source.extraFields[key]}
              onChange={(text: string) => this.onUpdateExtraFieldChange(key, text)}></BFormInput>
          </div>
          <i class="di-icon-delete btn-delete btn-icon-border" onClick={() => this.onDeleteExtraField(key)}></i>
        </div>
      );
    }
    return uiFields;
  }

  private onUpdateExtraFieldChange(key: string, newValue: string) {
    this.mySqlSourceInfo.extraFields[key] = newValue;
  }

  private onDeleteExtraField(key: string) {
    delete this.mySqlSourceInfo.extraFields[key];
    this.mySqlSourceInfo.extraFields = cloneDeep(this.mySqlSourceInfo.extraFields);
  }

  createDataSourceInfo(): DataSourceInfo {
    return MySqlSourceInfo.fromObject(this.mySqlSourceInfo);
  }
  validSource(source: MySqlSourceInfo) {
    if (StringUtils.isEmpty(source.displayName)) {
      throw new DIException('Display name is required!');
    }
    if (StringUtils.isEmpty(source.host)) {
      throw new DIException('Host is required!');
    }
    if (StringUtils.isEmpty(source.port)) {
      throw new DIException('Port is required!');
    }
    if (StringUtils.isEmpty(source.username)) {
      throw new DIException('Username is required!');
    }
  }
}
