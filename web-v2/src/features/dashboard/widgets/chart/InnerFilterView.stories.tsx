import { useState, type CSSProperties } from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { DashboardStoryFrame } from '../../theme/DashboardStoryFrame';
import '../../charts/filter/FilterWidget.css';
import { InnerFilterView, type InnerFilterViewProps } from './InnerFilterView';

const OPTIONS = ['Asia', 'Australia and Oceania', 'Central America and the Caribbean', 'Europe'].map(value => ({ label: value, value }));

function Playground(props: Pick<InnerFilterViewProps, 'asTabs' | 'compact'>) {
  const [selected, setSelected] = useState<string[]>([]);
  return (
    <InnerFilterView
      {...props}
      label="Region"
      options={OPTIONS}
      selected={selected}
      loading={false}
      style={{ '--filter-active': 'var(--tab-filter-background-active)', '--filter-de-active': 'var(--tab-filter-background-de-active)' } as CSSProperties}
      onChange={setSelected}
    />
  );
}

const meta = {
  title: 'Dashboard/Widgets/InnerFilterView',
  component: Playground,
  args: { asTabs: true, compact: false },
  decorators: [
    Story => (
      <DashboardStoryFrame style={{ padding: 24, minHeight: 320 }}>
        <Story />
      </DashboardStoryFrame>
    )
  ]
} satisfies Meta<typeof Playground>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Tabs: Story = {};

export const Dropdown: Story = { args: { asTabs: false } };

export const IconWithTabs: Story = { args: { compact: true } };

export const IconWithList: Story = { args: { asTabs: false, compact: true } };
