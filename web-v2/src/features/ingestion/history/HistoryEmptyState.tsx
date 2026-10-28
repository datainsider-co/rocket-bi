import { Typography } from 'antd';

/**
 * v1 `LayoutNoData` of Job History, without its "Click here to add Job History" link (it opens the job form, which
 * lands with DI6). A search with no match says so instead.
 */
export function HistoryEmptyState({ isSearching }: { isSearching: boolean }) {
  return (
    <div className="flex min-h-[240px] flex-1 flex-col items-center justify-center gap-2 rounded">
      <i className="di-icon-job-history text-4xl opacity-60" />
      {isSearching ? (
        <Typography.Text type="secondary">No job history matches your search</Typography.Text>
      ) : (
        <Typography.Text strong>No data yet</Typography.Text>
      )}
    </div>
  );
}
