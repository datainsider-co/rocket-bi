import type { Meta, StoryObj } from '@storybook/react-vite';
import { EmptyData } from './EmptyData';

const meta = {
  title: 'Shared/Status/EmptyData',
  component: EmptyData,
  args: { children: 'No data' },
  decorators: [
    Story => (
      <div style={{ width: 400, height: 300, border: '1px solid #e5e5e5' }}>
        <Story />
      </div>
    )
  ]
} satisfies Meta<typeof EmptyData>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const CustomText: Story = { args: { children: 'No data to display' } };
