import '@/screens/DataIngestion/components/DataSourceConfigForm/scss/form.scss';
import { BFormInput } from 'bootstrap-vue';
import { MySqlSourceInfo } from '@core/DataIngestion/Domain/DataSource/MySqlSourceInfo';
import { DataSourceFormRender } from '@/screens/DataIngestion/FormBuilder/DataSourceFormRender';
import { DataSourceInfo } from '@core/DataIngestion/Domain/DataSource/DataSourceInfo';
import { RedshiftSourceInfo } from '@core/DataIngestion/Domain/DataSource/RedshiftSourceInfo';

export class RedshiftDataSourceFormRender implements DataSourceFormRender {
  private redshiftSourceInfo: RedshiftSourceInfo;

  constructor(redshiftSourceInfo: RedshiftSourceInfo) {
    this.redshiftSourceInfo = redshiftSourceInfo;
  }

  private get displayName() {
    return this.redshiftSourceInfo.displayName;
  }

  private set displayName(value: string) {
    this.redshiftSourceInfo.displayName = value;
  }

  private get host() {
    return this.redshiftSourceInfo.host;
  }

  private set host(value: string) {
    this.redshiftSourceInfo.host = value;
  }

  private get port() {
    return this.redshiftSourceInfo.port;
  }

  private set port(value: string) {
    this.redshiftSourceInfo.port = value;
  }

  private get databaseName() {
    return this.redshiftSourceInfo.databaseName;
  }

  private set databaseName(value: string) {
    this.redshiftSourceInfo.databaseName = value;
  }

  private get username() {
    return this.redshiftSourceInfo.username;
  }

  private set username(value: string) {
    this.redshiftSourceInfo.username = value;
  }
  private get password() {
    return this.redshiftSourceInfo.password;
  }

  private set password(value: string) {
    this.redshiftSourceInfo.password = value;
  }

  renderForm(h: any): any {
    return (
      <div>
        <div class="form-item d-flex w-100 justify-content-center align-items-center">
          <div class="title">Display name:</div>
          <div class="input">
            <BFormInput placeholder="Input display name" autocomplete="off" v-model={this.displayName}></BFormInput>
          </div>
        </div>
        <div class="form-item d-flex w-100 justify-content-center align-items-center">
          <div class="title">Host:</div>
          <div class="input">
            <BFormInput placeholder="Input host" autocomplete="off" trim v-model={this.host}></BFormInput>
          </div>
        </div>
        <div class="form-item d-flex w-100 justify-content-center align-items-center">
          <div class="title">Port:</div>
          <div class="input">
            <BFormInput placeholder="Input port" autocomplete="off" trim v-model={this.port}></BFormInput>
          </div>
        </div>
        <div class="form-item d-flex w-100 justify-content-center align-items-center">
          <div class="title">Database name:</div>
          <div class="input">
            <BFormInput placeholder="Input database name" autocomplete="off" trim v-model={this.databaseName}></BFormInput>
          </div>
        </div>
        <div class="form-item d-flex w-100 justify-content-center align-items-center">
          <div class="title">Username:</div>
          <div class="input">
            <BFormInput placeholder="Input username" hide-track-value autocomplete="off" trim v-model={this.username}></BFormInput>
          </div>
        </div>
        <div class="form-item d-flex w-100 justify-content-center align-items-center">
          <div class="title">Password:</div>
          <div class="input">
            <BFormInput placeholder="Input password" hide-track-value v-model={this.password} type="password"></BFormInput>
          </div>
        </div>
      </div>
    );
  }

  createDataSourceInfo(): DataSourceInfo {
    return RedshiftSourceInfo.fromObject(this.redshiftSourceInfo);
  }
}
