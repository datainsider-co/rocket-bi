import type { Meta, StoryObj } from '@storybook/react-vite';
import { Input } from 'antd';
import { DialogScope } from '../theme/DialogScope';
import { ConfirmDialogView } from './ConfirmDialogView';
import { CustomDialog } from './CustomDialog';
import { HeaderDialog } from './HeaderDialog';

const noop = () => undefined;

/** The dashboard's dialog shells, in the layer the page opens them in: light with the default accent in every theme. */
const meta = {
  title: 'Dashboard/Dialogs',
  decorators: [
    Story => (
      <DialogScope>
        <Story />
      </DialogScope>
    )
  ]
} satisfies Meta;

export default meta;
type Story = StoryObj<typeof meta>;

export const Custom: Story = {
  render: () => (
    <CustomDialog title="Rename Dashboard" okText="Rename" onOk={noop} onCancel={noop}>
      <label htmlFor="story-name" className="custom-dialog__label">
        Dashboard Name
      </label>
      <Input id="story-name" placeholder="Input your title" defaultValue="Sales" />
      <div className="custom-dialog__error">Field is required.</div>
    </CustomDialog>
  )
};

export const Header: Story = {
  render: () => (
    <HeaderDialog title="Sort Orders" subtitle="Drag to customize the order" actionName="Save" width={444} onSubmit={noop} onCancel={noop}>
      <div style={{ height: 120 }}>The dialog's content</div>
    </HeaderDialog>
  )
};

export const HeaderOnGrey: Story = {
  render: () => (
    <HeaderDialog title="Config Tab" actionName="Save" width={800} grey onSubmit={noop} onCancel={noop}>
      <div style={{ height: 120, borderRadius: 4, background: '#fff' }} />
    </HeaderDialog>
  )
};

export const Confirm: Story = {
  render: () => <ConfirmDialogView title="Remove widget" message="Are you sure that you want to remove this widget?" onOk={noop} onCancel={noop} />
};
