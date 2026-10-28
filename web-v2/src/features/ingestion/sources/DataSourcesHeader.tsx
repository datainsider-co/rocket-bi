import { Button, Input } from 'antd';
import { SearchOutlined } from '@ant-design/icons';
import { getIngestionSection, IngestionSection } from '../ingestion.utils';
import { IngestionPageHeader } from '../layout/IngestionPageHeader';

interface DataSourcesHeaderProps {
  isRefreshing: boolean;
  /** Called on every change; the caller debounces. */
  onSearch: (keyword: string) => void;
  onRefresh: () => void;
}

/** v1 `DataSourceScreen` header: title, "Search data source", Refresh. Delete and Add come with DI3b and DI4b. */
export function DataSourcesHeader({ isRefreshing, onSearch, onRefresh }: DataSourcesHeaderProps) {
  return (
    <IngestionPageHeader
      section={getIngestionSection(IngestionSection.DataSources)}
      actions={
        <>
          <Input
            allowClear
            aria-label="Search data source"
            placeholder="Search data source"
            prefix={<SearchOutlined />}
            className="w-40 sm:w-60"
            onChange={event => onSearch(event.target.value)}
          />
          <Button aria-label="Refresh" icon={<i className="di-icon-reset" />} loading={isRefreshing} onClick={onRefresh}>
            <span className="hidden sm:inline">Refresh</span>
          </Button>
        </>
      }
    />
  );
}
