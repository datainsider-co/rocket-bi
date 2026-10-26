import type { Meta, StoryObj } from '@storybook/react-vite';
import { MemoryRouter } from 'react-router';
import { fn } from 'storybook/test';
import { HeaderBarView } from './HeaderBarView';

const meta = {
  title: 'App/HeaderBar',
  component: HeaderBarView,
  decorators: [
    Story => (
      <MemoryRouter>
        <Story />
      </MemoryRouter>
    )
  ],
  args: {
    brand: { name: 'RocketBI', logoUrl: '' },
    pathname: '/mydata',
    account: { displayName: 'Hello World', avatarUrl: '', isLoggingOut: false, onLogout: fn() },
    theme: { isDark: false, onToggle: fn() }
  }
} satisfies Meta<typeof HeaderBarView>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Dashboards: Story = {};

export const DataWarehouse: Story = { args: { pathname: '/data-warehouse/schema' } };

export const LongOrganizationName: Story = {
  args: { brand: { name: 'A very long organization name that has to be truncated', logoUrl: '' } }
};
