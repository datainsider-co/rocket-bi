import '@/screens/data-ingestion/components/data-source-config-form/scss/Form.scss';
import { BFormInput } from 'bootstrap-vue';
import { DataSourceFormRender } from '@/screens/data-ingestion/form-builder/DataSourceFormRender';
import { DataSourceInfo } from '@core/data-ingestion/domain/data-source/DataSourceInfo';
import { PostgreSqlSourceInfo } from '@core/data-ingestion/domain/data-source/PostgreSqlSourceInfo';
import { StringUtils } from '@/utils';
import { DIException } from '@core/common/domain';

export class PostgreSqlDataSourceFormRender implements DataSourceFormRender {
  private postgreSqlSourceInfo: PostgreSqlSourceInfo;

  constructor(postgreSqlSourceInfo: PostgreSqlSourceInfo) {
    this.postgreSqlSourceInfo = postgreSqlSourceInfo;
  }

  private get displayName() {
    return this.postgreSqlSourceInfo.displayName;
  }

  private set displayName(value: string) {
    this.postgreSqlSourceInfo.displayName = value;
  }

  private get host() {
    return this.postgreSqlSourceInfo.host;
  }

  private set host(value: string) {
    this.postgreSqlSourceInfo.host = value;
  }

  private get port() {
    return this.postgreSqlSourceInfo.port;
  }

  private set port(value: string) {
    this.postgreSqlSourceInfo.port = value;
  }

  private get databaseName() {
    return this.postgreSqlSourceInfo.databaseName;
  }

  private set databaseName(value: string) {
    this.postgreSqlSourceInfo.databaseName = value;
  }

  private get username() {
    return this.postgreSqlSourceInfo.username;
  }

  private set username(value: string) {
    this.postgreSqlSourceInfo.username = value;
  }
  private get password() {
    return this.postgreSqlSourceInfo.password ?? '';
  }

  private set password(value: string) {
    this.postgreSqlSourceInfo.password = value;
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
            <BFormInput id="input-database" placeholder="Input database name" autocomplete="off" trim v-model={this.databaseName}></BFormInput>
          </div>
        </div>
        <div class="form-item d-flex w-100 justify-content-center align-items-center">
          <div class="title">Username:</div>
          <div class="input">
            <BFormInput id="input-username" placeholder="Input username" hide-track-value autocomplete="off" trim v-model={this.username}></BFormInput>
          </div>
        </div>
        <div class="form-item d-flex w-100 justify-content-center align-items-center">
          <div class="title">Password:</div>
          <div class="input">
            <BFormInput id="input-password" placeholder="Input password" hide-track-value v-model={this.password} type="password"></BFormInput>
          </div>
        </div>
      </div>
    );
  }

  createDataSourceInfo(): DataSourceInfo {
    return PostgreSqlSourceInfo.fromObject(this.postgreSqlSourceInfo);
  }
  validSource(source: PostgreSqlSourceInfo) {
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
      throw new DIException('Database name is required!');
    }
    if (StringUtils.isEmpty(source.username)) {
      throw new DIException('Username is required!');
    }
  }
}
