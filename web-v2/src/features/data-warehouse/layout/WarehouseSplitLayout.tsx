import type { ReactNode } from 'react';
import { Splitter } from 'antd';
import { useMediaQuery } from '@/shared/hooks/useMediaQuery';

/** Below Tailwind's `md`, where the tree goes above the page instead of beside it. */
const NARROW = '(max-width: 767px)';

interface WarehouseSplitLayoutProps {
  /** The database tree. */
  tree: ReactNode;
  children: ReactNode;
}

/**
 * The tree beside the page (v1's Schema, Query Editor and Relationship): the bar between them resizes, and its arrow
 * folds the tree away (v1's "◀▶"). On a phone the tree sits above the page, at most 40% of the screen high.
 */
export function WarehouseSplitLayout({ tree, children }: WarehouseSplitLayoutProps) {
  const narrow = useMediaQuery(NARROW);
  if (narrow) {
    return (
      <div className="flex min-h-0 flex-1 flex-col gap-4">
        <div className="max-h-[40vh] min-h-0 shrink-0 overflow-hidden">{tree}</div>
        <div className="flex min-h-[50vh] min-w-0 flex-1 flex-col">{children}</div>
      </div>
    );
  }
  return (
    <Splitter className="min-h-0 flex-1">
      <Splitter.Panel defaultSize={340} min={220} max="50%" collapsible={{ start: true }} className="pr-2">
        {tree}
      </Splitter.Panel>
      <Splitter.Panel className="flex min-w-0 flex-col pl-2">{children}</Splitter.Panel>
    </Splitter>
  );
}
