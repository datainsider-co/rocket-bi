import { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { FilterCondition, type InternalFilter } from '@/core/query/internalFilter';
import { HeaderFilterBarView } from './HeaderFilterBarView';
import '../../theme/dashboardTheme.css';

const field = (name: string, type: string) => ({ class_name: 'table_field', db_name: 'sample_v2', tbl_name: 'sales', field_name: name, field_type: type });

/** What a drill through from a region, then a price bin, opens a dashboard with. */
const filters: InternalFilter[] = [
  { id: -1, name: 'Region', field: field('region', 'string'), condition: FilterCondition.In, values: ['Asia', 'Europe'], enabled: true, nested: false },
  { id: -2, name: 'Unit price', field: field('unit_price', 'double'), condition: FilterCondition.Between, values: ['10', '20'], enabled: true, nested: false },
  { id: -3, name: 'Order date', field: field('order_date', 'datetime'), condition: FilterCondition.LastNDays, values: ['30'], enabled: false, nested: false },
  { id: -4, name: 'Country', field: field('country', 'string'), condition: FilterCondition.In, values: [], enabled: true, nested: false }
];

/** Keeps the edits the way the dashboard's controls do. */
function Playground() {
  const [items, setItems] = useState(filters);
  return (
    <div className="dashboard-theme" data-dashboard-theme="light-default">
      <HeaderFilterBarView
        filters={items}
        onChange={next => setItems(current => current.map(item => (item.id === next.id ? next : item)))}
        onRemove={id => setItems(current => current.filter(item => item.id !== id))}
      />
    </div>
  );
}

const meta = {
  title: 'Dashboard/HeaderFilterBar',
  component: Playground
} satisfies Meta<typeof Playground>;

export default meta;

export const Default: StoryObj<typeof meta> = {};
