import { Button, Tooltip } from 'antd';
import type { EtlJob } from '@/core/data-cook/EtlJob';
import type { EtlRowActions } from './useEtlListingPage';

/** v1's Trash `IconActionCell`: Restore and Delete forever. */
export function TrashActionsCell({ etl, actions }: { etl: EtlJob; actions: Pick<EtlRowActions, 'onRestore' | 'onDeleteForever'> }) {
  return (
    <span className="flex items-center gap-1">
      <Tooltip title="Restore">
        <Button
          type="text"
          icon={<i className="di-icon-restore" />}
          aria-label={`Restore ${etl.displayName}`}
          onClick={() => actions.onRestore(etl)}
        />
      </Tooltip>
      <Tooltip title="Delete forever">
        <Button
          type="text"
          danger
          icon={<i className="di-icon-delete" />}
          aria-label={`Delete ${etl.displayName} forever`}
          onClick={() => actions.onDeleteForever(etl)}
        />
      </Tooltip>
    </span>
  );
}
