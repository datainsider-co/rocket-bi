import { MoreOutlined } from '@ant-design/icons';
import { Button, Dropdown, type MenuProps } from 'antd';
import { canCancelEtl, type EtlJob } from '@/core/data-cook/EtlJob';
import { SHARE_NOT_READY_TEXT } from './etlListing.utils';
import type { EtlRowActions } from './useEtlListingPage';

const MENU_ITEMS: MenuProps['items'] = [
  { key: 'edit', label: 'Edit' },
  { key: 'share', label: 'Share', disabled: true, title: SHARE_NOT_READY_TEXT },
  { key: 'delete', label: 'Delete', danger: true }
];

/**
 * v1 `ETLJobActionCell`: Cancel while the ETL runs, Force Run otherwise, and a menu with Edit, Share and Delete (to the
 * trash). Clicks don't reach the row, which opens the editor.
 */
export function EtlActionsCell({ etl, actions }: { etl: EtlJob; actions: EtlRowActions }) {
  const running = canCancelEtl(etl);

  return (
    <span className="flex items-center gap-1">
      <Button
        type={running ? 'default' : 'primary'}
        className="w-24"
        disabled={actions.isBusy}
        onClick={event => {
          event.stopPropagation();
          if (running) actions.onCancel(etl);
          else actions.onForceRun(etl);
        }}
      >
        {running ? 'Cancel' : 'Force Run'}
      </Button>
      <Dropdown
        trigger={['click']}
        placement="bottomRight"
        menu={{
          items: MENU_ITEMS,
          onClick: ({ key, domEvent }) => {
            domEvent.stopPropagation();
            if (key === 'edit') actions.onOpen(etl);
            if (key === 'delete') actions.onTrash(etl);
          }
        }}
      >
        <Button
          type="text"
          icon={<MoreOutlined />}
          aria-label={`More actions for ${etl.displayName}`}
          onClick={event => event.stopPropagation()}
        />
      </Dropdown>
    </span>
  );
}
