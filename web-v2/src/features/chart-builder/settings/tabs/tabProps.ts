import type { VizChanges } from '@/core/chart-builder/vizChanges';
import type { VizOptions } from '@/core/query/vizOptions';

/** What every settings tab gets: the viz options in v1's camelCase, and where to send its edits. */
export interface TabProps {
  viz: VizOptions;
  onChange: (changes: VizChanges) => void;
}
