import { PlusOutlined, SaveOutlined } from '@ant-design/icons';
import { Alert, Button } from 'antd';
import { ColumnsFormTable } from './ColumnsFormTable';
import type { SchemaEditor } from './useSchemaEditor';

/** The column form with its buttons (v1 header in EditSchema / CreateTable mode: Add column, Cancel, Save / Create). */
export function SchemaEditorView({ editor }: { editor: SchemaEditor }) {
  return (
    <div className="flex min-h-0 flex-1 flex-col gap-3">
      <div className="flex flex-wrap items-center justify-end gap-2">
        <Button icon={<PlusOutlined />} onClick={editor.onAddColumn}>
          Add column
        </Button>
        <Button onClick={editor.onCancel}>Cancel</Button>
        <Button type="primary" icon={<SaveOutlined />} loading={editor.saving} onClick={editor.onSave}>
          {editor.mode === 'edit' ? 'Save' : 'Create'}
        </Button>
      </div>
      {editor.error && <Alert type="error" showIcon title={editor.mode === 'edit' ? 'Edit Table Error' : 'Create Table Error'} description={editor.error} />}
      <div className="min-h-0 flex-1 overflow-auto">
        <ColumnsFormTable control={editor.control} rows={editor.rows} onTypeChange={editor.onTypeChange} onRemoveColumn={editor.onRemoveColumn} />
      </div>
    </div>
  );
}
