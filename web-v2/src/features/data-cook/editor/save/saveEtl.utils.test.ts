import { describe, expect, it } from 'vitest';
import fixture from '@/core/data-cook/etl.fixture.json';
import { etlJobFromJson } from '@/core/data-cook/EtlJob';
import { draftFromEtl } from '../draft/etlDraft.utils';
import { incrementalConfigsOf, incrementalSources, saveEtlSchema, saveEtlValuesOf, savedEtlOf } from './saveEtl.utils';

/** ETL 2: daily, incremental on `sales_1` (DC0). */
const draft = draftFromEtl(etlJobFromJson(fixture.etlGetV1.response));
const UTC = () => 0;
const NOW = Date.UTC(2026, 10, 5, 8, 30, 0);

describe('incrementalSources', () => {
  it("lists the source tables with their columns", () => {
    const sources = incrementalSources(draft.graph);

    expect(sources.map(source => source.tblName)).toEqual(['sales', 'sales_copy', 'sales_1']);
    expect(sources[0]?.columns[0]).toEqual({ value: 'region', label: 'region' });
  });
});

describe('saveEtlValuesOf', () => {
  it("reads the name, the schedule and each source's run mode", () => {
    const values = saveEtlValuesOf(draft, NOW, UTC);

    expect(values.name).toBe('DC0 v1 ETL');
    expect(values.schedule).toMatchObject({ mode: 'recurring', frequency: 'daily' });
    expect(values.incremental).toEqual([
      { tblName: 'sales', mode: 'full', column: '', value: '' },
      { tblName: 'sales_copy', mode: 'full', column: '', value: '' },
      { tblName: 'sales_1', mode: 'incremental', column: expect.any(String), value: expect.any(String) }
    ]);
  });
});

describe('saveEtlSchema', () => {
  const values = saveEtlValuesOf(draft, NOW, UTC);

  it('takes the values read', () => {
    expect(saveEtlSchema.safeParse(values).success).toBe(true);
  });

  it('asks for a column on an incremental source', () => {
    const result = saveEtlSchema.safeParse({ ...values, incremental: [{ tblName: 'sales', mode: 'incremental', column: '', value: '' }] });

    expect(result.error?.issues.map(issue => [issue.path.join('.'), issue.message])).toEqual([['incremental.0.column', 'Please select a column']]);
  });

  it("checks the name with the editor's rules", () => {
    expect(saveEtlSchema.safeParse({ ...values, name: 'a/b' }).error?.issues[0]?.message).toBe("Field can't contain special characters");
  });
});

describe('incrementalConfigsOf', () => {
  it("keeps the incremental sources under v1's key", () => {
    expect(
      incrementalConfigsOf([
        { tblName: 'sales1', mode: 'incremental', column: 'id', value: ' 10 ' },
        { tblName: 'other', mode: 'full', column: 'x', value: '' }
      ])
    ).toEqual({ sales_1: { columnName: 'id', value: '10' } });
  });

  it('is empty for full runs only', () => {
    expect(incrementalConfigsOf([])).toEqual({});
  });
});

describe('savedEtlOf', () => {
  it("puts the dialog's values on the draft", () => {
    const values = { ...saveEtlValuesOf(draft, NOW, UTC), name: ' Sales ETL ' };
    const etl = savedEtlOf(draft, { ...values, schedule: { ...values.schedule, mode: 'once', date: '2026-11-06', time: '01:00:00' } }, NOW, UTC);

    expect(etl.displayName).toBe('Sales ETL');
    expect(etl.scheduleTime).toEqual({ kind: 'once', startTime: Date.UTC(2026, 10, 6, 1, 0, 0) });
    expect(Object.keys(etl.incrementalConfigs)).toEqual(['sales_1']);
    expect(etl.operators.map(operator => operator.destTable.tblName)).toEqual(['sales_join_sales_copy', 'sales_1_2']);
  });
});
