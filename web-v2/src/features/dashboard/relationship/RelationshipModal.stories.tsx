import { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Button } from 'antd';
import { DiProvider } from '@/app/di/DiContext';
import { createContainer } from '@/core/di/Container';
import { RelationshipService } from '@/core/relationship/RelationshipService';
import { SchemaService } from '@/core/schema/SchemaService';
import { fixtureRelationshipService, fixtureSchemaService } from './relationship.fixtures';
import { RelationshipModal } from './RelationshipModal';

const EMPTY = { views: [], relationships: [], extra_data: {} };

/** Fake services over the fixture data; Save keeps the result for the next open. */
function Playground({ editable, empty }: { editable: boolean; empty: boolean }) {
  const [container] = useState(() =>
    createContainer([
      di => {
        di.bindValue(RelationshipService, fixtureRelationshipService(empty ? EMPTY : undefined));
        di.bindValue(SchemaService, fixtureSchemaService());
      }
    ])
  );
  const [queryClient] = useState(() => new QueryClient({ defaultOptions: { queries: { retry: false } } }));
  const [open, setOpen] = useState(true);

  return (
    <DiProvider container={container}>
      <QueryClientProvider client={queryClient}>
        <Button onClick={() => setOpen(true)}>Relationship</Button>
        <RelationshipModal dashboardId={1} editable={editable} open={open} onClose={() => setOpen(false)} />
      </QueryClientProvider>
    </DiProvider>
  );
}

const meta = {
  title: 'Dashboard/RelationshipModal',
  component: Playground,
  parameters: { layout: 'fullscreen' },
  args: { editable: true, empty: false }
} satisfies Meta<typeof Playground>;

export default meta;
type Story = StoryObj<typeof meta>;

/** Dashboard in edit mode: drag a column onto another table's column to join them, click a line to remove it. */
export const Edit: Story = {};

/** Dashboard in view mode: saved joins are drawn, nothing can change. */
export const View: Story = { args: { editable: false } };

export const NoTables: Story = { args: { empty: true } };
