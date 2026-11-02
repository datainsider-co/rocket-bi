import type { EtlStatus } from '@/core/data-cook/EtlJob';
import { StatusTag } from '@/shared/listing/StatusTag';
import { etlStatusIcon } from './etlStatus.utils';

/** v1 `StatusCell` for an ETL or one of its runs. */
export function EtlStatusTag({ status }: { status: EtlStatus }) {
  return <StatusTag status={status} icon={etlStatusIcon(status)} />;
}
