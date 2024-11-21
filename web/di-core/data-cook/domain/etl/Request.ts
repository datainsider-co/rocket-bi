import { EtlOperator } from './EtlOperator';
import { TimeScheduler } from '@/screens/data-ingestion/components/job-scheduler-form/scheduler-time/TimeScheduler';
import { Sort } from '@core/common/domain';
import { EtlConfig } from '@core/data-cook';

export class GetListEtlRequest {
  constructor(public keyword: string, public from: number, public size: number, public sorts: Sort[] = []) {}
}

export class EtlJobRequest {
  constructor(
    public displayName: string,
    public operators: EtlOperator[],
    public scheduleTime: TimeScheduler,
    public extraData?: Record<string, any>,
    public config?: EtlConfig
  ) {}
}
