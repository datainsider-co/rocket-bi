import type { ReactNode, Ref } from 'react';
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
  readonly readOnly: boolean;
}

export interface QueryCommands {
  readonly onExecute: () => void;
  readonly running: boolean;
  /** Download CSV / Excel: when allowed, and once there is a result to download. */
  readonly download: { readonly enabled: boolean; readonly onDownload: (type: ExportType) => void } | undefined;
  /** Save, Ctrl/Cmd+S; hidden read only. */
  readonly save: { readonly label: string; readonly saving: boolean; readonly onSave: () => void } | undefined;
  /** Actions › Create Analysis (v1's Save As). */
  readonly onSaveAs: (() => void) | undefined;
  /** Actions › Create Table. */
  readonly onCreateTable: (() => void) | undefined;
}

interface QueryInputViewProps {
  editor: SqlEditorProps;
  parameters: QueryParameters;
  commands: QueryCommands;
  /** The analysis's tabs and Add Chart, left of the buttons. */
  tabs: ReactNode;
}

const IS_MAC = typeof navigator !== 'undefined' && /Mac|iPhone|iPad/.test(navigator.platform);
const RUN_SHORTCUT = IS_MAC ? '⌘ Enter' : 'Ctrl+Enter';

function actionItems({ download, onSaveAs, onCreateTable }: QueryCommands): MenuProps['items'] {
  return [
    ...(onCreateTable ? [{ key: 'create-table', label: 'Create Table' }] : []),
    ...(onSaveAs ? [{ key: 'save-as', label: 'Create Analysis' }] : []),
    ...(download
      ? [
          { key: 'csv', label: 'Download CSV', disabled: !download.enabled },
          { key: 'xlsx', label: 'Download Excel', disabled: !download.enabled }
        ]
      : [])
  ];
}

/** The top of the Query Editor (v1 "Build Query"): the SQL, its parameters, the tabs, Save, Actions and Execute. */
export function QueryInputView({ editor, parameters, commands, tabs }: QueryInputViewProps) {
  const canExecute = editor.value.trim() !== '';
  const actions = actionItems(commands);
  const onAction: MenuProps['onClick'] = ({ key }) => {
    if (key === 'save-as') commands.onSaveAs?.();
    else if (key === 'create-table') commands.onCreateTable?.();
    else commands.download?.onDownload(key as ExportType);
  };

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
          onSave={commands.save?.onSave}
          readOnly={editor.readOnly}
          lineNumbers
          placeholder="select * from ..."
          ariaLabel="SQL query"
          height="100%"
          className="h-full"
        />
      </div>
      <ParameterBarView definitions={parameters.definitions} current={parameters.current} actions={parameters} onAdd={editor.readOnly ? undefined : parameters.onAdd} />
      <div className="flex flex-wrap items-center justify-end gap-2">
        {tabs}
        {commands.save && (
          <Button loading={commands.save.saving} onClick={commands.save.onSave}>
            {commands.save.label}
          </Button>
        )}
        {actions && actions.length > 0 && (
          <Dropdown menu={{ items: actions, onClick: onAction }} trigger={['click']}>
            <Button>
              Actions <DownOutlined />
            </Button>
          </Dropdown>
        )}
        <Tooltip title={RUN_SHORTCUT}>
          <Button type="primary" icon={<CaretRightOutlined />} loading={commands.running} disabled={!canExecute} onClick={commands.onExecute}>
            Execute
          </Button>
        </Tooltip>
      </div>
    </div>
  );
}
