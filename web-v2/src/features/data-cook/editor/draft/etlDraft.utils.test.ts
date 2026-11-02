import { describe, expect, it } from 'vitest';
import fixture from '@/core/data-cook/etl.fixture.json';
import { etlJobFromJson, etlJobToJson } from '@/core/data-cook/EtlJob';
import { etlOperatorToJson } from '@/core/data-cook/EtlOperator';
import { leafNames } from '@/core/data-cook/etlGraph';
import { PositionGroup, readPosition, thirdPartyPositionKey, writePosition } from '@/core/data-cook/etlExtraData';
import {
  addOperator,
  alreadySourceText,
  downstreamNames,
  draftFromEtl,
  draftSnapshot,
  etlFromDraft,
  etlNameSchema,
  findSource,
  newSourceOperator,
  removeOperator,
  removePersist,
  removeStepsText,
  removeThirdParty,
  renameTable,
  type EtlDraft
} from './etlDraft.utils';

const etl2 = etlJobFromJson(fixture.etlGetV1.response);
const draft2 = draftFromEtl(etl2);

const SALES = { name: 'sales', db_name: 'di0_ingest', display_name: 'Sales', columns: [{ class_name: 'string', name: 'region' }] };

function withThirdParties(draft: EtlDraft, count: number): EtlDraft {
  const operator = draft.graph.operators.get('sales_1')!;
  const thirdPartyPersists = Array.from({ length: count }, (_, index) => ({ table_name: `t${index}` }));
  const operators = new Map(draft.graph.operators).set('sales_1', { ...operator, thirdPartyPersists });
  let extraData = draft.extraData;
  for (let index = 0; index < count; index += 1) {
    extraData = writePosition(extraData, PositionGroup.SavedThirdParty, thirdPartyPositionKey('sales_1', index), { x: index, y: index });
  }
  return { ...draft, graph: { ...draft.graph, operators }, extraData };
}

describe('draftFromEtl and etlFromDraft', () => {
  it('give back the ETL v1 saved', () => {
    expect(etlJobToJson(etlFromDraft(draft2))).toEqual(etlJobToJson(etl2));
  });

  it('lay out what has no position', () => {
    const draft = draftFromEtl(etlJobFromJson(fixture.etlUpdate.response));
    expect(readPosition(draft.extraData, PositionGroup.Table, 'sales_sql')).toEqual({ x: 600, y: 20 });
  });

  it('save the new name', () => {
    expect(etlFromDraft({ ...draft2, displayName: 'Renamed' }).displayName).toBe('Renamed');
  });
});

describe('draftSnapshot', () => {
  it('changes with an edit and a move, not otherwise', () => {
    expect(draftSnapshot(draftFromEtl(etl2))).toBe(draftSnapshot(draft2));
    expect(draftSnapshot(renameTable(draft2, 'sales_1_1', 'x'))).not.toBe(draftSnapshot(draft2));
    const moved = { ...draft2, extraData: writePosition(draft2.extraData, PositionGroup.Table, 'sales', { x: 1, y: 1 }) };
    expect(draftSnapshot(moved)).not.toBe(draftSnapshot(draft2));
  });
});

describe('findSource', () => {
  it('finds the source reading a table', () => {
    expect(findSource(draft2.graph, 'sample_v2', 'sales')?.destTable.tblName).toBe('sales_1');
    expect(findSource(draft2.graph, 'di0_ingest', 'sales')?.destTable.tblName).toBe('sales');
  });

  it('is undefined for a table not read, and ignores operator tables', () => {
    expect(findSource(draft2.graph, 'di0_ingest', 'orders')).toBeUndefined();
    expect(findSource(draft2.graph, 'ETL Database', 'sales_1_1')).toBeUndefined();
  });
});

describe('newSourceOperator', () => {
  it("builds v1's source, named after the table and made unique", () => {
    const operator = newSourceOperator(SALES, 'DI0 Ingest', new Set(['sales', 'sales_1']));

    expect(operator.kind).toBe('getData');
    expect(etlOperatorToJson(operator)).toEqual({
      class_name: 'get_data_operator',
      dest_table_config: { tbl_name: 'sales_2', db_display_name: 'DI0 Ingest', tbl_display_name: 'sales_2' },
      table_schema: SALES,
      is_persistent: false,
      third_party_persist_configurations: []
    });
  });

  it('keeps the name when it is free', () => {
    expect(newSourceOperator(SALES, 'db', new Set()).destTable.tblName).toBe('sales');
  });
});

describe('addOperator', () => {
  it('adds a leaf below everything on the canvas', () => {
    const draft = addOperator(draft2, newSourceOperator(SALES, 'db', new Set(draft2.graph.operators.keys())));

    expect(leafNames(draft.graph)).toContain('sales_2');
    expect(readPosition(draft.extraData, PositionGroup.Table, 'sales_2')).toEqual({ x: 20, y: 500 });
    expect(draft2.graph.operators.has('sales_2')).toBe(false);
  });
});

describe('downstreamNames', () => {
  it('is the table and everything reading from it', () => {
    expect(downstreamNames(draft2.graph, 'sales_1')).toEqual(['sales_1', 'sales_1_1', 'sales_1_2']);
    expect(downstreamNames(draft2.graph, 'sales')).toEqual(['sales', 'sales_join_sales_copy']);
    expect(downstreamNames(draft2.graph, 'sales_1_2')).toEqual(['sales_1_2']);
  });

  it('is empty for a table not in the ETL', () => {
    expect(downstreamNames(draft2.graph, 'missing')).toEqual([]);
  });
});

describe('removeOperator', () => {
  it('removes the table with what reads it, and their positions', () => {
    const draft = removeOperator(draft2, 'sales');

    expect([...draft.graph.operators.keys()]).toEqual(['sales_copy', 'sales_1', 'sales_1_1', 'sales_1_2']);
    expect(leafNames(draft.graph)).toEqual(['sales_copy', 'sales_1_2']);
    expect(readPosition(draft.extraData, PositionGroup.Table, 'sales')).toBeUndefined();
    expect(readPosition(draft.extraData, PositionGroup.Operator, 'sales_join_sales_copy')).toBeUndefined();
    expect(readPosition(draft.extraData, PositionGroup.Table, 'sales_copy')).toBeDefined();
  });

  it('removes Save To Database positions too', () => {
    const draft = removeOperator(withThirdParties(draft2, 2), 'sales_1');
    expect(readPosition(draft.extraData, PositionGroup.SavedThirdParty, thirdPartyPositionKey('sales_1', 1))).toBeUndefined();
  });
});

describe('renameTable', () => {
  it('changes the display name only', () => {
    const operator = renameTable(draft2, 'sales_1_1', 'Region count').graph.operators.get('sales_1_1');
    expect(operator?.destTable).toMatchObject({ tblName: 'sales_1_1', tblDisplayName: 'Region count' });
  });

  it('leaves the draft as it is for an unknown table', () => {
    expect(renameTable(draft2, 'missing', 'x')).toBe(draft2);
  });
});

describe('removePersist', () => {
  it('stops saving the table to the warehouse', () => {
    let draft = { ...draft2, extraData: writePosition(draft2.extraData, PositionGroup.SavedTable, 'sales_11', { x: 1, y: 2 }) };
    draft = removePersist(draft, 'sales_1_1');

    expect(draft.graph.operators.get('sales_1_1')?.persist).toBeUndefined();
    expect(readPosition(draft.extraData, PositionGroup.SavedTable, 'sales_11')).toBeUndefined();
  });
});

describe('removeThirdParty', () => {
  const position = (draft: EtlDraft, index: number) =>
    readPosition(draft.extraData, PositionGroup.SavedThirdParty, thirdPartyPositionKey('sales_1', index));

  it('removes one box; the next ones keep where they were drawn', () => {
    const draft = removeThirdParty(withThirdParties(draft2, 3), 'sales_1', 1);

    expect(draft.graph.operators.get('sales_1')?.thirdPartyPersists).toEqual([{ table_name: 't0' }, { table_name: 't2' }]);
    expect(position(draft, 0)).toEqual({ x: 0, y: 0 });
    expect(position(draft, 1)).toEqual({ x: 2, y: 2 });
    expect(position(draft, 2)).toBeUndefined();
  });

  it('ignores an index out of range', () => {
    const draft = withThirdParties(draft2, 1);
    expect(removeThirdParty(draft, 'sales_1', 1)).toBe(draft);
    expect(removeThirdParty(draft, 'sales_1', -1)).toBe(draft);
    expect(removeThirdParty(draft, 'missing', 0)).toBe(draft);
  });
});

describe('etlNameSchema', () => {
  it('takes a trimmed name', () => {
    expect(etlNameSchema.parse({ name: '  Sales ETL ' })).toEqual({ name: 'Sales ETL' });
  });

  it.each([
    ['', 'Field is required.'],
    ['   ', 'Field is required.'],
    ['x'.repeat(251), 'Max length is 250 chars.'],
    ['a/b', "Field can't contain special characters"],
    ['a@b', "Field can't contain special characters"]
  ])('refuses %j', (name, message) => {
    const result = etlNameSchema.safeParse({ name });
    expect(result.success).toBe(false);
    expect(result.error?.issues[0]?.message).toBe(message);
  });
});

describe('removeStepsText', () => {
  it('counts the steps going with it', () => {
    expect(removeStepsText('sales', 1)).toBe("Remove 'sales' and the step after it?");
    expect(removeStepsText('sales', 3)).toBe("Remove 'sales' and the 3 steps after it?");
  });
});

describe('alreadySourceText', () => {
  it('names the table', () => {
    expect(alreadySourceText('orders')).toBe('orders is already a source of this ETL');
  });
});
