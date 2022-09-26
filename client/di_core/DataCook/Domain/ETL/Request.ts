import { EtlOperator } from './EtlOperator';
import { TimeScheduler } from '@/screens/DataIngestion/components/JobSchedulerForm/SchedulerTime/TimeScheduler';
import { Sort } from '@core/domain';
import { EtlConfig } from '@core/DataCook';

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
