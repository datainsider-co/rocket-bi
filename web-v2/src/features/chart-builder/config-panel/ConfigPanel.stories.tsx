import { useMemo, useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { DiProvider } from '@/app/di/DiContext';
import stored from '@/core/chart-builder/builder.fixture.json';
import { ChartType } from '@/core/chart-builder/chartType';
import type { ChartControl } from '@/core/chart-builder/chartControls';
import { createContainer } from '@/core/di/Container';
import { QueryService } from '@/core/query/QueryService';
import { visualizationResponseFromJson } from '@/core/query/VisualizationResponse';
import { databaseSchemaFromJson } from '@/core/schema/SchemaService';
import schemaJson from '@/core/schema/database.fixture.json';
import { BuilderDndProvider } from '../dnd/BuilderDndProvider';
import { searchTableNodes, tableNodesOf, toggled } from '../field-tree/fieldTree.utils';
import { FieldTreeView } from '../field-tree/FieldTreeView';
import { BuilderProvider, useBuilder } from '../state/BuilderContext';
import type { BuilderStart } from '../state/useBuilderState';
import { ConfigPanel } from './ConfigPanel';
import { FieldChoicesContext } from './FieldChoicesContext';

const nodes = tableNodesOf(databaseSchemaFromJson(schemaJson).tables);

const CONTROLS: ChartControl[] = [
  { id: -99887766, title: 'Main Date Filter', chartType: 'date_select_filter', infoType: 'Normal', data: { id: -99887766 } },
  { id: 39, title: 'Region', chartType: 'tab_filter', infoType: 'Normal', data: { id: 39 } },
  { id: 50, title: 'Group by', chartType: 'tab_filter', infoType: 'FunctionController', data: { id: 50, display_name: 'Group by', table_columns: [], default_table_columns: [] } }
];

/** Answers every column's values with the same few, as the local backend would. */
const container = createContainer([
  di =>
    di.bindValue(QueryService, {
      query: async () =>
        visualizationResponseFromJson({
          class_name: 'json_table_response',
          headers: [{ key: '0', label: 'value', is_group_by: false, is_text_left: true, formatter_key: '' }],
          records: ['Asia', 'Europe', 'Africa', 'North America'].map(value => ({ '0': value })),
          total: 4
        }),
      queryAs: () => Promise.reject(new Error('not in stories')),
      export: () => Promise.reject(new Error('not in stories'))
    })
]);

/** The builder's data and setting, to see what a drop or an edit did. */
function StatePreview() {
  const { state, setting } = useBuilder();
  return <pre className="m-0 max-h-[560px] flex-1 overflow-auto text-xs">{JSON.stringify({ data: state.data, filters: setting?.['filters'] }, null, 2)}</pre>;
}

/** A static field tree beside the panel, the way the builder modal will place them. */
function Tree() {
  const [keyword, setKeyword] = useState('');
  const [expanded, setExpanded] = useState<ReadonlySet<string>>(new Set(['sales']));
  const shown = useMemo(() => searchTableNodes(nodes, keyword), [keyword]);
  return (
    <FieldTreeView
      search={{ keyword, onChange: setKeyword }}
      tables={{ nodes: shown, expanded, onToggle: key => setExpanded(current => toggled(current, key)), status: 'ready', error: '' }}
      controls={CONTROLS}
    />
  );
}

function Playground({ start }: { start: BuilderStart }) {
  const queryClient = useMemo(() => new QueryClient(), []);
  return (
    <DiProvider container={container}>
      <QueryClientProvider client={queryClient}>
        <BuilderProvider start={start} controls={CONTROLS}>
          <BuilderDndProvider>
            <div className="flex h-[600px] gap-4">
              <div className="w-60 shrink-0 rounded border border-black/10 p-2">
                <Tree />
              </div>
              <div className="w-80 shrink-0 overflow-auto">
                <FieldChoicesContext value={nodes}>
                  <ConfigPanel />
                </FieldChoicesContext>
              </div>
              <StatePreview />
            </div>
          </BuilderDndProvider>
        </BuilderProvider>
      </QueryClientProvider>
    </DiProvider>
  );
}

const widget = (id: number) => stored.widgets.find(item => item.id === id) ?? {};

const meta = {
  title: 'ChartBuilder/ConfigPanel',
  component: Playground,
  args: { start: { chartType: ChartType.Column } }
} satisfies Meta<typeof Playground>;

export default meta;

type Story = StoryObj<typeof meta>;

export const NewColumn: Story = {};
export const StoredColumn: Story = { args: { start: { widget: widget(31) } } };
export const FilterOnControl: Story = { args: { start: { widget: widget(48) } } };
export const Table: Story = { args: { start: { chartType: ChartType.Table } } };
export const Slicer: Story = { args: { start: { chartType: ChartType.SlicerFilter } } };
