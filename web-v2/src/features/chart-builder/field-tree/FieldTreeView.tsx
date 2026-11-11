import { useEffect, useRef, useState } from 'react';
import { Input, Select, type InputRef } from 'antd';
import type { ChartControl } from '@/core/chart-builder/chartControls';
import { ControlListView } from './ControlListView';
import type { DatabaseSelect, TreeTables } from './fieldTree.utils';
import { TableTreeView } from './TableTreeView';
import './FieldTree.css';

type Tab = 'database' | 'control';

const TABS: readonly { key: Tab; label: string; icon: string }[] = [
  { key: 'database', label: 'Database', icon: 'di-icon-database' },
  { key: 'control', label: 'Chart Control', icon: 'di-icon-filter-control' }
];

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
 * and the tables; a Chart Control tab with the dashboard's controls. The search placeholders are v1's.
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

  const searching = search.keyword.trim() !== '';

  return (
    <div className={`field-tree${controls ? '' : ' field-tree--plain'}`}>
      {controls && (
        <div className="field-tree__tabs" role="tablist">
          {TABS.map(item => (
            <button key={item.key} type="button" role="tab" className="field-tree__tab" aria-selected={tab === item.key} onClick={() => setTab(item.key)}>
              <i className={item.icon} aria-hidden />
              {item.label}
            </button>
          ))}
        </div>
      )}
      <div className="field-tree__listing">
        {showSelect ? (
          <div className="field-tree__select-row">
            <Select
              showSearch
              optionFilterProp="label"
              placeholder="Select database"
              value={databases.value}
              options={databases.options.map(option => ({ value: option.name, label: option.displayName }))}
              onChange={databases.onChange}
            />
            <button type="button" className="field-tree__search-button" aria-label="Search tables and columns" onClick={() => setSearchOpen(true)}>
              <img src="/icons/ic_search.svg" alt="" width={16} height={16} />
            </button>
          </div>
        ) : (
          <Input
            ref={searchRef}
            className="field-tree__search"
            allowClear
            prefix={<img src="/icons/ic_search.svg" alt="" width={16} height={16} />}
            placeholder={onDatabaseTab ? 'Search tables & columns...' : 'Search tab controls...'}
            value={search.keyword}
            onChange={event => search.onChange(event.target.value)}
            onBlur={() => search.keyword === '' && setSearchOpen(false)}
          />
        )}
        <div className="field-tree__body">
          {onDatabaseTab ? <TableTreeView tables={tables} searching={searching} /> : <ControlListView controls={controls} searching={searching} />}
        </div>
      </div>
    </div>
  );
}
