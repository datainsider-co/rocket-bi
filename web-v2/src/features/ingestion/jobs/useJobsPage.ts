import { useCallback, useMemo, useState } from 'react';
import { App } from 'antd';
import type { Job } from '@/core/ingestion/Job';
import type { IngestionSection } from '../ingestion.utils';
import { jobSavedMessage, type JobFormTarget, type JobSavePlan } from '../job-form/jobForm.utils';
import { useRowSelection } from '../listing/useRowSelection';
import type { JobRowActions } from './JobActionsCell';
import { isEditableJob } from './jobs.utils';
import type { JobSelection } from './JobsTable';
import { useJobActions } from './useJobActions';
import { useJobsListing, type JobsListing } from './useJobsListing';

/** What the jobs page does besides listing: checked rows, row and header actions. */
export interface JobsPageActions {
  readonly selection: JobSelection;
  readonly rowActions: JobRowActions;
  readonly onAdd: () => void;
  readonly onForceSyncSelected: () => void;
  readonly onDeleteSelected: () => void;
}

export interface JobFormDialog {
  /** The job form is open on it; closed when `undefined`. */
  readonly target: JobFormTarget | undefined;
  readonly onSaved: (plan: JobSavePlan) => void;
  readonly onClose: () => void;
}

/** One jobs page (Jobs or Queued Jobs): the listing, its actions and the job form for Add Job and Edit. */
export function useJobsPage(section: IngestionSection): { listing: JobsListing; actions: JobsPageActions; dialog: JobFormDialog } {
  const listing = useJobsListing(section);
  const { jobs } = listing.table;
  const pageIds = useMemo(() => jobs.map(info => info.job.id), [jobs]);
  const selection = useRowSelection(pageIds);
  const { forceSync, cancel, confirmDelete, isBusy } = useJobActions();
  const [target, setTarget] = useState<JobFormTarget>();
  const { message } = App.useApp();
  const selectedJobs = jobs.filter(info => selection.selectedIds.includes(info.job.id)).map(info => info.job);

  const onClose = useCallback(() => setTarget(undefined), []);
  const onSaved = useCallback(
    (plan: JobSavePlan) => {
      void message.success(jobSavedMessage(plan));
      setTarget(undefined);
    },
    [message]
  );

  return {
    listing,
    actions: {
      selection: { selectedIds: selection.selectedIds, onChange: selection.setSelected },
      rowActions: {
        onForceSync: (job: Job) => forceSync([job]),
        onCancel: cancel,
        onEdit: (job: Job) => {
          if (isEditableJob(job)) setTarget({ mode: 'edit', job });
        },
        onDelete: (job: Job) => confirmDelete([job]),
        isBusy
      },
      onAdd: () => setTarget({ mode: 'create', lockSource: false }),
      // v1 unchecked the rows after a bulk force sync.
      onForceSyncSelected: () => {
        forceSync(selectedJobs);
        selection.clear();
      },
      onDeleteSelected: () => confirmDelete(selectedJobs)
    },
    dialog: { target, onSaved, onClose }
  };
}
