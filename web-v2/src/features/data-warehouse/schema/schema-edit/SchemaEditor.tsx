import type { TableDefinition } from '@/core/schema/TableDefinition';
import { SchemaEditorView } from './SchemaEditorView';
import { useSchemaEditor, type SchemaEditTarget } from './useSchemaEditor';

interface SchemaEditorProps {
  target: SchemaEditTarget;
  /** The table as the server answered the save. */
  onSaved: (table: TableDefinition) => void;
  onCancel: () => void;
}

/** Edits a table's columns or those of a table to create. Mount it per edit, so the form starts from the table. */
export function SchemaEditor({ target, onSaved, onCancel }: SchemaEditorProps) {
  return <SchemaEditorView editor={useSchemaEditor(target, onSaved, onCancel)} />;
}
