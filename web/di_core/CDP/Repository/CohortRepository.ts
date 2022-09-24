import { InjectValue } from 'typescript-ioc';
import { DIKeys } from '@core/modules';
import { BaseClient } from '@core/services/base.service';
import { CohortBasicInfo, CohortFilter, CohortInfo, QueryCohortResponse, TimeMetric } from '@core/CDP';
import { ListingResponse } from '@core/DataIngestion';
import { Log } from '@core/utils';
import { DIException, PageResult } from '@core/domain';
import { DateRange } from '@/shared';
import { RetentionAnalysisResponse } from '@core/CDP/Domain/Cohort/RetentionAnalysisResponse';

export abstract class CohortRepository {
  abstract createCohortFilter(cohortFilter: CohortBasicInfo): Promise<CohortInfo>;

  abstract updateCohortFilter(id: number, cohortFilter: CohortBasicInfo): Promise<boolean>;

  abstract deleteCohortFilter(id: number): Promise<boolean>;

  abstract getCohortInfo(id: number): Promise<CohortInfo>;

  abstract getListCohortFilter(from: number, size: number): Promise<PageResult<CohortInfo>>;

  abstract queryCohort(cohort: CohortFilter, dateRange: DateRange, timeMetric: TimeMetric): Promise<QueryCohortResponse>;

  abstract multiDeleteCohort(ids: number[]): Promise<boolean>;

  abstract analyze(
    startEventName: string | null,
    returnEventName: string | null,
    cohortFilter: CohortFilter | null,
    dateRange: DateRange,
    timeMetric: TimeMetric
  ): Promise<RetentionAnalysisResponse>;
}
export class CohortRepositoryImpl extends CohortRepository {
  @InjectValue(DIKeys.authClient)
  private httpClient!: BaseClient;
  private apiCohort = 'cdp/cohorts';

  createCohortFilter(cohortFilter: CohortBasicInfo): Promise<CohortInfo> {
    return this.httpClient
      .post<CohortInfo>(`${this.apiCohort}`, cohortFilter)
      .then(r => CohortInfo.fromObject(r))
      .catch(e => {
        Log.error('CdpRepositoryImpl::createCohortFilter::exception::', e);
        throw new DIException(e.message);
      });
  }

  updateCohortFilter(id: number, cohortFilter: CohortBasicInfo): Promise<boolean> {
    return this.httpClient.put<boolean>(`${this.apiCohort}/${id}`, cohortFilter).catch(e => {
      Log.error('CdpRepositoryImpl::createCohortFilter::exception::', e);
      throw new DIException(e.message);
    });
  }

  deleteCohortFilter(id: number): Promise<boolean> {
    return this.httpClient
      .delete<boolean>(`${this.apiCohort}`, { ids: [id] })
      .catch(e => {
        Log.error('CdpRepositoryImpl::updateCohortFilter::exception::', e);
        throw new DIException(e.message);
      });
  }

  getCohortInfo(id: number): Promise<CohortInfo> {
    return this.httpClient
      .get<CohortInfo>(`${this.apiCohort}/${id}`)
      .then(res => CohortInfo.fromObject(res))
      .catch(e => {
        Log.error('CdpRepositoryImpl::getCohortFilter::exception::', e);
        throw new DIException(e.message);
      });
  }

  getListCohortFilter(from: number, size: number): Promise<PageResult<CohortInfo>> {
    return this.httpClient
      .get<ListingResponse<CohortInfo>>(this.apiCohort, { from, size })
      .then(
        resp =>
          new ListingResponse<CohortInfo>(
            resp.data.map(info => CohortInfo.fromObject(info)),
            resp.total
          )
      )
      .catch(e => {
        Log.error('CdpRepositoryImpl::getListCohortFilter::exception::', e);
        throw new DIException(e.message);
      });
  }

  queryCohort(cohort: CohortFilter, dateRange: DateRange, timeMetric: TimeMetric): Promise<QueryCohortResponse> {
    return Promise.reject(new DIException('method unsupported'));
  }

  ///TODO: ADD API here
  multiDeleteCohort(ids: number[]): Promise<boolean> {
    return this.httpClient
      .delete<boolean>(`${this.apiCohort}`, { ids: ids })
      .catch(e => {
        Log.error('CdpRepositoryImpl::updateCohortFilter::exception::', e);
        throw new DIException(e.message);
      });
  }

  analyze(
    startEventName: string | null,
    returnEventName: string | null,
    cohortFilter: CohortFilter | null,
    dateRange: DateRange,
    timeMetric: TimeMetric
  ): Promise<RetentionAnalysisResponse> {
    return this.httpClient
      .post(`${this.apiCohort}/analyze`, {
        startEvent: startEventName,
        returnEvent: returnEventName,
        cohortFilter: cohortFilter,
        dateRange: {
          from: new Date(dateRange.start).getTime(),
          to: new Date(dateRange.end).getTime()
        },
        timeMetric: timeMetric
      })
      .then(response => {
        return RetentionAnalysisResponse.fromObject(response);
      });
  }
}
