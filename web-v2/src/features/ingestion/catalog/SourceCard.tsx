import type { ReactNode } from 'react';
import { Button, Tooltip } from 'antd';
import { isAvailableSource, type AvailableSourceEntry, type SourceCatalogEntry } from './sourceCatalog';

interface SourceCardProps {
  entry: SourceCatalogEntry;
  onSelect: (entry: AvailableSourceEntry) => void;
}

const CARD = '!flex !h-[126px] !w-[118px] !flex-col !gap-0 overflow-hidden rounded !p-0';

function cardContent(entry: SourceCatalogEntry): ReactNode {
  return (
    <>
      <img src={entry.iconUrl} alt="" width={118} height={80} className="block h-20 w-[118px] shrink-0 object-cover" />
      <span className="flex h-[46px] w-full items-center justify-center bg-[var(--ant-color-fill-quaternary,rgba(0,0,0,0.02))] px-1 text-center text-xs font-medium leading-tight whitespace-normal">
        {entry.title}
      </span>
    </>
  );
}

/**
 * One catalog card (v1 `DataSourceItem`): the type's image over its name. An available type is a button; a coming-soon
 * type is a plain, dimmed block with a "Coming soon" tooltip, so it can't be clicked or tabbed to.
 */
export function SourceCard({ entry, onSelect }: SourceCardProps) {
  if (isAvailableSource(entry)) {
    return (
      <Button className={`${CARD} shadow-sm`} aria-label={entry.title} onClick={() => onSelect(entry)}>
        {cardContent(entry)}
      </Button>
    );
  }
  return (
    <Tooltip title="Coming soon">
      <div
        aria-disabled="true"
        className={`${CARD} cursor-not-allowed border border-solid border-[var(--ant-color-border,#d9d9d9)] opacity-50 grayscale`}
      >
        {cardContent(entry)}
      </div>
    </Tooltip>
  );
}
