import { Inject } from 'typescript-ioc';
import { Log } from '@core/utils';
import { DataCookRepository, ThirdPartyDatabase, ThirdPartyTable } from '../repository';
import {
  CheckProgressResponse,
  EtlDatabaseNameResponse,
  EtlJobInfo,
  EtlJobRequest,
  EtlOperator,
  ExpressionFieldConfiguration,
  GetListEtlRequest,
  PreviewEtlResponse,
  NormalFieldConfiguration,
  ParseQueryResponse,
  PreviewEtlOperatorResponse
} from '../domain';
import { ListingResponse } from '@core/data-ingestion';
import { EtlJobHistory } from '@core/data-cook/domain/etl/EtlJobHistory';
import { JobId } from '@core/common/domain';
import { ForceMode } from '@core/lake-house/domain/lake-job/ForceMode';
import { BaseResponse } from '@core/data-ingestion/domain/response/BaseResponse';
import { ThirdPartyPersistConfiguration } from '@core/data-cook/domain/etl/third-party-persist-configuration/ThirdPartyPersistConfiguration';

export abstract class DataCookService {
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
  abstract multiPreview(id: number, operators: EtlOperator[], force: boolean): Promise<PreviewEtlResponse>;
  abstract getListEtlHistory(request: GetListEtlRequest): Promise<ListingResponse<EtlJobHistory>>;
  abstract getDatabaseName(id: number): Promise<EtlDatabaseNameResponse>;
  abstract parseQuery(id: number, fields: NormalFieldConfiguration[], extraFields: ExpressionFieldConfiguration[]): Promise<ParseQueryResponse>;

  abstract forceRun(jobId: JobId, date: number, mode: ForceMode): Promise<boolean>;
  abstract cancel(jobId: JobId): Promise<boolean>;

  abstract listThirdPartyDatabase(configuration: ThirdPartyPersistConfiguration): Promise<ListingResponse<ThirdPartyDatabase>>;
  abstract listThirdPartyTable(configuration: ThirdPartyPersistConfiguration, dbName: string): Promise<ListingResponse<ThirdPartyTable>>;
}

export class DataCookServiceImpl extends DataCookService {
  constructor(@Inject private dataCookRepository: DataCookRepository) {
    super();
    Log.info('DataCookServiceImpl', dataCookRepository);
  }

  getListMyEtl(request: GetListEtlRequest): Promise<ListingResponse<EtlJobInfo>> {
    return this.dataCookRepository.getListMyEtl(request);
  }
  getListSharedEtl(request: GetListEtlRequest): Promise<ListingResponse<EtlJobInfo>> {
    return this.dataCookRepository.getListSharedEtl(request);
  }
  getListArchivedEtl(request: GetListEtlRequest): Promise<ListingResponse<EtlJobInfo>> {
    return this.dataCookRepository.getListArchivedEtl(request);
  }
  getEtl(id: number): Promise<EtlJobInfo> {
    return this.dataCookRepository.getEtl(id);
  }
  createEtl(etlInfo: EtlJobRequest): Promise<EtlJobInfo> {
    return this.dataCookRepository.createEtl(etlInfo);
  }
  updateEtl(id: number, etlInfo: EtlJobRequest): Promise<boolean> {
    etlInfo.operators = EtlOperator.unique(etlInfo.operators);
    return this.dataCookRepository.updateEtl(id, etlInfo);
  }
  archiveEtl(id: number): Promise<boolean> {
    return this.dataCookRepository.archiveEtl(id);
  }
  hardDeleteEtl(id: number): Promise<boolean> {
    return this.dataCookRepository.hardDeleteEtl(id);
  }
  restoreEtl(id: number): Promise<boolean> {
    return this.dataCookRepository.restoreEtl(id);
  }

  preview(id: number, etlOperator: EtlOperator, force: boolean): Promise<PreviewEtlOperatorResponse> {
    return this.dataCookRepository.preview(id, etlOperator, force);
  }

  multiPreview(id: number, operators: EtlOperator[], force: boolean): Promise<PreviewEtlResponse> {
    return this.dataCookRepository.multiPreview(id, operators, force);
  }

  getListEtlHistory(request: GetListEtlRequest): Promise<ListingResponse<EtlJobHistory>> {
    return this.dataCookRepository.getListEtlHistory(request);
  }

  getDatabaseName(id: number): Promise<EtlDatabaseNameResponse> {
    return this.dataCookRepository.getDatabaseName(id);
  }

  parseQuery(id: number, fields: NormalFieldConfiguration[], extraFields: ExpressionFieldConfiguration[]): Promise<ParseQueryResponse> {
    return this.dataCookRepository.parseQuery(id, fields, extraFields);
  }

  forceRun(jobId: JobId, date: number, mode: ForceMode): Promise<boolean> {
    return this.dataCookRepository.forceRun(jobId, date, mode).then(response => response.success);
  }

  cancel(jobId: JobId): Promise<boolean> {
    return this.dataCookRepository.cancel(jobId).then(response => response.success);
  }

  listThirdPartyDatabase(configuration: ThirdPartyPersistConfiguration): Promise<ListingResponse<ThirdPartyDatabase>> {
    return this.dataCookRepository.listThirdPartyDatabase(configuration);
  }

  listThirdPartyTable(configuration: ThirdPartyPersistConfiguration, dbName: string): Promise<ListingResponse<ThirdPartyTable>> {
    return this.dataCookRepository.listThirdPartyTable(configuration, dbName);
  }
}
