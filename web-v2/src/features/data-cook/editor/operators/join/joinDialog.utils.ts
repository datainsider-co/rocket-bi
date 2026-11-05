import type { EtlGraph } from '@/core/data-cook/etlGraph';
import type { TablePreviewStatus } from '../../preview/etlPreview.utils';
import { previewTabLabel } from '../../preview/etlPreview.utils';
import type { ConditionForm, JoinForm } from '../join.utils';

/** A table of the ETL the join can read on its right. */
export interface RightOption {
  readonly value: string;
  readonly label: string;
  readonly disabled: boolean;
}

/**
 * The tables of the ETL to join `left` with (v1 `SelectSource` with the ETL's operators): every other table; one whose
 * preview isn't built has no columns to join on yet.
 */
export function rightOptions(graph: EtlGraph, left: string, statuses: ReadonlyMap<string, { readonly status: TablePreviewStatus }>): RightOption[] {
  return [...graph.operators]
    .filter(([name, operator]) => name !== left && operator.kind !== 'sendEmail')
    .map(([name, operator]) => ({ value: name, label: previewTabLabel(operator), disabled: statuses.get(name)?.status !== 'ready' }));
}

/** Another right table: its columns are others, so each condition's right column is picked again. */
export function withoutRightColumns(form: JoinForm): JoinForm {
  return { ...form, conditions: form.conditions.map(condition => ({ ...condition, right: undefined })) };
}

/** `form` with the condition at `index` changed. */
export function withCondition(form: JoinForm, index: number, change: Partial<ConditionForm>): JoinForm {
  return { ...form, conditions: form.conditions.map((condition, at) => (at === index ? { ...condition, ...change } : condition)) };
}
