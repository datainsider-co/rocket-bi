import type { EtlOperator } from '@/core/data-cook/EtlOperator';

/** Menus of the canvas boxes (v1 `TableContextMenu`, `OperatorContextMenu` and the saved box menus). */

export interface EtlMenuItem {
  readonly key: string;
  readonly label: string;
  readonly disabled?: boolean;
  /** Why it is disabled. */
  readonly title?: string;
  readonly danger?: boolean;
}

export const EtlMenuKey = {
  Join: 'join',
  ManageFields: 'manageFields',
  Sql: 'sql',
  Pivot: 'pivot',
  Transform: 'transform',
  SaveToDataWarehouse: 'saveToDataWarehouse',
  Rename: 'rename',
  Edit: 'edit',
  Remove: 'remove'
} as const;

/** Operators and destinations open with the steps that build their dialogs (DC8, DC9). */
export const NOT_SUPPORTED_YET = 'Not supported yet';

const later = (key: string, label: string): EtlMenuItem => ({ key, label, disabled: true, title: NOT_SUPPORTED_YET });
const item = (key: string, label: string): EtlMenuItem => ({ key, label });
const REMOVE: EtlMenuItem = { key: EtlMenuKey.Remove, label: 'Remove', danger: true };

/**
 * A table's menu, in v1's order. Python Query, Save To Database and Send To Email are left out: v2 doesn't build them
 * (`DATA_COOK.md`). Only an operator's table can be renamed, as in v1.
 */
export function tableMenu(isSource: boolean): EtlMenuItem[] {
  return [
    item(EtlMenuKey.Join, 'Join Table'),
    item(EtlMenuKey.ManageFields, 'Manage Fields'),
    item(EtlMenuKey.Sql, 'SQL Query'),
    later(EtlMenuKey.Pivot, 'Pivot Table'),
    later(EtlMenuKey.Transform, 'Transform Table'),
    later(EtlMenuKey.SaveToDataWarehouse, 'Save To Data Warehouse'),
    ...(isSource ? [] : [{ key: EtlMenuKey.Rename, label: 'Edit Display Name' }]),
    REMOVE
  ];
}

/** The operators whose dialog v2 has (DC7). */
const EDITABLE: ReadonlySet<EtlOperator['kind']> = new Set(['sql', 'join', 'manageFields']);

/** An operator's shape: Edit opens its dialog, Remove takes it and its table away. Python Query stays read-only. */
export function operatorMenu(kind: EtlOperator['kind']): EtlMenuItem[] {
  if (EDITABLE.has(kind)) return [item(EtlMenuKey.Edit, 'Edit'), REMOVE];
  const title = kind === 'python' || kind === 'unsupported' ? 'Not supported' : NOT_SUPPORTED_YET;
  return [{ key: EtlMenuKey.Edit, label: 'Edit', disabled: true, title }, REMOVE];
}

/** A Save To Data Warehouse, Save To Database or email box. */
export function boxMenu(): EtlMenuItem[] {
  return [later(EtlMenuKey.Edit, 'Edit'), REMOVE];
}
