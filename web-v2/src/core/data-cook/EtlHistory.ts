import { asNumber, asRecord, asString } from '@/core/json/json';
import { etlStatusFromJson, type EtlId, type EtlStatus } from './EtlJob';

/** One run of an ETL (backend `EtlJobHistory`, `data_cook/history`). */
export interface EtlHistory {
  readonly id: number;
  readonly etlId: EtlId;
  /** The ETL's name when it ran (`etl_info`); empty when the server sent none. */
  readonly etlName: string;
  readonly status: EtlStatus;
  /** The run's log: one line per step, then the result or the error. */
  readonly message: string;
  /** Duration in millis. */
  readonly totalExecutionTime: number;
  readonly createdTime: number;
  /** Epoch millis of the last change, the end of the run once it is over. */
  readonly updatedTime: number;
}

export function etlHistoryFromJson(value: unknown): EtlHistory {
  const json = asRecord(value);
  return {
    id: asNumber(json['id']),
    etlId: asNumber(json['etl_job_id']),
    etlName: asString(asRecord(json['etl_info'])['display_name']),
    status: etlStatusFromJson(json['status']),
    message: asString(json['message']),
    totalExecutionTime: asNumber(json['total_execution_time']),
    createdTime: asNumber(json['created_time']),
    updatedTime: asNumber(json['updated_time'])
  };
}
