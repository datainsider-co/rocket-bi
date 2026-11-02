import type { Ref } from 'react';
import { CaretRightOutlined, DownOutlined } from '@ant-design/icons';
import { Button, Dropdown, Tooltip, type MenuProps } from 'antd';
import type { ExportType } from '@/core/query/QueryService';
import type { CodeEditorHandle } from '@/shared/code-editor/CodeEditor';
import type { EditorLanguage } from '@/shared/code-editor/codeEditor.utils';
import { LazyCodeEditor } from '@/shared/code-editor/LazyCodeEditor';
import { ParameterBarView } from './ParameterBarView';
import type { QueryParameters } from './useQueryParameters';

export interface SqlEditorProps {
  readonly value: string;
  readonly onChange: (sql: string) => void;
  readonly language: EditorLanguage;
  readonly handleRef: Ref<CodeEditorHandle>;
}

export interface QueryCommands {
  readonly onExecute: () => void;
  readonly running: boolean;
  /** Downloads need a result to download. */
  readonly canDownload: boolean;
  readonly onDownload: (type: ExportType) => void;
}

interface QueryInputViewProps {
  editor: SqlEditorProps;
  parameters: QueryParameters;
  commands: QueryCommands;
}

const IS_MAC = typeof navigator !== 'undefined' && /Mac|iPhone|iPad/.test(navigator.platform);
const RUN_SHORTCUT = IS_MAC ? '⌘ Enter' : 'Ctrl+Enter';

/** The top of the Query Editor (v1 "Build Query"): the SQL, its parameters, Actions and Execute. */
export function QueryInputView({ editor, parameters, commands }: QueryInputViewProps) {
  const actions: MenuProps['items'] = [
    { key: 'csv', label: 'Download CSV', disabled: !commands.canDownload },
    { key: 'xlsx', label: 'Download Excel', disabled: !commands.canDownload }
  ];
  const canExecute = editor.value.trim() !== '';

  return (
    <div className="flex h-full min-h-0 flex-col gap-2 rounded-lg bg-white p-3">
      <div className="font-medium">Build Query</div>
      <div className="min-h-0 flex-1">
        <LazyCodeEditor
          value={editor.value}
          onChange={editor.onChange}
          languageId="di-sql"
          language={editor.language}
          handleRef={editor.handleRef}
          onRun={() => canExecute && commands.onExecute()}
          lineNumbers
          placeholder="select * from ..."
          ariaLabel="SQL query"
          height="100%"
          className="h-full"
        />
      </div>
      <ParameterBarView definitions={parameters.definitions} current={parameters.current} actions={parameters} onAdd={parameters.onAdd} />
      <div className="flex items-center justify-end gap-2">
        <Dropdown menu={{ items: actions, onClick: ({ key }) => commands.onDownload(key as ExportType) }} trigger={['click']}>
          <Button>
            Actions <DownOutlined />
          </Button>
        </Dropdown>
        <Tooltip title={RUN_SHORTCUT}>
          <Button type="primary" icon={<CaretRightOutlined />} loading={commands.running} disabled={!canExecute} onClick={commands.onExecute}>
            Execute
          </Button>
        </Tooltip>
      </div>
    </div>
  );
}
