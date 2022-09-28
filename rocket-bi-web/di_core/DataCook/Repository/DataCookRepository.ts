import { InjectValue } from 'typescript-ioc';
import { DIKeys } from '@core/modules';
import { BaseClient } from '@core/services/base.service';
import { ListingResponse } from '@core/DataIngestion';
import {
  EtlJobInfo,
  EtlOperator,
  EtlJobRequest,
  GetListEtlRequest,
  CheckProgressResponse,
  PreviewEtlOperatorResponse,
  EtlDatabaseNameResponse,
  NormalFieldConfiguration,
  ExpressionFieldConfiguration,
  ParseQueryResponse,
  MultiPreviewEtlOperatorResponse
} from '../Domain';
import { EtlJobHistory } from '@core/DataCook/Domain/ETL/EtlJobHistory';
import { ThirdPartyPersistConfiguration } from '@core/DataCook/Domain/ETL/ThirdPartyPersistConfiguration/ThirdPartyPersistConfiguration';

export interface ThirdPartyDatabase {
  name: string;
}

export interface ThirdPartyTable {
  name: string;
}
import { JobId } from '@core/domain';
import { ForceMode } from '@core/LakeHouse/Domain/LakeJob/ForceMode';
import { BaseResponse } from '@core/DataIngestion/Domain/Response/BaseResponse';

export abstract class DataCookRepository {
  abstract getListMyEtl(request: GetListEtlRequest): Promise<ListingResponse<EtlJobInfo>>;
  abstract getListSharedEtl(request: GetListEtlRequest): Promise<ListingResponse<EtlJobInfo>>;
  abstract getListArchivedEtl(request: GetListEtlRequest): Promise<ListingResponse<EtlJobInfo>>;
  abstract getEtl(id: number): Promise<EtlJobInfo>;

  abstract createEtl(etlInfo: EtlJobRequest): Promise<EtlJobInfo>;
  abstract updateEtl(id: number, etlInfo: EtlJobRequest): Promise<boolean>;
  abstract archiveEtl(id: number): Promise<boolean>;
  abstract hardDeleteEtl(id: number): Promise<boolean>;
  abstract restoreEtl(id: number): Promise<boolean>;
  abstract preview(id: number, etlOperator: EtlOperator, force: boolean): Promise<PreviewEtlOperatorResponse>;
  abstract multiPreview(id: number, operators: EtlOperator[], force: boolean): Promise<MultiPreviewEtlOperatorResponse>;
  abstract checkProgressId(id: number, progressId: number): Promise<CheckProgressResponse>;

  abstract getListEtlHistory(request: GetListEtlRequest): Promise<ListingResponse<EtlJobHistory>>;
  abstract getDatabaseName(id: number): Promise<EtlDatabaseNameResponse>;
  abstract parseQuery(id: number, fields: NormalFieldConfiguration[], extraFields: ExpressionFieldConfiguration[]): Promise<ParseQueryResponse>;
  // abstract previewEtl(id: number): Promise<boolean>;
  // abstract saveToDatabase(id: number): Promise<boolean>;
  // abstract detectTableSchemaFromEtlOperator(id: number): Promise<boolean>;

  // abstract getListSharedUser(id: number): Promise<boolean>;
  // abstract shareEtl(id: number): Promise<boolean>;
  // abstract updateShareEtl(id: number): Promise<boolean>;
  // abstract revokeShareEtl(id: number): Promise<boolean>;
  abstract forceRun(jobId: JobId, date: number, mode: ForceMode): Promise<BaseResponse>;

  abstract cancel(jobId: JobId): Promise<BaseResponse>;

  abstract listThirdPartyDatabase(configuration: ThirdPartyPersistConfiguration): Promise<ListingResponse<ThirdPartyDatabase>>;
  abstract listThirdPartyTable(configuration: ThirdPartyPersistConfiguration, dbName: string): Promise<ListingResponse<ThirdPartyTable>>;
}

export class DataCookRepositoryImpl extends DataCookRepository {
  @InjectValue(DIKeys.DataCookClient)
  private httpClient!: BaseClient;

  getListMyEtl(request: GetListEtlRequest): Promise<ListingResponse<EtlJobInfo>> {
    return this.httpClient.post<ListingResponse<EtlJobInfo>>(`/data_cook/my_etl`, request);
  }
  getListSharedEtl(request: GetListEtlRequest): Promise<ListingResponse<EtlJobInfo>> {
    return this.httpClient.post<ListingResponse<EtlJobInfo>>(`/data_cook/shared`, request);
  }
  getListArchivedEtl(request: GetListEtlRequest): Promise<ListingResponse<EtlJobInfo>> {
    return this.httpClient.post<ListingResponse<EtlJobInfo>>(`/data_cook/trash`, request);
  }
  getEtl(id: number): Promise<EtlJobInfo> {
    return this.httpClient.get<EtlJobInfo>(`/data_cook/${id}`).then(EtlJobInfo.fromObject);
  }
  createEtl(etlInfo: EtlJobRequest): Promise<EtlJobInfo> {
    return this.httpClient.post<EtlJobInfo>(`/data_cook/create`, etlInfo);
  }
  updateEtl(id: number, etlInfo: EtlJobRequest): Promise<boolean> {
    return this.httpClient.put<boolean>(`/data_cook/${id}`, etlInfo);
  }
  archiveEtl(id: number): Promise<boolean> {
    return this.httpClient.delete<boolean>(`/data_cook/${id}`);
  }
  hardDeleteEtl(id: number): Promise<boolean> {
    return this.httpClient.delete<boolean>(`/data_cook/trash/${id}`);
  }
  restoreEtl(id: number): Promise<boolean> {
    return this.httpClient.post<boolean>(`/data_cook/trash/${id}/restore`);
  }
  checkProgressId(id: number, progressId: number): Promise<CheckProgressResponse> {
    return this.httpClient.get<CheckProgressResponse>(`/data_cook/${id}/${progressId}/check`).then(CheckProgressResponse.fromObject);
  }
  preview(id: number, operator: EtlOperator, force: boolean): Promise<PreviewEtlOperatorResponse> {
    return this.httpClient
      .post<PreviewEtlOperatorResponse>(`/data_cook/${id}/preview`, { operator, force })
      .then(PreviewEtlOperatorResponse.fromObject);
  }
  multiPreview(id: number, operators: EtlOperator[], force: boolean): Promise<MultiPreviewEtlOperatorResponse> {
    return this.httpClient
      .post<MultiPreviewEtlOperatorResponse>(`/data_cook/${id}/preview_sync`, { operators, force })
      .then(MultiPreviewEtlOperatorResponse.fromObject);
  }
  getListEtlHistory(request: GetListEtlRequest): Promise<ListingResponse<EtlJobHistory>> {
    return this.httpClient
      .post<ListingResponse<EtlJobHistory>>(`/data_cook/history`, request)
      .then(resp => new ListingResponse<EtlJobHistory>(resp.data.map(EtlJobHistory.fromObject), resp.total));
  }
  getDatabaseName(id: number): Promise<EtlDatabaseNameResponse> {
    return this.httpClient.get<EtlDatabaseNameResponse>(`/data_cook/${id}/preview/database_name`).then(EtlDatabaseNameResponse.fromObject);
  }
  parseQuery(id: number, fields: NormalFieldConfiguration[], extraFields: ExpressionFieldConfiguration[]): Promise<ParseQueryResponse> {
    return this.httpClient
      .post<ParseQueryResponse>(`/data_cook/${id}/view_query`, {
        fields,
        extraFields
      })
      .then(ParseQueryResponse.fromObject);
  }
  // previewEtl(id: number): Promise<boolean> {
  //   throw new Error('Method not implemented.');
  // }
  // saveToDatabase(id: number): Promise<boolean> {
  //   throw new Error('Method not implemented.');
  // }
  // detectTableSchemaFromEtlOperator(id: number): Promise<boolean> {
  //   throw new Error('Method not implemented.');
  // }

  forceRun(jobId: JobId, date: number, mode: ForceMode): Promise<BaseResponse> {
    return this.httpClient.put(`/data_cook/${jobId}/force_run`, { atTime: date, mode: mode }, void 0);
  }

  cancel(jobId: JobId): Promise<BaseResponse> {
    return this.httpClient.put(`/data_cook/${jobId}/kill`, {}, void 0);
  }

  listThirdPartyDatabase(configuration: ThirdPartyPersistConfiguration): Promise<ListingResponse<ThirdPartyDatabase>> {
    return this.httpClient.post<ListingResponse<{ name: string }>>(`/data_cook/third_party/database/list`, { configuration: configuration });
  }

  listThirdPartyTable(configuration: ThirdPartyPersistConfiguration, dbName: string): Promise<ListingResponse<ThirdPartyTable>> {
    return this.httpClient.post<ListingResponse<{ name: string }>>(`/data_cook/third_party/table/list`, { configuration: configuration, databaseName: dbName });
  }
}
