import { Button, Typography } from 'antd';

interface HistoryEmptyStateProps {
  isSearching: boolean;
  onAddJob: () => void;
}

/** v1 `LayoutNoData` of Job History, with its "Click here" link to the job form. A search with no match says so instead. */
export function HistoryEmptyState({ isSearching, onAddJob }: HistoryEmptyStateProps) {
  return (
    <div className="flex min-h-[240px] flex-1 flex-col items-center justify-center gap-2 rounded">
      <i className="di-icon-job-history text-4xl opacity-60" />
      {isSearching ? (
        <Typography.Text type="secondary">No job history matches your search</Typography.Text>
      ) : (
        <>
          <Typography.Text strong>No data yet</Typography.Text>
          <Typography.Text type="secondary">
            <Button type="link" className="!p-0" onClick={onAddJob}>
              Click here
            </Button>{' '}
            to add a Job
          </Typography.Text>
        </>
      )}
    </div>
  );
}
