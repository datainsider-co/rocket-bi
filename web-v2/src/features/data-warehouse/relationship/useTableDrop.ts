import { useCallback, useMemo, type DragEvent } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useReactFlow } from '@xyflow/react';
import { App } from 'antd';
import { useDi } from '@/app/di/DiContext';
import { SchemaService } from '@/core/schema/SchemaService';
import { toErrorMessage } from '@/shared/http/errorMessage';
import type { CanvasDrop } from '@/shared/relationship/RelationshipCanvas';
import { newRelationshipTable, tableIdOf } from '@/shared/relationship/relationship.utils';
import { tableColumns } from '@/shared/relationship/relationshipData';
import type { RelationshipEditorState } from '@/shared/relationship/useRelationshipEditor';
import { databaseQueryOptions } from '@/shared/schema/schemaQueries';
import { isTableDrag, readTableDrag } from '@/shared/database-tree/tableDrag';
import { alreadyOnCanvasMessage, dropPosition } from './globalRelationship.utils';

/**
 * A table dragged from the database tree and dropped on the canvas (v1 `RelationshipEditor.onDrop`): it lands under
 * the pointer, whatever the canvas is panned or zoomed to (v1 used the pointer's offset in the panel), with its
 * columns from the database's schema (the tree's query, so usually loaded already). A table already drawn is not
 * added twice. Must be used inside `ReactFlowProvider`.
 */
export function useTableDrop(editor: Pick<RelationshipEditorState, 'hasTable' | 'addTable'>): CanvasDrop {
  const { screenToFlowPosition } = useReactFlow();
  const schema = useDi(SchemaService);
  const queryClient = useQueryClient();
  const { message } = App.useApp();
  const { hasTable, addTable } = editor;

  const onDragOver = useCallback((event: DragEvent) => {
    if (!isTableDrag(event.dataTransfer)) return;
    event.preventDefault();
    event.dataTransfer.dropEffect = 'copy';
  }, []);

  const onDrop = useCallback(
    (event: DragEvent) => {
      const ref = readTableDrag(event.dataTransfer);
      if (!ref) return;
      event.preventDefault();
      if (hasTable(tableIdOf(ref.dbName, ref.name))) {
        void message.info(alreadyOnCanvasMessage(ref.name));
        return;
      }
      const position = dropPosition(screenToFlowPosition({ x: event.clientX, y: event.clientY }));
      queryClient
        .fetchQuery(databaseQueryOptions(schema, ref.dbName))
        .then(database => {
          if (!database.tables.some(table => table.name === ref.name)) throw new Error(`Table ${ref.name} no longer exists`);
          addTable(newRelationshipTable(ref.dbName, ref.name, tableColumns(database, ref.name)), position);
        })
        .catch((error: unknown) => void message.error(toErrorMessage(error)));
    },
    [hasTable, addTable, screenToFlowPosition, queryClient, schema, message]
  );

  return useMemo(() => ({ onDragOver, onDrop }), [onDragOver, onDrop]);
}
