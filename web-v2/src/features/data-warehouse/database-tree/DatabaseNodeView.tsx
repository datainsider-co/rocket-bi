import type { ReactNode } from 'react';
import { DownOutlined, RightOutlined } from '@ant-design/icons';
import { Spin } from 'antd';
import type { TreeDatabase } from './databaseTree.utils';

interface DatabaseNodeViewProps {
  database: TreeDatabase;
  open: boolean;
  selected: boolean;
  /** Its schema is loading for the first time. */
  loading: boolean;
  /** Why its schema failed to load. */
  error: string | undefined;
  onClick: (name: string) => void;
  /** The table rows, shown while open. */
  children: ReactNode;
}

/** A database: a click opens or closes it (and the page may show it); open, its tables (v1). */
export function DatabaseNodeView({ database, open, selected, loading, error, onClick, children }: DatabaseNodeViewProps) {
  const empty = database.tables?.length === 0;
  return (
    <li>
      <button
        type="button"
        aria-expanded={open}
        aria-current={selected || undefined}
        className={`flex w-full cursor-pointer [font-family:inherit] [font-size:inherit] items-center gap-2 rounded border-0 px-4 py-2 text-left font-medium text-inherit hover:bg-black/5 ${selected ? 'bg-black/5' : 'bg-transparent'}`}
        onClick={() => onClick(database.name)}
      >
        <i className="di-icon-database text-black/60" aria-hidden />
        <span className="min-w-0 flex-1 truncate">{database.title}</span>
        {open ? <DownOutlined className="text-xs" aria-hidden /> : <RightOutlined className="text-xs" aria-hidden />}
      </button>
      {open && (
        <div className="pl-4">
          {loading && <Spin size="small" className="my-2 ml-6 block" />}
          {error && <p className="my-1 ml-6 text-xs text-[var(--ant-color-error,#ff4d4f)]">{error}</p>}
          {empty && <p className="my-1 ml-6 text-xs text-black/45">No tables</p>}
          <ul className="m-0 list-none p-0" aria-label={`Tables of ${database.title}`}>
            {children}
          </ul>
        </div>
      )}
    </li>
  );
}
