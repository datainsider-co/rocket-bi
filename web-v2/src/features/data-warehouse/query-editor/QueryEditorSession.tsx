import type { RefObject } from 'react';
import { Splitter } from 'antd';
import type { CodeEditorHandle } from '@/shared/code-editor/CodeEditor';
import { ParameterModal } from './ParameterModal';
import { QueryInputView } from './QueryInputView';
import { QueryResultView } from './QueryResultView';
import { useQueryEditor, type QueryEditorStart } from './useQueryEditor';

interface QueryEditorSessionProps {
  start: QueryEditorStart;
  editorRef: RefObject<CodeEditorHandle | null>;
}

/** The editor above its result (v1 `QueryComponent`'s vertical split). Mounted per source, so each starts over. */
export function QueryEditorSession({ start, editorRef }: QueryEditorSessionProps) {
  const model = useQueryEditor(start, editorRef);
  const { parameters, result } = model;
  const editing = parameters.editing;

  return (
    <>
      {/* On a phone the page scrolls below the tree: the split gets most of the screen, so the SQL has room. */}
      <Splitter orientation="vertical" className="min-h-[85vh] flex-1 md:min-h-0">
        <Splitter.Panel defaultSize="45%" min={150} className="pb-2">
          <QueryInputView
            editor={{ value: model.sql, onChange: model.onSqlChange, language: model.language, handleRef: editorRef }}
            parameters={parameters}
            commands={{ onExecute: model.onExecute, running: result.isFetching, canDownload: result.run !== undefined, onDownload: model.onDownload }}
          />
        </Splitter.Panel>
        <Splitter.Panel className="flex min-h-0 flex-col overflow-auto rounded-lg bg-white">
          <QueryResultView result={result} />
        </Splitter.Panel>
      </Splitter>
      {editing && (
        <ParameterModal
          parameter={editing}
          takenNames={parameters.definitions.map(item => item.displayName).filter(name => name !== editing.displayName)}
          onSubmit={parameters.onEditDone}
          onCancel={parameters.onEditCancel}
        />
      )}
    </>
  );
}
