import { useEffect, useRef, useState } from 'react';
import { SearchOutlined } from '@ant-design/icons';
import { Button, Input, Segmented, Select, type InputRef } from 'antd';
import type { ChartControl } from '@/core/chart-builder/chartControls';
import { ControlListView } from './ControlListView';
import type { DatabaseSelect, TreeTables } from './fieldTree.utils';
import { TableTreeView } from './TableTreeView';

type Tab = 'database' | 'control';

export interface FieldTreeViewProps {
  /** The database dropdown; none for an ad hoc chart, which only searches. */
  databases?: DatabaseSelect;
  search: { keyword: string; onChange: (keyword: string) => void };
  tables: TreeTables;
  /** The Chart Control tab's list; no tab without it (v1 `useTabControl`). */
  controls?: readonly ChartControl[];
}

/**
 * The builder's field tree (v1 `DatabaseListing`): a Database tab with the database dropdown, a search toggled from it,
 * and the tables; a Chart Control tab with the dashboard's controls.
 */
export function FieldTreeView({ databases, search, tables, controls }: FieldTreeViewProps) {
  const [tab, setTab] = useState<Tab>('database');
  const [searchOpen, setSearchOpen] = useState(false);
  const searchRef = useRef<InputRef>(null);
  // The search box replaces the dropdown when its button is clicked, ready to type.
  useEffect(() => {
    if (searchOpen) searchRef.current?.focus();
  }, [searchOpen]);
  const onDatabaseTab = tab === 'database' || !controls;
  const showSelect = onDatabaseTab && databases && !searchOpen;

  return (
    <div className="flex h-full min-h-0 flex-col gap-2">
      {controls && (
        <Segmented<Tab>
          block
          size="small"
          className="text-xs"
          value={tab}
          onChange={setTab}
          options={[
            { value: 'database', label: 'Database', icon: <i className="di-icon-database" aria-hidden /> },
            { value: 'control', label: 'Chart Control', icon: <i className="di-icon-filter-control" aria-hidden /> }
          ]}
        />
      )}
      {showSelect ? (
        <div className="flex items-center gap-2">
          <Select
            className="min-w-0 flex-1"
            showSearch
            optionFilterProp="label"
            placeholder="Select database"
            value={databases.value}
            options={databases.options.map(option => ({ value: option.name, label: option.displayName }))}
            onChange={databases.onChange}
          />
          <Button type="text" icon={<SearchOutlined />} aria-label="Search tables and columns" onClick={() => setSearchOpen(true)} />
        </div>
      ) : (
        <Input
          ref={searchRef}
          allowClear
          prefix={<SearchOutlined aria-hidden />}
          placeholder={onDatabaseTab ? 'Search tables & columns...' : 'Search chart controls...'}
          value={search.keyword}
          onChange={event => search.onChange(event.target.value)}
          onBlur={() => search.keyword === '' && setSearchOpen(false)}
        />
      )}
      <div className="min-h-0 flex-1 overflow-auto">{onDatabaseTab ? <TableTreeView tables={tables} /> : <ControlListView controls={controls} />}</div>
    </div>
  );
}
