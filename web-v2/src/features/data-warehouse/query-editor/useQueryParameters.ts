import { useCallback, useMemo, useState } from 'react';
import { App } from 'antd';
import type { QueryParameter } from '@/core/query/queryParameters';
import { syncParameters } from '@/core/query/rawQuery';
import { nextParameterName, omitValues, placeholderOf, removeParameter, renameParameter, withValues } from './parameters.utils';

export interface QueryParameters {
  /** The SQL's parameters with their current values. */
  readonly current: readonly QueryParameter[];
  /** Their saved definitions, whose values are the defaults. */
  readonly definitions: readonly QueryParameter[];
  /** The parameter being edited in the modal. */
  readonly editing: QueryParameter | undefined;
  readonly onAdd: () => void;
  readonly onValueChange: (name: string, value: string) => void;
  readonly onSetDefault: (name: string) => void;
  readonly onEdit: (parameter: QueryParameter) => void;
  readonly onEditDone: (edited: QueryParameter) => void;
  readonly onEditCancel: () => void;
  readonly onDelete: (parameter: QueryParameter) => void;
}

interface ParameterDeps {
  readonly sql: string;
  readonly setSql: (sql: string) => void;
  /** Puts text at the editor's cursor. */
  readonly insert: (text: string) => void;
  /** Runs the query again with these values (v1 ran on each change). */
  readonly rerun: (parameters: readonly QueryParameter[], sql: string) => void;
}

/**
 * The parameter bar (v1 `QueryComponent` parameters): the SQL's `{{ name }}` placeholders as they are typed, each with
 * its definition (text when new) and the value picked on the page. v1 found them 1 s after typing stopped.
 */
export function useQueryParameters({ sql, setSql, insert, rerun }: ParameterDeps): QueryParameters {
  const { modal } = App.useApp();
  const [saved, setSaved] = useState<readonly QueryParameter[]>([]);
  const [values, setValues] = useState<Readonly<Record<string, string>>>({});
  const [editing, setEditing] = useState<QueryParameter>();
  const definitions = useMemo(() => syncParameters(sql, saved), [sql, saved]);
  const current = useMemo(() => withValues(definitions, values), [definitions, values]);

  const save = useCallback((parameter: QueryParameter, replacing = parameter.displayName) => {
    setSaved(items => [...items.filter(item => item.displayName !== replacing && item.displayName !== parameter.displayName), parameter]);
  }, []);
  const forget = (names: readonly string[]) => setValues(items => omitValues(items, names));

  const onAdd = () => {
    const name = nextParameterName(definitions.map(item => item.displayName));
    insert(` ${placeholderOf(name)}`);
  };
  const onValueChange = (name: string, value: string) => {
    const next = { ...values, [name]: value };
    setValues(next);
    rerun(withValues(definitions, next), sql);
  };
  const onSetDefault = (name: string) => {
    const parameter = current.find(item => item.displayName === name);
    if (parameter) save(parameter);
    forget([name]);
  };
  const onEditDone = (edited: QueryParameter) => {
    const original = editing;
    setEditing(undefined);
    if (!original) return;
    const nextSql = renameParameter(sql, original.displayName, edited.displayName);
    if (nextSql !== sql) setSql(nextSql);
    save(edited, original.displayName);
    forget([original.displayName, edited.displayName]);
    const used = current.find(item => item.displayName === original.displayName)?.value;
    const nextDefinitions = definitions.map(item => (item.displayName === original.displayName ? edited : item));
    if (used !== edited.value) rerun(withValues(nextDefinitions, omitValues(values, [original.displayName, edited.displayName])), nextSql);
  };
  const onDelete = (parameter: QueryParameter) => {
    modal.confirm({
      title: 'Delete Parameter',
      content: `Are you sure that you want to remove this parameter ${parameter.displayName}?`,
      okText: 'Yes',
      cancelText: 'No',
      onOk: () => {
        setSql(removeParameter(sql, parameter.displayName));
        forget([parameter.displayName]);
      }
    });
  };

  return { current, definitions, editing, onAdd, onValueChange, onSetDefault, onEdit: setEditing, onEditDone, onEditCancel: () => setEditing(undefined), onDelete };
}
