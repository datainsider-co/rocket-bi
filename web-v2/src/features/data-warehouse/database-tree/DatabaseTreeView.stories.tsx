import { useMemo, useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { databaseSchemaFromJson } from '@/core/schema/SchemaService';
import schemaJson from '@/core/schema/database.fixture.json';
import { filterDatabases, toggleKey, type TreeHandlers } from './databaseTree.utils';
import { DatabaseTreeView } from './DatabaseTreeView';
import type { DatabaseTreeModel } from './useDatabaseTree';

const sample = databaseSchemaFromJson(schemaJson);
const DATABASES = [
  { name: 'analytics', displayName: 'analytics' },
  { name: sample.name, displayName: sample.name },
  { name: 'staging', displayName: 'staging' }
];
const SCHEMAS = new Map([[sample.name, sample]]);

/** Menus as the Schema page will give them; the actions only log here. */
const HANDLERS: TreeHandlers = {
  onSelectTable: table => console.info('select table', table.name),
  tableActionsOf: () => [
    { key: 'addCalculated', label: 'Add calculated field' },
    { key: 'addMeasure', label: 'Add measure' },
    { key: 'delete', label: 'Delete table', danger: true }
  ],
  onTableAction: (table, action) => console.info('table action', table.name, action),
  draggableTables: true
};

/** The view with its state kept here, the way `useDatabaseTree` keeps it; `analytics` is still loading. */
function Playground({ status }: { status: DatabaseTreeModel['data']['status'] }) {
  const [openDatabases, setOpenDatabases] = useState<ReadonlySet<string>>(new Set([sample.name, 'analytics']));
  const [openTables, setOpenTables] = useState<ReadonlySet<string>>(new Set());
  const [search, setSearch] = useState({ isOpen: false, text: '' });
  const databases = useMemo(() => filterDatabases(DATABASES, SCHEMAS, search.isOpen ? search.text : ''), [search]);
  const model: DatabaseTreeModel = {
    data: {
      status,
      error: 'Failed to fetch',
      all: DATABASES,
      databases,
      loading: new Set(['analytics']),
      errors: new Map(),
      isRefreshing: false,
      refresh: () => console.info('refresh')
    },
    expansion: {
      openDatabases,
      openTables,
      toggleDatabase: name => setOpenDatabases(keys => toggleKey(keys, name)),
      toggleTable: key => setOpenTables(keys => toggleKey(keys, key))
    },
    search: {
      ...search,
      onToggle: () => setSearch(current => ({ isOpen: !current.isOpen, text: '' })),
      onChange: text => setSearch(current => ({ ...current, text }))
    },
    create: { isOpen: false, isSubmitting: false, error: undefined, open: () => console.info('create'), close: () => {}, submit: () => {} },
    onDatabaseClick: name => setOpenDatabases(keys => toggleKey(keys, name))
  };
  return (
    <div className="h-[560px] w-[340px] bg-[#f2f2f7] p-2">
      <DatabaseTreeView model={model} selection={{ dbName: sample.name, tableName: 'sales' }} handlers={HANDLERS} />
    </div>
  );
}

const meta = {
  title: 'Data Warehouse/DatabaseTreeView',
  component: Playground,
  args: { status: 'ready' }
} satisfies Meta<typeof Playground>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Ready: Story = {};
export const Loading: Story = { args: { status: 'loading' } };
export const Failed: Story = { args: { status: 'error' } };
