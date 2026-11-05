import type { EtlPreview } from '@/core/data-cook/EtlPreviewService';
import type { EtlOperator } from '@/core/data-cook/EtlOperator';
import { previewRoots, tableResult, treeOperators, type TablePreviewResult } from './etlPreview.utils';

/** Builds the tables of `trees` and everything they read from, as `preview_sync` with `force`. */
export type PreviewRun = (trees: readonly EtlOperator[]) => Promise<EtlPreview>;

export interface PreviewBatcher {
  /** The preview of the table `tree` writes, built with the others asked for at the same time. */
  load(tree: EtlOperator): Promise<TablePreviewResult>;
}

interface Pending {
  readonly tree: EtlOperator;
  readonly resolve: (result: TablePreviewResult) => void;
  readonly reject: (error: unknown) => void;
}

/**
 * One `preview_sync` for the tables asked for together, and one at a time: two forced builds of the same table at once
 * fail on the server ("Table 'sales' already exists", DC6b). Tables asked for while a build runs go in the next one.
 * `onBuilt` gets the names of every table a build made again.
 */
export function createPreviewBatcher(
  run: PreviewRun,
  onBuilt: (names: ReadonlySet<string>) => void = () => {},
  schedule: (flush: () => void) => void = flush => setTimeout(flush, 0)
): PreviewBatcher {
  let pending: Pending[] = [];
  let scheduled = false;
  let running = false;

  const flush = async () => {
    scheduled = false;
    const batch = pending;
    pending = [];
    if (batch.length === 0) return;
    running = true;
    try {
      const roots = previewRoots(batch.map(item => item.tree));
      const preview = await run(roots);
      onBuilt(new Set(roots.flatMap(root => [...treeOperators(root).keys()])));
      batch.forEach(item => item.resolve(tableResult(item.tree, preview)));
    } catch (error) {
      batch.forEach(item => item.reject(error));
    } finally {
      running = false;
      if (pending.length > 0) start();
    }
  };

  const start = () => {
    if (scheduled || running) return;
    scheduled = true;
    schedule(() => void flush());
  };

  return {
    load: tree =>
      new Promise<TablePreviewResult>((resolve, reject) => {
        pending.push({ tree, resolve, reject });
        start();
      })
  };
}
