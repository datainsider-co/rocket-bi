import type { EtlId, EtlJob } from '@/core/data-cook/EtlJob';
import { useCanvasControls } from '@/shared/relationship/useCanvasControls';
import { useFullscreen } from '@/shared/relationship/useFullscreen';
import { EtlCanvasView } from './canvas/EtlCanvasView';
import { EtlEditorHeader } from './EtlEditorHeader';
import { EtlNameModal } from './EtlNameModal';
import { AddSourceModal } from './source/AddSourceModal';
import { useEtlEditor } from './useEtlEditor';

interface EtlEditorProps {
  /** The loaded ETL, or a new one (id 0). */
  initial: EtlJob;
  onCreated: (id: EtlId) => void;
}

/** The editor of one ETL. Must be used inside `ReactFlowProvider`. */
export function EtlEditor({ initial, onCreated }: EtlEditorProps) {
  const { draft, canvas, source, menu, edit, rename } = useEtlEditor(initial, onCreated);
  const zoom = useCanvasControls();
  const fullscreen = useFullscreen(zoom.onFitContent);

  return (
    <>
      <EtlEditorHeader
        editor={{ displayName: draft.displayName, isAdding: source.isAdding, onRename: rename.open, onAddSource: source.open }}
      />
      <EtlCanvasView canvas={canvas} zoom={zoom} fullscreen={fullscreen} edit={edit} onAddSource={source.open} />
      {source.isOpen && <AddSourceModal source={source} />}
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
