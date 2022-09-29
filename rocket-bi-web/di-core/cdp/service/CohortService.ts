import { Inject } from 'typescript-ioc';
import { CohortBasicInfo, CohortFilter, CohortInfo, CohortRepository, QueryCohortResponse, TimeMetric } from '@core/cdp';
import { Log } from '@core/utils';
import { DateRange } from '@/shared';
import { RetentionAnalysisResponse } from '@core/cdp/domain/cohort/RetentionAnalysisResponse';
import { PageResult } from '@core/common/domain';

export abstract class CohortService {
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

export class CohortServiceImpl extends CohortService {
  constructor(@Inject private cdpRepository: CohortRepository) {
    super();
    Log.info('CdpServiceImpl', cdpRepository);
  }

  createCohortFilter(cohortFilter: CohortBasicInfo): Promise<CohortInfo> {
    return this.cdpRepository.createCohortFilter(cohortFilter);
  }

  updateCohortFilter(id: number, cohortFilter: CohortBasicInfo): Promise<boolean> {
    return this.cdpRepository.updateCohortFilter(id, cohortFilter);
  }

  deleteCohortFilter(id: number): Promise<boolean> {
    return this.cdpRepository.deleteCohortFilter(id);
  }

  getCohortInfo(id: number): Promise<CohortInfo> {
    return this.cdpRepository.getCohortInfo(id);
  }

  getListCohortFilter(from: number, size: number): Promise<PageResult<CohortInfo>> {
    return this.cdpRepository.getListCohortFilter(from, size);
  }

  queryCohort(cohort: CohortFilter, dateRange: DateRange, timeMetric: TimeMetric): Promise<QueryCohortResponse> {
    return this.cdpRepository.queryCohort(cohort, dateRange, timeMetric);
  }

  multiDeleteCohort(ids: number[]): Promise<boolean> {
    return this.cdpRepository.multiDeleteCohort(ids);
  }

  analyze(
    startEventName: string | null,
    returnEventName: string | null,
    cohortFilter: CohortFilter | null,
    dateRange: DateRange,
    timeMetric: TimeMetric
  ): Promise<RetentionAnalysisResponse> {
    return this.cdpRepository.analyze(startEventName, returnEventName, cohortFilter, dateRange, timeMetric);
  }
}
