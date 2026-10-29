import { Button, Input } from 'antd';
import { DeleteOutlined, PlusOutlined, SearchOutlined } from '@ant-design/icons';
import { getIngestionSection, IngestionSection } from '../ingestion.utils';
import { PageHeader } from '@/shared/layout/PageHeader';

interface DataSourcesHeaderProps {
  isRefreshing: boolean;
  /** Checked rows; Delete shows while there are some. */
  selectedCount: number;
  /** Called on every change; the caller debounces. */
  onSearch: (keyword: string) => void;
  onRefresh: () => void;
  onDeleteSelected: () => void;
  onAdd: () => void;
}

/**
 * v1 `DataSourceScreen` header: "Search data source", Delete for the checked rows, Refresh. Add Data Source was in
 * v1's sidebar; it sits with the other actions here.
 */
const SECTION = getIngestionSection(IngestionSection.DataSources);

export function DataSourcesHeader({ isRefreshing, selectedCount, onSearch, onRefresh, onDeleteSelected, onAdd }: DataSourcesHeaderProps) {
  return (
    <PageHeader
      icon={SECTION.icon}
      title={SECTION.title}
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
          {selectedCount > 0 && (
            <Button danger icon={<DeleteOutlined />} onClick={onDeleteSelected}>
              Delete ({selectedCount})
            </Button>
          )}
          <Button aria-label="Refresh" icon={<i className="di-icon-reset" />} loading={isRefreshing} onClick={onRefresh}>
            <span className="hidden sm:inline">Refresh</span>
          </Button>
          <Button type="primary" icon={<PlusOutlined />} onClick={onAdd}>
            Add Data Source
          </Button>
        </>
      }
    />
  );
}
