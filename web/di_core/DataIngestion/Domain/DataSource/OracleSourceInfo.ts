import { DataSource } from '@core/DataIngestion/Domain/Response/DataSource';
import { DataSourceInfo } from './DataSourceInfo';
import { DataSourceType } from '@core/DataIngestion/Domain/DataSource/DataSourceType';
import { DataSources } from '@core/DataIngestion/Domain/DataSource/DataSources';
import { JdbcSource } from '@core/DataIngestion/Domain/Response/JdbcSource';
import { SourceId } from '@core/domain';
import { Log } from '@core/utils';

export enum TNSNames {
  SID = 'sid',
  ServiceName = 'service_name'
}

export class OracleSourceInfo implements DataSourceInfo {
  className = DataSources.JdbcSource;
  sourceType = DataSourceType.Oracle;
  id: SourceId;
  orgId: string;
  displayName: string;
  host: string;
  port: string;
  serviceName: string;
  username: string;
  password: string;
  lastModify: number;
  tnsName: TNSNames;

  constructor(
    id: SourceId,
    orgId: string,
    displayName: string,
    host: string,
    port: string,
    serviceName: string,
    username: string,
    password: string,
    lastModify: number,
    tnsName: TNSNames
  ) {
    this.id = id;
    this.orgId = orgId;
    this.displayName = displayName;
    this.host = host;
    this.port = port;
    this.serviceName = serviceName;
    this.username = username;
    this.password = password;
    this.lastModify = lastModify;
    this.tnsName = tnsName;
  }

  static fromJdbcSource(obj: JdbcSource): DataSourceInfo {
    const url = obj.jdbcUrl;
    const regex = new RegExp('jdbc:oracle:thin:@//(.*)?:(.*?)([:/])(.*)');
    const [_, host, port, sign, serviceName] = regex.exec(url);
    const tnsName = sign === '/' ? TNSNames.ServiceName : TNSNames.SID;
    return new OracleSourceInfo(obj.id, obj.orgId, obj.displayName, host, port, serviceName, obj.username, obj.password, obj.lastModify, tnsName);
  }

  static fromObject(obj: any): OracleSourceInfo {
    return new OracleSourceInfo(
      obj.id ?? DataSourceInfo.DEFAULT_ID,
      obj.orgId ?? DataSourceInfo.DEFAULT_ID.toString(),
      obj.displayName ?? '',
      obj.host ?? '',
      obj.port ?? '',
      obj.serviceName ?? '',
      obj.username ?? '',
      obj.password ?? '',
      obj.lastModify ?? 0,
      obj?.tnsName ?? TNSNames.ServiceName
    );
  }

  toDataSource(): DataSource {
    let serviceNameSign = '/';
    switch (this.tnsName) {
      case TNSNames.ServiceName: {
        serviceNameSign = '/';
        break;
      }
      default: {
        serviceNameSign = ':';
      }
    }
    const jdbcUrl = `jdbc:oracle:thin:@//${this.host}:${this.port}${serviceNameSign}${this.serviceName}`;
    const request = new JdbcSource(this.id, this.orgId, this.sourceType, this.displayName, jdbcUrl, this.username, this.password, this.lastModify);
    return request;
  }

  getDisplayName(): string {
    return this.displayName;
  }
}
