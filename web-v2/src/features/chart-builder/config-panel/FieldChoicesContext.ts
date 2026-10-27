import { createContext, use } from 'react';
import type { TableNode } from '../field-tree/fieldTree.utils';

/**
 * The tables of the field tree, for the menus that pick a field by click. The builder modal provides them; without a
 * provider the menus have nothing to offer.
 */
export const FieldChoicesContext = createContext<readonly TableNode[]>([]);

export function useFieldChoices(): readonly TableNode[] {
  return use(FieldChoicesContext);
}
