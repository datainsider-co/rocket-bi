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

/** Operators and destinations open with the steps that build their dialogs (DC7 to DC9). */
export const NOT_SUPPORTED_YET = 'Not supported yet';

const later = (key: string, label: string): EtlMenuItem => ({ key, label, disabled: true, title: NOT_SUPPORTED_YET });
const REMOVE: EtlMenuItem = { key: EtlMenuKey.Remove, label: 'Remove', danger: true };

/**
 * A table's menu, in v1's order. Python Query, Save To Database and Send To Email are left out: v2 doesn't build them
 * (`DATA_COOK.md`). Only an operator's table can be renamed, as in v1.
 */
export function tableMenu(isSource: boolean): EtlMenuItem[] {
  return [
    later(EtlMenuKey.Join, 'Join Table'),
    later(EtlMenuKey.ManageFields, 'Manage Fields'),
    later(EtlMenuKey.Sql, 'SQL Query'),
    later(EtlMenuKey.Pivot, 'Pivot Table'),
    later(EtlMenuKey.Transform, 'Transform Table'),
    later(EtlMenuKey.SaveToDataWarehouse, 'Save To Data Warehouse'),
    ...(isSource ? [] : [{ key: EtlMenuKey.Rename, label: 'Edit Display Name' }]),
    REMOVE
  ];
}

/** An operator's shape: Edit opens its dialog, Remove takes it and its table away. */
export function operatorMenu(): EtlMenuItem[] {
  return [later(EtlMenuKey.Edit, 'Edit'), REMOVE];
}

/** A Save To Data Warehouse, Save To Database or email box. */
export function boxMenu(): EtlMenuItem[] {
  return [later(EtlMenuKey.Edit, 'Edit'), REMOVE];
}
