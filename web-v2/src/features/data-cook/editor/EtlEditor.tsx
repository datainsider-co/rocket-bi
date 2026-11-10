import type { EtlId, EtlJob } from '@/core/data-cook/EtlJob';
import { useCanvasControls } from '@/shared/relationship/useCanvasControls';
import { useFullscreen } from '@/shared/relationship/useFullscreen';
import { EtlCanvasView } from './canvas/EtlCanvasView';
import { EtlEditorHeader } from './EtlEditorHeader';
import { EtlNameModal } from './EtlNameModal';
import { OperatorDialogHost } from './operators/OperatorDialogHost';
import { EtlPreviewContent } from './preview/EtlPreviewContent';
import { EtlPreviewPanel } from './preview/EtlPreviewPanel';
import { SaveEtlModal } from './save/SaveEtlModal';
import { AddSourceModal } from './source/AddSourceModal';
import { PersistModal } from './targets/PersistModal';
import { useEtlEditor } from './useEtlEditor';

interface EtlEditorProps {
  /** The loaded ETL, or a new one (id 0). */
  initial: EtlJob;
  onCreated: (id: EtlId) => void;
}

/** The editor of one ETL. Must be used inside `ReactFlowProvider`. */
export function EtlEditor({ initial, onCreated }: EtlEditorProps) {
  const { draft, canvas, preview, previews, operator, persist, source, menu, edit, saveDialog, rename } = useEtlEditor(initial, onCreated);
  const zoom = useCanvasControls();
  const fullscreen = useFullscreen(zoom.onFitContent);

  return (
    <>
      <EtlEditorHeader
        editor={{ displayName: draft.displayName, isAdding: source.isAdding, onRename: rename.open, onAddSource: source.open }}
      />
      <div className="flex min-h-0 flex-1 flex-col gap-4">
        <EtlCanvasView canvas={canvas} zoom={zoom} fullscreen={fullscreen} edit={edit} onAddSource={source.open} />
        {preview.tabs.length > 0 && (
          <EtlPreviewPanel tabs={preview.tabs} shown={preview.shown} onShow={preview.onShow} onRefresh={preview.onRefresh}>
            {preview.shown !== undefined && preview.state && <EtlPreviewContent tblName={preview.shown} state={preview.state} onRetry={preview.onRetry} />}
          </EtlPreviewPanel>
        )}
      </div>
      {source.isOpen && <AddSourceModal source={source} />}
      {persist.tblName !== undefined && <PersistModal dialog={persist} />}
      {saveDialog.isOpen && <SaveEtlModal draft={draft} saving={saveDialog.saving} error={saveDialog.error} onSave={saveDialog.submit} onCancel={saveDialog.close} />}
      <OperatorDialogHost etlId={draft.etl.id} graph={draft.graph} extraData={draft.extraData} previews={previews} operator={operator} />
      {rename.isOpen && <EtlNameModal title="Rename ETL" initialName={draft.displayName} onSubmit={rename.submit} onCancel={rename.close} />}
      {menu.renaming && (
        <EtlNameModal
          title="Edit Display Name"
          initialName={menu.renaming.displayName}
          onSubmit={menu.submitRename}
          onCancel={menu.cancelRename}
        />
      )}
    </>
  );
}
