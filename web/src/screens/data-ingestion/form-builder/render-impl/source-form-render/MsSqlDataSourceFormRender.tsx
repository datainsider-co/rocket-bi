import '@/screens/data-ingestion/components/data-source-config-form/scss/Form.scss';
import { BFormInput } from 'bootstrap-vue';
import { MSSqlSourceInfo } from '@core/data-ingestion/domain/data-source/MSSqlSourceInfo';
import { DataSourceFormRender } from '@/screens/data-ingestion/form-builder/DataSourceFormRender';
import { DataSourceInfo } from '@core/data-ingestion/domain/data-source/DataSourceInfo';
import { StringUtils } from '@/utils';
import { DIException } from '@core/common/domain';

export class MsSqlDataSourceFormRender implements DataSourceFormRender {
  private mySqlSourceInfo: MSSqlSourceInfo;

  constructor(mySqlSourceInfo: MSSqlSourceInfo) {
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

  private get databaseName() {
    return this.mySqlSourceInfo.databaseName;
  }

  private set databaseName(value: string) {
    this.mySqlSourceInfo.databaseName = value;
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
          <div class="title">Database name:</div>
          <div class="input">
            <BFormInput id="input-database-name" placeholder="Input database name" autocomplete="off" trim v-model={this.databaseName}></BFormInput>
          </div>
        </div>
        <div class="form-item d-flex w-100 justify-content-center align-items-center">
          <div class="title">Username:</div>
          <div class="input">
            <BFormInput id="input-username" hide-track-value placeholder="Input username" autocomplete="off" trim v-model={this.username}></BFormInput>
          </div>
        </div>
        <div class="form-item d-flex w-100 justify-content-center align-items-center">
          <div class="title">Password:</div>
          <div class="input">
            <BFormInput id="input-password" hide-track-value v-model={this.password} placeholder="Input password" type="password"></BFormInput>
          </div>
        </div>
      </div>
    );
  }

  createDataSourceInfo(): DataSourceInfo {
    return MSSqlSourceInfo.fromObject(this.mySqlSourceInfo);
  }
  validSource(source: MSSqlSourceInfo) {
    if (StringUtils.isEmpty(source.displayName)) {
      throw new DIException('Display name is required!');
    }
    if (StringUtils.isEmpty(source.host)) {
      throw new DIException('Host is required!');
    }
    if (StringUtils.isEmpty(source.port)) {
      throw new DIException('Port is required!');
    }
    if (StringUtils.isEmpty(source.databaseName)) {
      throw new DIException('Database is required!');
    }
    if (StringUtils.isEmpty(source.username)) {
      throw new DIException('Username is required!');
    }
  }
}
