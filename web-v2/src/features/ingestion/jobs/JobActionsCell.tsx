import { MoreOutlined } from '@ant-design/icons';
import { Button, Dropdown, type MenuProps } from 'antd';
import { canCancelJob, type Job } from '@/core/ingestion/Job';
import { isEditableJob, NOT_EDITABLE_JOB_TEXT } from './jobs.utils';

export interface JobRowActions {
  readonly onForceSync: (job: Job) => void;
  readonly onCancel: (job: Job) => void;
  readonly onEdit: (job: Job) => void;
  readonly onDelete: (job: Job) => void;
  /** A sync or cancel is on its way. */
  readonly isBusy: boolean;
}

/**
 * v1 `JobActionCell`: Cancel while the job runs, Force Sync otherwise, and a menu with Edit (disabled for job types v2
 * can't edit) and Delete. Clicks don't reach the row (the menu is a portal, but React events still bubble to it).
 */
export function JobActionsCell({ job, actions }: { job: Job; actions: JobRowActions }) {
  const editable = isEditableJob(job);
  const items: MenuProps['items'] = [
    { key: 'edit', label: 'Edit', disabled: !editable, title: editable ? undefined : NOT_EDITABLE_JOB_TEXT },
    { key: 'delete', label: 'Delete', danger: true }
  ];

  return (
    <span className="flex items-center gap-1">
      {canCancelJob(job) ? (
        <Button
          className="w-24"
          disabled={actions.isBusy}
          onClick={event => {
            event.stopPropagation();
            actions.onCancel(job);
          }}
        >
          Cancel
        </Button>
      ) : (
        <Button
          type="primary"
          className="w-24"
          disabled={actions.isBusy}
          onClick={event => {
            event.stopPropagation();
            actions.onForceSync(job);
          }}
        >
          Force Sync
        </Button>
      )}
      <Dropdown
        trigger={['click']}
        placement="bottomRight"
        menu={{
          items,
          onClick: ({ key, domEvent }) => {
            domEvent.stopPropagation();
            if (key === 'edit') actions.onEdit(job);
            if (key === 'delete') actions.onDelete(job);
          }
        }}
      >
        <Button
          type="text"
          icon={<MoreOutlined />}
          aria-label={`More actions for ${job.displayName}`}
          onClick={event => event.stopPropagation()}
        />
      </Dropdown>
    </span>
  );
}
