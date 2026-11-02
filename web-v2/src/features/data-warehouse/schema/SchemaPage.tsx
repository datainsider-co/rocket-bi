import { useState } from 'react';
import { FormulaFieldDialog } from '@/features/chart-builder/field-actions/FormulaFieldDialog';
import { databaseShare, type ShareRequest } from '@/features/share/share.utils';
import { ShareModal } from '@/features/share/ShareModal';
import { PageHeader } from '@/shared/layout/PageHeader';
import { DatabaseTree } from '@/shared/database-tree/DatabaseTree';
import { WarehouseSplitLayout } from '../layout/WarehouseSplitLayout';
import { getWarehouseSection, WarehouseSection } from '../warehouse.utils';
import { FormulaColumnsContext } from './formula-columns/FormulaColumnsContext';
import { useFormulaColumns } from './formula-columns/useFormulaColumns';
import { SchemaContent } from './SchemaContent';
import { useDeleteTable } from './useDeleteTable';
import { useSchemaSelection } from './useSchemaSelection';
import { useSchemaTreeHandlers } from './useSchemaTreeHandlers';
import { useTableDraft } from './useTableDraft';

const SECTION = getWarehouseSection(WarehouseSection.Schema);

/** `/data-warehouse/schema` (v1 `DataSchema.vue`): the database tree beside the selected database or table. */
export function SchemaPage() {
  const { selection, isLoading, select } = useSchemaSelection();
  const deleteTable = useDeleteTable(table => select({ dbName: table.dbName, tableName: undefined }));
  const formulas = useFormulaColumns();
  const draft = useTableDraft();
  const handlers = useSchemaTreeHandlers(select, deleteTable, formulas.actions);
  const [share, setShare] = useState<ShareRequest>();
  const openShare = (dbName: string) => setShare(databaseShare({ name: dbName, displayName: dbName, owner: undefined, creatorId: '' }));

  return (
    <FormulaColumnsContext value={formulas.actions}>
      <div className="flex min-h-0 flex-1 flex-col">
        <PageHeader icon={SECTION.icon} title={SECTION.title} />
        <WarehouseSplitLayout tree={<DatabaseTree selection={selection} handlers={handlers} />}>
          <SchemaContent selection={selection} isLoading={isLoading} draft={draft} onSelect={select} onShareDatabase={openShare} />
        </WarehouseSplitLayout>
        {share && <ShareModal open {...share} onClose={() => setShare(undefined)} onShared={() => setShare(undefined)} />}
        {formulas.dialog && <FormulaFieldDialog target={formulas.dialog} onSaved={formulas.onSaved} onCancel={formulas.onCancel} />}
      </div>
    </FormulaColumnsContext>
  );
}
