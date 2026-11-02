import { Typography } from 'antd';
import type { EtlJob } from '@/core/data-cook/EtlJob';
import { formatDateTime } from '@/shared/listing/listing.utils';
import { EtlStatusTag } from '../status/EtlStatusTag';

/** v1 "Last Run": the ETL's status and when it last ran (`--` before its first run). */
export function LastRunCell({ etl }: { etl: EtlJob }) {
  return (
    <div className="flex flex-col gap-0.5">
      <EtlStatusTag status={etl.status} />
      <Typography.Text type="secondary" className="whitespace-nowrap text-xs" title="Last run">
        {formatDateTime(etl.lastExecuteTime)}
      </Typography.Text>
    </div>
  );
}
