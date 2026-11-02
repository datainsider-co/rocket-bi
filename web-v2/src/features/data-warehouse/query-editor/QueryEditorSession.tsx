import { lazy, Suspense, useState, type RefObject } from 'react';
import { DashboardControlsProvider } from '@/features/dashboard/controls/DashboardControlsContext';
import { ViewAsProvider } from '@/features/dashboard/view-as/ViewAsContext';
import type { CodeEditorHandle } from '@/shared/code-editor/CodeEditor';
import { SaveAnalysisModal } from './analysis/SaveAnalysisModal';
import { useAnalysisSession } from './analysis/useAnalysisSession';
import { QueryTabWorkspace } from './QueryTabWorkspace';
import { CreateTableFromQueryModal } from './table/CreateTableFromQueryModal';
import type { SessionStart } from './useEditorSource';

/** Loaded the first time a chart is added or edited. */
const ChartBuilderHost = lazy(() => import('@/features/chart-builder/host/ChartBuilderHost').then(module => ({ default: module.ChartBuilderHost })));

interface QueryEditorSessionProps {
  start: SessionStart;
  editorRef: RefObject<CodeEditorHandle | null>;
}

const START_SIZES = ['45%', '55%'];

/**
 * The analysis being edited (v1 `QueryEditor` + `QueryComponent`): the tab shown, Save, and ChartBuilder for its
 * charts. Mounted per source, so each starts over. Its charts read the analysis's controls, as on a dashboard.
 */
export function QueryEditorSession({ start, editorRef }: QueryEditorSessionProps) {
  const session = useAnalysisSession(start);
  const [sizes, setSizes] = useState<(number | string)[]>(START_SIZES);
  const { builder } = session.charts;
  const { naming } = session.save;
  const { tables } = session;

  return (
    <DashboardControlsProvider dashboard={session.dashboard}>
      <ViewAsProvider>
        <QueryTabWorkspace key={session.active.id} session={session} editorRef={editorRef} sizes={{ value: sizes, onResize: setSizes }} />
        {builder && (
          <Suspense fallback={null}>
            <ChartBuilderHost request={builder.request} dashboard={session.dashboard} editor={builder.saver} onClose={builder.onClose} />
          </Suspense>
        )}
        {naming.open && <SaveAnalysisModal creating={naming.creating} error={naming.error} onSubmit={naming.onSubmit} onCancel={naming.onCancel} />}
        {tables.creating && (
          <CreateTableFromQueryModal dbName={session.dbName} creating={tables.creating.pending} error={tables.creating.error} onSubmit={tables.onCreateSubmit} onCancel={tables.onCreateCancel} />
        )}
      </ViewAsProvider>
    </DashboardControlsProvider>
  );
}
