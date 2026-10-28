import { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { Button, Typography } from 'antd';
import { SourceCatalogModal } from './SourceCatalogModal';
import type { AvailableSourceEntry } from './sourceCatalog';

/** Opens the catalog and shows what was picked; picking closes it, as the "Add Data Source" button will (DI4b). */
function Playground() {
  const [open, setOpen] = useState(true);
  const [picked, setPicked] = useState<AvailableSourceEntry | null>(null);

  return (
    <div className="flex flex-col items-start gap-2 p-4">
      <Button onClick={() => setOpen(true)}>Add Data Source</Button>
      <Typography.Text type="secondary">Picked: {picked ? `${picked.title} (${JSON.stringify(picked.form)})` : 'nothing yet'}</Typography.Text>
      <SourceCatalogModal
        open={open}
        onSelect={entry => {
          setPicked(entry);
          setOpen(false);
        }}
        onClose={() => setOpen(false)}
      />
    </div>
  );
}

const meta = {
  title: 'Ingestion/SourceCatalogModal',
  component: Playground,
  parameters: { layout: 'fullscreen' }
} satisfies Meta<typeof Playground>;

export default meta;
type Story = StoryObj<typeof meta>;

/** Available types are buttons; coming-soon types are dimmed and show a tooltip on hover. */
export const Default: Story = {};
