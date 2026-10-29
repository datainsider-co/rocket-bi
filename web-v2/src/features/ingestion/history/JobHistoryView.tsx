import { ReloadOutlined, SearchOutlined } from '@ant-design/icons';
import { Button, Input, Result } from 'antd';
import { getIngestionSection, IngestionSection } from '../ingestion.utils';
import { PageHeader } from '@/shared/layout/PageHeader';
import { HistoryEmptyState } from './HistoryEmptyState';
import type { HistoryContent } from './jobHistory.utils';
import { JobHistoryTable } from './JobHistoryTable';
import type { JobHistoryTableState } from './useJobHistory';

const SECTION = getIngestionSection(IngestionSection.JobHistory);

interface JobHistoryViewProps {
  searchText: string;
  onSearchChange: (text: string) => void;
  content: HistoryContent;
  table: JobHistoryTableState;
  isFetching: boolean;
  /** Refresh in the header, and Retry after an error. */
  onReload: () => void;
  onAddJob: () => void;
}

/** Job History: header with search and Refresh, then the runs, the error or the empty state. */
export function JobHistoryView({ searchText, onSearchChange, content, table, isFetching, onReload, onAddJob }: JobHistoryViewProps) {
  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <PageHeader
        icon={SECTION.icon}
        title={SECTION.title}
        actions={
          <>
            <Input
              allowClear
              className="w-60"
              aria-label="Search job history"
              placeholder="Search job history"
              prefix={<SearchOutlined />}
              value={searchText}
              onChange={event => onSearchChange(event.target.value)}
            />
            <Button icon={<ReloadOutlined />} loading={isFetching && content.kind !== 'error'} onClick={onReload}>
              Refresh
            </Button>
          </>
        }
      />
      <div className="min-h-0 flex-1 overflow-auto">
        {content.kind === 'error' && (
          <Result
            status="error"
            title="Could not load the job history"
            subTitle={content.message}
            extra={
              <Button type="primary" loading={isFetching} onClick={onReload}>
                Retry
              </Button>
            }
          />
        )}
        {content.kind === 'empty' && <HistoryEmptyState isSearching={content.isSearching} onAddJob={onAddJob} />}
        {content.kind === 'table' && <JobHistoryTable {...table} />}
      </div>
    </div>
  );
}
