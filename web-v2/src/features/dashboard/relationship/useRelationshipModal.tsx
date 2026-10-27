import { lazy, Suspense, useCallback, useState } from 'react';

// React Flow is only fetched the first time the editor opens.
const RelationshipModal = lazy(() => import('./RelationshipModal').then(module => ({ default: module.RelationshipModal })));

/**
 * The Relationship editor for the dashboard Options menu: call `open` from the menu item and render `modal`
 * anywhere in the page. `editable` is whether the dashboard is in edit mode.
 */
export function useRelationshipModal(dashboardId: number, editable: boolean) {
  const [isOpen, setOpen] = useState(false);
  // Mounted from the first open on, so the modal can play its closing animation.
  const [mounted, setMounted] = useState(false);

  const open = useCallback(() => {
    setMounted(true);
    setOpen(true);
  }, []);
  const close = useCallback(() => setOpen(false), []);

  const modal = mounted ? (
    <Suspense fallback={null}>
      <RelationshipModal dashboardId={dashboardId} editable={editable} open={isOpen} onClose={close} />
    </Suspense>
  ) : null;

  return { open, close, modal };
}
