import { useMemo, useRef } from 'react';
import { Spin } from 'antd';
import type { CodeEditorHandle } from '@/shared/code-editor/CodeEditor';
import { PageHeader } from '@/shared/layout/PageHeader';
import { DatabaseTree } from '../database-tree/DatabaseTree';
import type { TreeHandlers } from '../database-tree/databaseTree.utils';
import { WarehouseSplitLayout } from '../layout/WarehouseSplitLayout';
import { getWarehouseSection, WarehouseSection } from '../warehouse.utils';
import { columnReference, tableReference } from './queryEditor.utils';
import { QueryEditorSession } from './QueryEditorSession';
import { useEditorSource } from './useEditorSource';

const SECTION = getWarehouseSection(WarehouseSection.QueryEditor);

/**
 * `/data-warehouse/query-editor` (v1 `QueryEditor.vue`): the database tree beside the SQL editor. A table or column
 * clicked in the tree goes into the SQL at the cursor.
 */
export function QueryEditorPage() {
  const { source, key, start } = useEditorSource();
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
      <PageHeader icon={SECTION.icon} title={SECTION.title} />
      <WarehouseSplitLayout tree={<DatabaseTree selection={selection} handlers={handlers} />}>
        {start ? <QueryEditorSession key={key} start={start} editorRef={editorRef} /> : <Spin className="m-auto" />}
      </WarehouseSplitLayout>
    </div>
  );
}
