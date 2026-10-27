import type { ReactNode } from 'react';
import { Tag } from 'antd';
import { FieldDndProvider } from '@/shared/field-dnd/FieldDndProvider';
import { useBuilderDnd } from './useBuilderDnd';

/**
 * Lets fields move between the field tree and the config panel; place both inside, within `BuilderProvider`. Drops go
 * through the builder's rules (v1 `ConfigDraggable`, `FilterDraggable`) into its state.
 */
export function BuilderDndProvider({ children }: { children: ReactNode }) {
  const { labelOf, ...options } = useBuilderDnd();
  return (
    <FieldDndProvider
      {...options}
      renderOverlay={source => (
        <Tag color="blue" className="cursor-grabbing shadow">
          {labelOf(source)}
        </Tag>
      )}
    >
      {children}
    </FieldDndProvider>
  );
}
