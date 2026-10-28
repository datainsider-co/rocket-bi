import { JobHistoryView } from './JobHistoryView';
import { useJobHistory } from './useJobHistory';

/** `/data-ingestion/job-history` (v1 `JobHistoryScreen.vue`). */
export function JobHistoryPage() {
  const { search, content, table, isFetching, reload } = useJobHistory();
  return (
    <JobHistoryView
      searchText={search.text}
      onSearchChange={search.onChange}
      content={content}
      table={table}
      isFetching={isFetching}
      onReload={reload}
    />
  );
}
