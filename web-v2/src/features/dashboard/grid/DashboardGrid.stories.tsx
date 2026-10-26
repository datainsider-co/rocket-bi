import { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { Card } from 'antd';
import type { Position, PositionMap, WidgetId } from '@/core/dashboard/Position';
import { DashboardGrid } from './DashboardGrid';
import { NESTED_GRID_MARGIN } from './dashboardGrid.utils';

const TAB_WIDGET_ID = 4;

const dashboard: PositionMap = {
  1: { row: 0, column: 0, width: 16, height: 6, zIndex: 1 },
  2: { row: 0, column: 16, width: 16, height: 6, zIndex: 2 },
  3: { row: 0, column: 32, width: 16, height: 10, zIndex: 3 },
  [TAB_WIDGET_ID]: { row: 6, column: 0, width: 32, height: 10, zIndex: 4 },
  // Created by v1 and never placed: the grid finds it a free slot.
  5: { row: -1, column: -1, width: 12, height: 4, zIndex: 1 }
};

const insideTab: PositionMap = {
  11: { row: 0, column: 0, width: 24, height: 4, zIndex: 0 },
  12: { row: 0, column: 24, width: 24, height: 4, zIndex: 0 }
};

function merge(positions: PositionMap, changed: Record<WidgetId, Position>): PositionMap {
  return { ...positions, ...changed };
}

/** Holds positions the way the dashboard page will: one map per grid, changes merged in. */
function Playground({ editable, overlap, mobile }: { editable: boolean; overlap: boolean; mobile: boolean }) {
  const [positions, setPositions] = useState(dashboard);
  const [tabPositions, setTabPositions] = useState(insideTab);

  const renderTab = () => (
    <Card size="small" title="Tab widget (drag me by the title)" className="h-full" styles={{ body: { padding: 0 } }}>
      <DashboardGrid
        positions={tabPositions}
        editable={editable}
        mobile={mobile}
        margin={NESTED_GRID_MARGIN}
        onPositionsChange={changed => setTabPositions(current => merge(current, changed))}
        renderItem={id => <Card size="small" className="h-full">Chart {id} in tab</Card>}
      />
    </Card>
  );

  return (
    <div className="flex flex-col gap-4">
      <div className="h-[600px] overflow-auto bg-gray-100">
        <DashboardGrid
          positions={positions}
          editable={editable}
          overlap={overlap}
          mobile={mobile}
          onPositionsChange={changed => setPositions(current => merge(current, changed))}
          renderItem={id =>
            id === TAB_WIDGET_ID ? (
              renderTab()
            ) : (
              <Card size="small" title={`Widget ${id}`} className="h-full">
                <input className="dashboard-grid-no-drag border" placeholder="Typing here doesn't drag" />
              </Card>
            )
          }
        />
      </div>
      <pre className="text-xs">{JSON.stringify(positions)}</pre>
    </div>
  );
}

const meta = {
  title: 'Dashboard/DashboardGrid',
  component: Playground,
  args: { editable: true, overlap: false, mobile: false }
} satisfies Meta<typeof Playground>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Edit: Story = {};

export const Overlap: Story = { args: { overlap: true } };

export const View: Story = { args: { editable: false } };

export const Mobile: Story = { args: { mobile: true } };
