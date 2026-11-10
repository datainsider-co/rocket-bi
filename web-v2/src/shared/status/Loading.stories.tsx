import type { Meta, StoryObj } from '@storybook/react-vite';
import { Loading } from './Loading';

const meta = {
  title: 'Shared/Status/Loading',
  component: Loading,
  decorators: [
    Story => (
      <div style={{ width: 400, height: 300, border: '1px solid #e5e5e5' }}>
        <Story />
      </div>
    )
  ]
} satisfies Meta<typeof Loading>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const Small: Story = { args: { mode: 'small' } };
