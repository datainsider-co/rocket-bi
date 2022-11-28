import '@/screens/data-ingestion/components/data-source-config-form/scss/Form.scss';
import { BFormInput } from 'bootstrap-vue';
import { MySqlSourceInfo } from '@core/data-ingestion/domain/data-source/MySqlSourceInfo';
import { DataSourceFormRender } from '@/screens/data-ingestion/form-builder/DataSourceFormRender';
import { DataSourceInfo } from '@core/data-ingestion/domain/data-source/DataSourceInfo';
import DiButton from '@/shared/components/common/DiButton.vue';
import { Log, ObjectUtils } from '@core/utils';
import { StringUtils } from '@/utils';
import { cloneDeep } from 'lodash';

export class MySqlDataSourceFormRender implements DataSourceFormRender {
  private mySqlSourceInfo: MySqlSourceInfo;
  private errorNewKey: string;
  private newKey: string;
  private newValue: string;

  constructor(mySqlSourceInfo: MySqlSourceInfo) {
    this.mySqlSourceInfo = mySqlSourceInfo;
    this.errorNewKey = '';
    this.newKey = '';
    this.newValue = '';
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
    return this.mySqlSourceInfo.password;
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
          {this.renderNewExtraFields(h)}
          <div class="text-danger mt-1">{this.errorNewKey}</div>
        </div>
      </vuescroll>
    );
  }

  private renderUpdateExtraFields(h: any, source: MySqlSourceInfo): any[] {
    const uiFields: any[] = [];
    for (const key in source.extraFields) {
      const displayKey = StringUtils.camelToDisplayString(key);
      const placeHolder = `Input value of '${displayKey}'`;
      uiFields.push(
        <div class="form-item d-flex w-100 justify-content-center align-items-center">
          <div class="title">{displayKey}:</div>
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

  private renderNewExtraFields(h: any): any {
    return (
      <div class="form-item d-flex w-100 justify-content-center align-items-center">
        <div class="title new-extra-input input">
          <BFormInput hide-track-value placeholder="Input key" v-model={this.newKey} onChange={() => (this.errorNewKey = '')}></BFormInput>
        </div>
        <div class="extra-input input">
          <BFormInput hide-track-value placeholder="Input value" v-model={this.newValue}></BFormInput>
        </div>
        <i class="di-icon-add btn-add btn-icon-border" onClick={() => this.onAddNewField(this.newKey, this.newValue)}></i>
      </div>
    );
  }

  private onAddNewField(key: string, value: string) {
    const normalizeKey = StringUtils.toCamelCase(key);
    const isExistKey = this.mySqlSourceInfo.extraFields[normalizeKey] !== undefined;
    if (isExistKey) {
      this.errorNewKey = 'Key is exist!';
    } else {
      this.mySqlSourceInfo.extraFields[normalizeKey] = value;
      this.errorNewKey = '';
      this.newKey = '';
      this.newValue = '';
    }
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
}
