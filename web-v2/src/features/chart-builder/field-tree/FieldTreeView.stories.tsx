import { useMemo, useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import type { ChartControl } from '@/core/chart-builder/chartControls';
import { databaseSchemaFromJson } from '@/core/schema/SchemaService';
import schemaJson from '@/core/schema/database.fixture.json';
import { FieldDndProvider } from '@/shared/field-dnd/FieldDndProvider';
import { searchControls, searchTableNodes, tableNodesOf, toggled } from './fieldTree.utils';
import { FieldTreeView } from './FieldTreeView';

const nodes = tableNodesOf(databaseSchemaFromJson(schemaJson).tables);

const CONTROLS: ChartControl[] = [
  { id: -99887766, title: 'Main Date Filter', chartType: 'date_select_filter', infoType: 'Normal', data: {} },
  { id: 39, title: 'Region', chartType: 'tab_filter', infoType: 'Normal', data: {} },
  { id: 50, title: 'Group by', chartType: 'tab_filter', infoType: 'FunctionController', data: {} }
];

/** The view with its state kept here, the way `useFieldTree` keeps it. */
function Playground({ adhoc, status }: { adhoc: boolean; status: 'loading' | 'error' | 'ready' }) {
  const [keyword, setKeyword] = useState('');
  const [expanded, setExpanded] = useState<ReadonlySet<string>>(new Set(['sales']));
  const shown = useMemo(() => searchTableNodes(nodes, keyword), [keyword]);
  return (
    <FieldDndProvider zones={{}} onDrop={() => {}} renderOverlay={() => null}>
      <div className="h-[480px] w-60 rounded border border-black/10 p-2">
        <FieldTreeView
          databases={adhoc ? undefined : { options: [{ name: 'sample_v2', displayName: 'sample_v2' }], value: 'sample_v2', onChange: () => {} }}
          search={{ keyword, onChange: setKeyword }}
          tables={{ nodes: shown, expanded, onToggle: key => setExpanded(current => toggled(current, key)), status, error: 'Loading the sample_v2 database has failed' }}
          controls={adhoc ? undefined : searchControls(CONTROLS, keyword)}
        />
      </div>
    </FieldDndProvider>
  );
}

const meta = {
  title: 'ChartBuilder/FieldTree',
  component: Playground,
  args: { adhoc: false, status: 'ready' }
} satisfies Meta<typeof Playground>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Database: Story = {};
export const AdhocTable: Story = { args: { adhoc: true } };
export const Loading: Story = { args: { status: 'loading' } };
export const LoadFailed: Story = { args: { status: 'error' } };
