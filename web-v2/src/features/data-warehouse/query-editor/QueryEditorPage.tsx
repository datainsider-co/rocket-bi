import { useMemo, useRef } from 'react';
import { useNavigate } from 'react-router';
import type { CodeEditorHandle } from '@/shared/code-editor/CodeEditor';
import { PageHeader } from '@/shared/layout/PageHeader';
import { DatabaseTree } from '../database-tree/DatabaseTree';
import type { TreeHandlers } from '../database-tree/databaseTree.utils';
import { WarehouseSplitLayout } from '../layout/WarehouseSplitLayout';
import { getWarehouseSection, WarehouseSection } from '../warehouse.utils';
import { AnalysisTrailView } from './analysis/AnalysisTrailView';
import { columnReference, tableReference } from './queryEditor.utils';
import { QueryEditorContent } from './QueryEditorContent';
import { useEditorSource } from './useEditorSource';

const SECTION = getWarehouseSection(WarehouseSection.QueryEditor);

/**
 * `/data-warehouse/query-editor` (v1 `QueryEditor.vue`): the database tree beside the SQL editor. A table or column
 * clicked in the tree goes into the SQL at the cursor.
 */
export function QueryEditorPage() {
  const { source, key, status, analysisName, crumbs } = useEditorSource();
  const navigate = useNavigate();
  const editorRef = useRef<CodeEditorHandle>(null);
  const handlers = useMemo(
    (): TreeHandlers => ({
      onSelectTable: table => editorRef.current?.insertText(tableReference(table.dbName, table.name)),
      onSelectColumn: (table, column) => editorRef.current?.insertText(columnReference(table.name, column.name))
    }),
    []
  );
  const selection = useMemo(() => ({ dbName: source.dbName, tableName: source.tableName }), [source.dbName, source.tableName]);

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <PageHeader icon={SECTION.icon} title={SECTION.title} trail={analysisName && <AnalysisTrailView name={analysisName} crumbs={crumbs} />} />
      <WarehouseSplitLayout tree={<DatabaseTree selection={selection} handlers={handlers} />}>
        <QueryEditorContent status={status} sessionKey={key} editorRef={editorRef} onLeave={() => void navigate('/mydata')} />
      </WarehouseSplitLayout>
    </div>
  );
}
