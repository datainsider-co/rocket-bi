import '@/screens/data-ingestion/components/data-source-config-form/scss/Form.scss';
import { BFormInput, BFormTextarea } from 'bootstrap-vue';
import { MongoConnectionType, MongoDBSourceInfo, MongoTLSConfig } from '@core/data-ingestion/domain/data-source/MongoDBSourceInfo';
import { DataSourceFormRender } from '@/screens/data-ingestion/form-builder/DataSourceFormRender';
import { DataSourceInfo } from '@core/data-ingestion/domain/data-source/DataSourceInfo';
import TSLForm, { TSLUIConfig } from '@/screens/data-cook/components/save-to-database/TSLForm.vue';
import { Log } from '@core/utils';
import DiDropdown from '@/shared/components/common/di-dropdown/DiDropdown.vue';
import { StringUtils } from '@/utils';
import { DIException } from '@core/common/domain';

export class MongoDBDataSourceFormRender implements DataSourceFormRender {
  private dataSourceInfo: MongoDBSourceInfo;

  constructor(info: MongoDBSourceInfo) {
    this.dataSourceInfo = info;
    if (info.connectionUri) {
      this.dataSourceInfo.connectionType = MongoConnectionType.uri;
    }
  }

  private get displayName() {
    return this.dataSourceInfo.displayName;
  }

  private set displayName(value: string) {
    this.dataSourceInfo.displayName = value;
  }

  private get host() {
    return this.dataSourceInfo.host;
  }

  private set host(value: string) {
    this.dataSourceInfo.host = value;
  }

  private get port() {
    return this.dataSourceInfo.port ?? '';
  }

  private set port(value: string) {
    this.dataSourceInfo.port = value;
  }

  private get username() {
    return this.dataSourceInfo.username;
  }

  private set username(value: string) {
    this.dataSourceInfo.username = value;
  }

  private get password() {
    return this.dataSourceInfo.password ?? '';
  }

  private set password(value: string) {
    this.dataSourceInfo.password = value;
  }

  private get connectionUri() {
    return this.dataSourceInfo.connectionUri ?? '';
  }

  private set connectionUri(value: string) {
    this.dataSourceInfo.connectionUri = value;
  }

  private get connectionType() {
    return this.dataSourceInfo.connectionType ?? '';
  }

  private set connectionType(value: MongoConnectionType) {
    this.dataSourceInfo.connectionType = value;
  }

  private get tslConfig(): TSLUIConfig {
    return this.dataSourceInfo.toTSLUIConfig();
  }

  private get connectionTypes() {
    return [
      {
        label: 'Username/password',
        value: MongoConnectionType.normal
      },
      {
        label: 'URI',
        value: MongoConnectionType.uri
      }
    ];
  }

  private handleConnectionTypeSelected(type: MongoConnectionType) {
    this.dataSourceInfo.connectionType = type;
  }

  private get isNormalConnectionType() {
    return this.dataSourceInfo.isNormalConnectionType;
  }

  private get isUriConnectionType() {
    return this.dataSourceInfo.isUriConnectionType;
  }

  renderForm(h: any): any {
    return (
      <form autocomplete="chrome-disabled">
        <div class="form-item d-flex w-100 justify-content-center align-items-center">
          <div class="title">Display name:</div>
          <div class="input">
            <BFormInput id="input-display-name" placeholder="Input display name" autocomplete="off" v-model={this.displayName}></BFormInput>
          </div>
        </div>

        <div class="form-item d-flex w-100 justify-content-center align-items-center">
          <input style="display: none" type="text" name="fakeusernameremembered" />
          <input style="display: none" type="password" name="fakepasswordremembered" />
          <div class="title">Connection Type:</div>
          <div class="input">
            <DiDropdown id="mongo-connection-type" data={this.connectionTypes} valueProps="value" labelProps="label" v-model={this.connectionType}></DiDropdown>
          </div>
        </div>

        {this.isUriConnectionType && (
          <div class="form-item d-flex w-100 align-items-start">
            <div class="title mt-1">URI:</div>
            <div class="input">
              <BFormTextarea
                id="input-connection-uri"
                hide-track-value
                trim
                style="min-height: 85px"
                placeholder="Input URI"
                v-model={this.connectionUri}></BFormTextarea>
            </div>
          </div>
        )}
        {this.isNormalConnectionType && (
          <div class="mt-2">
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
        )}
        <TSLForm class="mt-3" config={this.tslConfig} onChanged={(config: TSLUIConfig | null) => this.handleTSLChange(config)} />
      </form>
    );
  }

  createDataSourceInfo(): DataSourceInfo {
    if (this.dataSourceInfo.isNormalConnectionType) {
      this.dataSourceInfo.connectionUri = void 0;
    }
    Log.debug('MongoDBDataSourceFormRender::createDataSourceInfo::', this.dataSourceInfo);
    return MongoDBSourceInfo.fromObject(this.dataSourceInfo);
  }

  private handleTSLChange(config: TSLUIConfig | null) {
    try {
      if (config) {
        Log.debug('handleTSLChange', config.certificateFile);
        const cerFileName = config.certificateFile?.name ?? '';
        const cerData = config.certificateData;
        const cerPass = config.certificatePass;
        const caFileName = config.caFile?.name ?? '';
        const caData = config.caData;
        this.dataSourceInfo.tlsConfiguration = new MongoTLSConfig(cerFileName, cerData, cerPass, caFileName, caData);
      } else {
        this.dataSourceInfo.tlsConfiguration = void 0;
      }
    } catch (ex) {
      Log.trace('handleTSLChange::', config, ex);
    }
  }
  validSource(source: MongoDBSourceInfo) {
    if (StringUtils.isEmpty(source.displayName)) {
      throw new DIException('Display name is required!');
    }
    if (StringUtils.isEmpty(source.connectionType)) {
      throw new DIException('Connection type is required!');
    }
    Log.debug('Mongo::valid::', source);
    this.validConnectionConfig(source, this.connectionType);
  }
  private validConnectionConfig(source: MongoDBSourceInfo, configType: MongoConnectionType) {
    switch (configType) {
      case MongoConnectionType.uri:
        if (StringUtils.isEmpty(source.connectionUri)) {
          throw new DIException('Connection uri is required!');
        }
        break;
      case MongoConnectionType.normal:
        if (StringUtils.isEmpty(source.host)) {
          throw new DIException('Host is required!');
        }
        if (StringUtils.isEmpty(source.port)) {
          throw new DIException('Port is required!');
        }
        if (StringUtils.isEmpty(source.username)) {
          throw new DIException('Username is required!');
        }
        break;
    }
  }
}
