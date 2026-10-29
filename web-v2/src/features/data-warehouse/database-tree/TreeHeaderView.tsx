import { PlusOutlined, ReloadOutlined, SearchOutlined } from '@ant-design/icons';
import { Button, Input, Tooltip } from 'antd';
import type { TreeSearch } from './useDatabaseTree';

interface TreeHeaderViewProps {
  total: number;
  isRefreshing: boolean;
  onRefresh: () => void;
  onCreate: () => void;
  search: TreeSearch;
}

/** "DATABASE (n)" with Refresh, Create Database and Search, then the search box while searching (v1). */
export function TreeHeaderView({ total, isRefreshing, onRefresh, onCreate, search }: TreeHeaderViewProps) {
  return (
    <div className="shrink-0 px-4 pt-4 pb-2">
      <div className="flex items-center gap-1">
        <h2 className="m-0 flex-1 truncate text-sm font-semibold text-black/65 uppercase">Database ({total})</h2>
        <Tooltip title="Refresh">
          <Button type="text" size="small" icon={<ReloadOutlined spin={isRefreshing} />} aria-label="Refresh databases" onClick={onRefresh} />
        </Tooltip>
        <Tooltip title="Create database">
          <Button type="text" size="small" icon={<PlusOutlined />} aria-label="Create database" onClick={onCreate} />
        </Tooltip>
        <Tooltip title="Search">
          <Button
            type="text"
            size="small"
            icon={<SearchOutlined />}
            aria-label="Search databases"
            aria-pressed={search.isOpen}
            onClick={search.onToggle}
          />
        </Tooltip>
      </div>
      {search.isOpen && (
        <Input
          allowClear
          className="mt-2"
          placeholder="Search databases and tables"
          aria-label="Search databases and tables"
          value={search.text}
          onChange={event => search.onChange(event.target.value)}
        />
      )}
    </div>
  );
}
