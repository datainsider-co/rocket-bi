import { JobFormModal } from '../job-form/JobFormModal';
import { JobHistoryView } from './JobHistoryView';
import { useAddJobDialog } from './useAddJobDialog';
import { useJobHistory } from './useJobHistory';

const NEW_JOB = { mode: 'create', lockSource: false } as const;

/** `/data-ingestion/job-history` (v1 `JobHistoryScreen.vue`). */
export function JobHistoryPage() {
  const { search, content, table, isFetching, reload } = useJobHistory();
  const addJob = useAddJobDialog();
  return (
    <>
      <JobHistoryView
        searchText={search.text}
        onSearchChange={search.onChange}
        content={content}
        table={table}
        isFetching={isFetching}
        onReload={reload}
        onAddJob={addJob.open}
      />
      {addJob.isOpen && <JobFormModal target={NEW_JOB} onSaved={addJob.onSaved} onClose={addJob.close} />}
    </>
  );
}
