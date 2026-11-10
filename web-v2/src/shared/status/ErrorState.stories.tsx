import type { Meta, StoryObj } from '@storybook/react-vite';
import { ErrorState } from './ErrorState';

const meta = {
  title: 'Shared/Status/ErrorState',
  component: ErrorState,
  decorators: [
    Story => (
      <div style={{ width: 400, height: 300, border: '1px solid #e5e5e5' }}>
        <Story />
      </div>
    )
  ]
} satisfies Meta<typeof ErrorState>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const WithRetry: Story = {
  args: { message: 'Table "sales" does not exist. '.repeat(12), onRetry: () => undefined }
};
