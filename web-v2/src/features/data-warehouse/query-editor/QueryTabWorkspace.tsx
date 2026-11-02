import type { RefObject } from 'react';
import { Splitter } from 'antd';
import type { CodeEditorHandle } from '@/shared/code-editor/CodeEditor';
import { shownChartJson, tabLabel } from './analysis/analysis.utils';
import { ChartTabResult } from './analysis/ChartTabResult';
import { TabsBarView } from './analysis/TabsBarView';
import type { AnalysisSession } from './analysis/useAnalysisSession';
import { ParameterModal } from './ParameterModal';
import { QueryInputView } from './QueryInputView';
import { QueryResultView } from './QueryResultView';
import { useQueryEditor } from './useQueryEditor';

interface QueryTabWorkspaceProps {
  session: AnalysisSession;
  editorRef: RefObject<CodeEditorHandle | null>;
  /** The split's sizes, kept by the session so they stay from tab to tab. */
  sizes: { readonly value: (number | string)[]; readonly onResize: (sizes: number[]) => void };
}

/** The tab shown: its SQL above, its result or chart below. Mounted per tab, so the editor holds that tab's text. */
export function QueryTabWorkspace({ session, editorRef, sizes }: QueryTabWorkspaceProps) {
  const { active: tab, readOnly, charts, save, tables } = session;
  const model = useQueryEditor(tab, session.onEdit, editorRef);
  const { parameters, result } = model;
  const editing = parameters.editing;
  const chartJson = shownChartJson(tab);
  const editable = !readOnly;
  const { onUpdate } = tables;

  return (
    <>
      {/* On a phone the page scrolls below the tree: the split gets most of the screen, so the SQL has room. */}
      <Splitter orientation="vertical" className="min-h-[85vh] flex-1 md:min-h-0" onResize={sizes.onResize}>
        <Splitter.Panel size={sizes.value[0]} min={150} className="pb-2">
          <QueryInputView
            editor={{ value: model.sql, onChange: model.onSqlChange, language: model.language, handleRef: editorRef, readOnly }}
            parameters={parameters}
            commands={{
              onExecute: model.onExecute,
              running: result.isFetching,
              // A chart is downloaded from a dashboard; here the query's rows are.
              download: session.canDownload && tab.kind === 'query' ? { enabled: result.run !== undefined, onDownload: model.onDownload } : undefined,
              save: onUpdate
                ? { label: 'Update Table', saving: tables.updating, onSave: () => onUpdate(tab.sql, parameters.current) }
                : editable
                  ? { label: session.isSaved ? (session.dirty ? 'Save*' : 'Save') : 'Save Analysis', saving: save.saving, onSave: save.save }
                  : undefined,
              onSaveAs: editable && session.isSaved ? save.saveAs : undefined,
              onCreateTable: editable && !onUpdate && tab.sql.trim() !== '' ? () => tables.onCreate(tab.sql, parameters.current) : undefined
            }}
            tabs={
              <TabsBarView
                items={session.tabs.map(item => ({ id: item.id, label: tabLabel(item) }))}
                activeId={tab.id}
                onSelect={session.onSelect}
                onAddChart={editable && !onUpdate && tab.sql.trim() !== '' ? () => charts.onAdd(tab, parameters.current) : undefined}
                adding={charts.adding}
              />
            }
          />
        </Splitter.Panel>
        <Splitter.Panel size={sizes.value[1]} className="flex min-h-0 flex-col overflow-auto rounded-lg bg-white">
          {chartJson ? (
            <ChartTabResult json={chartJson} dashboard={session.dashboard} actions={editable ? { onEdit: () => charts.onEdit(tab), onDelete: () => charts.onDelete(tab) } : undefined} />
          ) : (
            <QueryResultView result={result} />
          )}
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
