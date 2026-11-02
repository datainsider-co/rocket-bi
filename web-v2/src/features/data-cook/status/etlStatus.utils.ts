import { EtlStatus } from '@/core/data-cook/EtlJob';
import type { StatusIcon } from '@/shared/listing/statusIcon';

/** v1 `EtlJobInfo.getIconFromStatus`: Done looks like Synced, Running like Syncing. */
const ICONS: Readonly<Record<EtlStatus, StatusIcon>> = {
  [EtlStatus.Initialized]: 'initialized',
  [EtlStatus.Queued]: 'queued',
  [EtlStatus.Running]: 'syncing',
  [EtlStatus.Syncing]: 'syncing',
  [EtlStatus.Done]: 'synced',
  [EtlStatus.Synced]: 'synced',
  [EtlStatus.Error]: 'error',
  [EtlStatus.Terminated]: 'terminated',
  [EtlStatus.Unknown]: 'unknown'
};

export function etlStatusIcon(status: EtlStatus): StatusIcon {
  return ICONS[status];
}
