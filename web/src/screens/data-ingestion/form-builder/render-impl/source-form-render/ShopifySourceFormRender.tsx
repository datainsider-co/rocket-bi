import '@/screens/data-ingestion/components/data-source-config-form/scss/Form.scss';
import { BFormInput, BFormTextarea } from 'bootstrap-vue';
import { DataSourceFormRender } from '@/screens/data-ingestion/form-builder/DataSourceFormRender';
import { DataSourceInfo } from '@core/data-ingestion/domain/data-source/DataSourceInfo';
import { BigQuerySourceInfoV2 } from '@core/data-ingestion/domain/data-source/BigQuerySourceInfoV2';
import { JdbcUrlSourceInfo } from '@core/data-ingestion/domain/data-source/JdbcUrlSourceInfo';
import { ShopifySourceInfo } from '@core/data-ingestion/domain/data-source/ShopifySourceInfo';
import { StringUtils } from '@/utils';
import { DIException } from '@core/common/domain';

export class ShopifySourceFormRender implements DataSourceFormRender {
  private shopifySourceInfo: ShopifySourceInfo;

  constructor(bigQuerySourceInfo: ShopifySourceInfo) {
    this.shopifySourceInfo = bigQuerySourceInfo;
  }

  private get displayName() {
    return this.shopifySourceInfo.displayName;
  }

  private set displayName(value: string) {
    this.shopifySourceInfo.displayName = value;
  }

  private get accessToken() {
    return this.shopifySourceInfo.accessToken;
  }

  private set accessToken(value: string) {
    this.shopifySourceInfo.accessToken = value;
  }

  private get apiUrl() {
    return this.shopifySourceInfo.apiUrl;
  }

  private set apiUrl(value: string) {
    this.shopifySourceInfo.apiUrl = value;
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
          <div class="title mt-1">Shop URL:</div>
          <div class="input">
            <BFormInput id="input-api-url" hide-track-value placeholder="Input URL" v-model={this.apiUrl}></BFormInput>
          </div>
        </div>
        <div class="form-item d-flex w-100 justify-content-center align-items-center">
          <div class="title">Access token:</div>
          <div class="input">
            <BFormInput
              id="input-access-token"
              hide-track-value
              placeholder="Input access token"
              autocomplete="off"
              trim
              v-model={this.accessToken}></BFormInput>
          </div>
        </div>
      </div>
    );
  }

  createDataSourceInfo(): DataSourceInfo {
    return ShopifySourceInfo.fromObject(this.shopifySourceInfo);
  }
  validSource(source: ShopifySourceInfo) {
    if (StringUtils.isEmpty(source.displayName)) {
      throw new DIException('Display name is required!');
    }
    if (StringUtils.isEmpty(source.apiUrl)) {
      throw new DIException('Shop URL is required!');
    }
    if (StringUtils.isEmpty(source.accessToken)) {
      throw new DIException('Access token is required!');
    }
  }
}
