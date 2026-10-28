import { createContext } from 'react';
import type { TableTooltipStyle } from './tableStyle.utils';

/** The cell tooltip's look, for the table's cells. */
export const TableTooltipContext = createContext<TableTooltipStyle | null>(null);
