import type { Meta, StoryObj } from '@storybook/react-vite';
import mysql from './catalogues/mysql.json';
import type { FunctionCatalog } from './functionCatalog.utils';
import { FunctionReferenceView } from './FunctionReferenceView';
import { useFunctionReference } from './useFunctionReference';

/** The view with its state kept by `useFunctionReference`, on the MySQL catalogue. */
function Playground({ empty }: { empty: boolean }) {
  const { reference } = useFunctionReference(empty ? {} : (mysql as FunctionCatalog));
  return (
    <div className="flex h-[480px] w-[560px] flex-col">
      <FunctionReferenceView {...reference} />
    </div>
  );
}

const meta = {
  title: 'ChartBuilder/FunctionReference',
  component: Playground,
  args: { empty: false }
} satisfies Meta<typeof Playground>;

export default meta;

type Story = StoryObj<typeof meta>;

export const MySql: Story = {};
export const NoFunctions: Story = { args: { empty: true } };
