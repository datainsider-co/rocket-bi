import { Button } from 'antd';

export interface ZoomControls {
  zoomLabel: string;
  onZoomIn: () => void;
  onZoomOut: () => void;
  onResetZoom: () => void;
  onFitContent: () => void;
}

export interface FullscreenControls {
  isFullscreen: boolean;
  onToggleFullscreen: () => void;
}

export interface EditControls {
  dirty: boolean;
  saving: boolean;
  onSave: () => void;
  onDiscard: () => void;
}

interface ControlBarViewProps {
  zoom: ZoomControls;
  fullscreen: FullscreenControls;
  /** Discard Changes and Save; left out in view mode. */
  edit?: EditControls | undefined;
}

/** Bottom bar of the editor (v1 `DiagramPanel` controls): zoom, fit, full screen, then Discard Changes and Save. */
export function ControlBarView({ zoom, fullscreen, edit }: ControlBarViewProps) {
  return (
    <div className="flex flex-wrap items-end gap-2 pt-2">
      <Button onClick={zoom.onZoomOut} aria-label="Zoom out">
        -
      </Button>
      <Button onClick={zoom.onResetZoom} aria-label="Reset zoom">
        {zoom.zoomLabel}
      </Button>
      <Button onClick={zoom.onZoomIn} aria-label="Zoom in">
        +
      </Button>
      <Button onClick={zoom.onFitContent}>Fit content</Button>
      <Button onClick={fullscreen.onToggleFullscreen}>
        {fullscreen.isFullscreen ? 'Exit full screen' : 'Full screen'}
      </Button>
      {edit && (
        <div className="ml-auto flex gap-2">
          <Button disabled={!edit.dirty || edit.saving} onClick={edit.onDiscard}>
            Discard Changes
          </Button>
          <Button type="primary" disabled={!edit.dirty} loading={edit.saving} onClick={edit.onSave}>
            Save
          </Button>
        </div>
      )}
    </div>
  );
}
