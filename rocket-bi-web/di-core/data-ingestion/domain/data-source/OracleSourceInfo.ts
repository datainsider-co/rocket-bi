import { DataSource } from '@core/data-ingestion/domain/response/DataSource';
import { DataSourceInfo } from './DataSourceInfo';
import { DataSourceType } from '@core/data-ingestion/domain/data-source/DataSourceType';
import { DataSources } from '@core/data-ingestion/domain/data-source/DataSources';
import { JdbcSource } from '@core/data-ingestion/domain/response/JdbcSource';
import { SourceId } from '@core/common/domain';
import { SupportCustomProperty } from '@core/data-ingestion';
import { CustomPropertyInfo } from '@/screens/user-management/components/user-detail/AddNewFieldModal.vue';
import { StringUtils } from '@/utils';
import { Log } from '@core/utils';

export enum TNSNames {
  SID = 'sid',
  ServiceName = 'service_name'
}

export class OracleSourceInfo implements DataSourceInfo, SupportCustomProperty {
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
  extraFields: Record<string, string>;

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
    tnsName: TNSNames,
    extraFields: Record<string, string>
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
    this.extraFields = extraFields;
  }

  static fromJdbcSource(obj: JdbcSource): DataSourceInfo {
    const url = obj.jdbcUrl;
    const regex = new RegExp('jdbc:oracle:thin:@//(.*)?:(.*?)([:/])(.*)');
    const abc = new URL(url);
    Log.debug('fromJdbcSource::abc', abc);
    const [_, host, port, sign, remain] = regex.exec(url);
    const tnsName = sign === '/' ? TNSNames.ServiceName : TNSNames.SID;
    const [serviceName, extra] = remain.split('&');
    const extraFields: Record<string, string> = this.getExtraFields(extra);
    return new OracleSourceInfo(obj.id, obj.orgId, obj.displayName, host, port, serviceName, obj.username, obj.password, obj.lastModify, tnsName, extraFields);
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
      obj?.tnsName ?? TNSNames.ServiceName,
      obj?.extraFields ?? {}
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
    const extraFields = this.extraFieldsAsString?.length === 0 ? '' : `?${this.extraFieldsAsString}`;
    const jdbcUrl = `jdbc:oracle:thin:@//${this.host}:${this.port}${serviceNameSign}${this.serviceName}${extraFields}`;
    return new JdbcSource(this.id, this.orgId, this.sourceType, this.displayName, jdbcUrl, this.username, this.password, this.lastModify);
  }
  private static getExtraFields(text: string | undefined): Record<string, string> {
    const result: Record<string, string> = {};
    const extraAsString = text !== undefined ? text : 'connectTimeout=30000';
    const containerExtraField = StringUtils.isNotEmpty(extraAsString);
    if (containerExtraField) {
      extraAsString.split('&').forEach(extraAsString => {
        const [key, value] = extraAsString.split('=');
        result[key] = value;
      });
    }
    return result;
  }

  private get extraFieldsAsString(): string {
    return JSON.stringify(this.extraFields)
      .replace('{', '')
      .replace('}', '')
      .replaceAll(/['"]+/g, '')
      .replaceAll(':', '=')
      .replaceAll(',', '&');
  }

  getDisplayName(): string {
    return this.displayName;
  }
  setProperty(propertyInfo: CustomPropertyInfo): void {
    this.extraFields[propertyInfo.fieldName] = propertyInfo.fieldValue;
  }
  isExistsProperty(fieldName: string): boolean {
    return this.extraFields[fieldName] !== undefined;
  }
}
