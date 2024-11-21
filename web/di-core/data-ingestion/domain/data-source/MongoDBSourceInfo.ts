import { DataSource } from '@core/data-ingestion/domain/response/DataSource';
import { DataSourceInfo } from './DataSourceInfo';
import { DataSourceType } from '@core/data-ingestion/domain/data-source/DataSourceType';
import { SourceId } from '@core/common/domain';
import { MongoDBSource, DataSources } from '@core/data-ingestion';
import { TSLUIConfig } from '@/screens/data-cook/components/save-to-database/TSLForm.vue';
import { ListUtils } from '@/utils';
import { Log } from '@core/utils';

export class MongoTLSConfig {
  constructor(certificateKeyFileName: string, certificateKeyFileData: string, certificateKeyFilePassword: string, caFileName: string, caFileData: string) {
    this.certificateKeyFileName = certificateKeyFileName;
    this.certificateKeyFileData = certificateKeyFileData;
    this.certificateKeyFilePassword = certificateKeyFilePassword;
    this.caFileName = caFileName;
    this.caFileData = caFileData;
  }

  certificateKeyFileName: string;
  certificateKeyFileData: string;
  certificateKeyFilePassword: string;
  caFileData: string;
  caFileName: string;

  static fromObject(obj: any): MongoTLSConfig {
    return new MongoTLSConfig(obj.certificateKeyFileName, obj.certificateKeyFileData, obj.certificateKeyFilePassword, obj.caFileName, obj.caFileData);
  }
}

export enum MongoConnectionType {
  uri = 'uri',
  normal = 'normal'
}

export class MongoDBSourceInfo implements DataSourceInfo {
  className = DataSources.MongoDbSource;
  sourceType = DataSourceType.MongoDB;
  id: SourceId;
  orgId: string;
  displayName: string;
  host: string;
  port: string | undefined;
  username: string;
  password: string;
  lastModify: number;
  tlsConfiguration: MongoTLSConfig | undefined;
  connectionUri?: string;
  connectionType: MongoConnectionType = MongoConnectionType.normal;

  constructor(
    id: SourceId,
    orgId: string,
    displayName: string,
    host: string,
    port: string | undefined,
    username: string,
    password: string,
    lastModify: number,
    tlsConfiguration: MongoTLSConfig | undefined,
    connectionUri?: string
  ) {
    this.id = id;
    this.orgId = orgId;
    this.displayName = displayName;
    this.host = host;
    this.port = port;
    this.username = username;
    this.password = password;
    this.lastModify = lastModify;
    this.tlsConfiguration = tlsConfiguration;
    this.connectionUri = connectionUri;
  }

  get isNormalConnectionType() {
    return this.connectionType === MongoConnectionType.normal;
  }

  get isUriConnectionType() {
    return this.connectionType === MongoConnectionType.uri;
  }

  static fromJdbcSource(obj: MongoDBSource): DataSourceInfo {
    const tlsConfig = obj.tlsConfiguration ? MongoTLSConfig.fromObject(obj.tlsConfiguration) : void 0;
    return new MongoDBSourceInfo(
      obj.id,
      obj.orgId,
      obj.displayName,
      obj.host,
      obj.port,
      obj.username,
      obj.password,
      obj.lastModify,
      tlsConfig,
      obj.connectionUri
    );
  }

  static fromObject(obj: any): MongoDBSourceInfo {
    const tlsConfig = obj.tlsConfiguration ? MongoTLSConfig.fromObject(obj.tlsConfiguration) : void 0;
    return new MongoDBSourceInfo(
      obj.id ?? DataSourceInfo.DEFAULT_ID,
      obj.orgId ?? DataSourceInfo.DEFAULT_ID.toString(),
      obj.displayName ?? '',
      obj.host ?? '',
      obj.port || void 0,
      obj.username ?? '',
      obj.password ?? '',
      obj.lastModify ?? 0,
      tlsConfig,
      obj.connectionUri
    );
  }

  toDataSource(): DataSource {
    return new MongoDBSource(
      this.id,
      this.orgId,
      this.sourceType,
      this.displayName,
      this.host,
      this.port || void 0,
      this.username,
      this.password,
      this.lastModify,
      this.tlsConfiguration,
      this.connectionUri
    );
  }

  getDisplayName(): string {
    return this.displayName;
  }

  toTSLUIConfig(): TSLUIConfig {
    const config: TSLUIConfig = {
      enable: false,
      certificateFile: null,
      certificateData: '',
      certificatePass: '',
      caFile: null,
      caData: ''
    };
    if (this.tlsConfiguration) {
      ///get file certificate
      if (this.tlsConfiguration.certificateKeyFileData !== undefined) {
        const fileName = this.tlsConfiguration.certificateKeyFileName ?? 'Certificate File';
        config.certificateFile = new File([ListUtils.getHead(fileName.split('.')) ?? ''], fileName, {
          type: 'text/plain'
        });
        config.certificatePass = this.tlsConfiguration.certificateKeyFilePassword;
        config.certificateData = this.tlsConfiguration.certificateKeyFileData;
      }
      ///get file ca
      if (this.tlsConfiguration.caFileData !== undefined) {
        const fileName = this.tlsConfiguration.caFileName ?? 'CA File';
        config.caFile = new File([ListUtils.getHead(fileName.split('.')) ?? ''], fileName, {
          type: 'text/plain'
        });
        config.caData = this.tlsConfiguration.caFileData;
      }
      config.enable = true;
    }

    return config;
  }
}
