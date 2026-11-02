import { Button } from 'antd';

/** An ETL without sources (v1 `cdp-body-content-block-nodata`): "The first click Add Source". */
export function EtlEmptyHint({ onAddSource }: { onAddSource: () => void }) {
  return (
    <div className="pointer-events-none absolute inset-0 z-[5] flex flex-col items-center justify-center gap-4 p-4 text-center">
      <i className="di-icon-etl text-6xl opacity-60" />
      <div className="pointer-events-auto">
        The first click
        <Button type="link" className="!px-1 font-medium" onClick={onAddSource}>
          Add Source
        </Button>
      </div>
    </div>
  );
}
