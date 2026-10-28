import type { ReactNode } from 'react';
import { FieldDndProvider } from '@/shared/field-dnd/FieldDndProvider';
import { FieldLabelView } from '../field-tree/FieldLabelView';
import { useBuilderDnd } from './useBuilderDnd';

/**
 * Lets fields move between the field tree and the config panel; place both inside, within `BuilderProvider`. Drops go
 * through the builder's rules (v1 `ConfigDraggable`, `FilterDraggable`) into its state.
 */
export function BuilderDndProvider({ children }: { children: ReactNode }) {
  const { lookOf, ...options } = useBuilderDnd();
  return (
    <FieldDndProvider
      {...options}
      renderOverlay={source => {
        const look = lookOf(source);
        return look && <FieldLabelView look={look} dragging />;
      }}
    >
      {children}
    </FieldDndProvider>
  );
}
