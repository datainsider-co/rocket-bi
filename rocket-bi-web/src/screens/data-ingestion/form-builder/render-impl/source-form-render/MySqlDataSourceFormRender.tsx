import '@/screens/data-ingestion/components/data-source-config-form/scss/Form.scss';
import { BFormInput } from 'bootstrap-vue';
import { MySqlSourceInfo } from '@core/data-ingestion/domain/data-source/MySqlSourceInfo';
import { DataSourceFormRender } from '@/screens/data-ingestion/form-builder/DataSourceFormRender';
import { DataSourceInfo } from '@core/data-ingestion/domain/data-source/DataSourceInfo';

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
    return this.mySqlSourceInfo.password;
  }

  private set password(value: string) {
    this.mySqlSourceInfo.password = value;
  }

  renderForm(h: any): any {
    return (
      <div>
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
      </div>
    );
  }

  createDataSourceInfo(): DataSourceInfo {
    return MySqlSourceInfo.fromObject(this.mySqlSourceInfo);
  }
}
