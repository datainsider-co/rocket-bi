import type { RlsPolicy } from '@/core/rls/RlsPolicy';
import type { TableSchema } from '@/core/schema/SchemaService';
import { RlsEditorView } from './RlsEditorView';
import { useRlsEditor } from './useRlsEditor';

interface RlsEditorProps {
  table: TableSchema;
  policies: readonly RlsPolicy[];
  /** Saved or cancelled: back to view mode. */
  onDone: () => void;
}

/** The form of the policies; mounted per edit, so it starts from what the server has. */
export function RlsEditor({ table, policies, onDone }: RlsEditorProps) {
  return <RlsEditorView editor={useRlsEditor(table, policies, onDone)} table={table} />;
}
