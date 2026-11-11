import type { ReactNode } from 'react';
import { DialogScope } from '@/features/dashboard/theme/DialogScope';
import './builderScope.css';

const BUILDER_STYLE = { 'builder-default-style': '' };

/**
 * Where ChartBuilder renders (v1 `[builder-default-style]`): the default light look and accent whatever the dashboard's
 * theme, on a dashboard or off one (Data Cook, the query editor). The dashboard's dialog layer, with the builder's own
 * menus and small dialogs.
 */
export function BuilderScope({ children }: { children: ReactNode }) {
  return (
    <DialogScope className="builder-scope" {...BUILDER_STYLE}>
      {children}
    </DialogScope>
  );
}
