import '@/screens/data-ingestion/components/data-source-config-form/scss/Form.scss';
import { BFormInput, BFormTextarea } from 'bootstrap-vue';
import { DataSourceFormRender } from '@/screens/data-ingestion/form-builder/DataSourceFormRender';
import { DataSourceInfo } from '@core/data-ingestion/domain/data-source/DataSourceInfo';
import { BigQuerySourceInfoV2 } from '@core/data-ingestion/domain/data-source/BigQuerySourceInfoV2';
import { JdbcUrlSourceInfo } from '@core/data-ingestion/domain/data-source/JdbcUrlSourceInfo';

export class JdbcUrlSourceFormRender implements DataSourceFormRender {
  private jdbcUrlSourceInfo: JdbcUrlSourceInfo;

  constructor(bigQuerySourceInfo: JdbcUrlSourceInfo) {
    this.jdbcUrlSourceInfo = bigQuerySourceInfo;
  }

  private get displayName() {
    return this.jdbcUrlSourceInfo.displayName;
  }

  private set displayName(value: string) {
    this.jdbcUrlSourceInfo.displayName = value;
  }

  private get password() {
    return this.jdbcUrlSourceInfo.password;
  }

  private set password(value: string) {
    this.jdbcUrlSourceInfo.password = value;
  }

  private get username() {
    return this.jdbcUrlSourceInfo.username;
  }

  private set username(value: string) {
    this.jdbcUrlSourceInfo.username = value;
  }

  private get jdbcUrl() {
    return this.jdbcUrlSourceInfo.jdbcUrl;
  }

  private set jdbcUrl(value: string) {
    this.jdbcUrlSourceInfo.jdbcUrl = value;
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
        <div class="form-item d-flex w-100 align-items-start">
          <div class="title mt-1">Jdbc Url:</div>
          <div class="input">
            <BFormTextarea id="input-jdbc-url" style="min-height: 85px" placeholder="Input jdbc url key" v-model={this.jdbcUrl}></BFormTextarea>
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
            <BFormInput id="input-password" hide-track-value placeholder="Input password" v-model={this.password} type="password"></BFormInput>
          </div>
        </div>
      </div>
    );
  }

  createDataSourceInfo(): DataSourceInfo {
    return JdbcUrlSourceInfo.fromObject(this.jdbcUrlSourceInfo);
  }
}
