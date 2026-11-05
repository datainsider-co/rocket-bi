import { describe, expect, it } from 'vitest';
import fixture from './etl.fixture.json';
import { etlOperatorFromJson, etlOperatorToJson, operatorParents, type EtlOperator } from './EtlOperator';
import { ancestorNames, baseTableName, etlGraphFromLeaves, leafNames, leavesFromGraph, operatorTree, uniqueTableName, type EtlGraph } from './etlGraph';

function source(tblName: string): EtlOperator {
  return {
    kind: 'getData',
    className: 'get_data_operator',
    destTable: { tblName, dbDisplayName: 'db', tblDisplayName: tblName },
    persist: undefined,
    thirdPartyPersists: [],
    tableSchema: { dbName: 'db', name: tblName, columns: [] },
    json: {}
  };
}

function sql(tblName: string, parent: EtlOperator, query = 'select 1'): EtlOperator {
  return {
    kind: 'sql',
    className: 'sql_query_operator',
    destTable: { tblName, dbDisplayName: 'ETL Database', tblDisplayName: tblName },
    persist: undefined,
    thirdPartyPersists: [],
    parent,
    query,
    json: {}
  };
}

function join(tblName: string, left: EtlOperator, right: EtlOperator): EtlOperator {
  return {
    kind: 'join',
    className: 'join_operator',
    destTable: { tblName, dbDisplayName: 'ETL Database', tblDisplayName: tblName },
    persist: undefined,
    thirdPartyPersists: [],
    joins: [{ left, right, conditions: [], joinType: 'left' }],
    json: {}
  };
}

function email(tblName: string, parents: EtlOperator[]): EtlOperator {
  return {
    kind: 'sendEmail',
    className: 'send_to_group_email_operator',
    destTable: { tblName, dbDisplayName: 'ETL Database', tblDisplayName: tblName },
    persist: undefined,
    thirdPartyPersists: [],
    parents,
    receivers: [],
    cc: [],
    bcc: [],
    subject: '',
    content: undefined,
    displayName: undefined,
    fileNames: [],
    isZip: false,
    fileType: 'Csv',
    json: {}
  };
}

const v1Leaves = fixture.etlGetV1.response.operators.map(etlOperatorFromJson);

describe('etlGraphFromLeaves', () => {
  it('lists every operator once, parents first', () => {
    const graph = etlGraphFromLeaves(v1Leaves);

    expect([...graph.operators.keys()]).toEqual(['sales', 'sales_copy', 'sales_join_sales_copy', 'sales_1', 'sales_1_1', 'sales_1_2']);
    expect(graph.parentNames.get('sales_join_sales_copy')).toEqual(['sales', 'sales_copy']);
    expect(graph.parentNames.get('sales_1_2')).toEqual(['sales_1_1']);
    expect(graph.parentNames.get('sales')).toEqual([]);
  });

  it('keeps the first copy of an operator two leaves read from', () => {
    const shared = source('a');
    const graph = etlGraphFromLeaves([sql('b', shared), sql('c', { ...shared, destTable: { ...shared.destTable, tblDisplayName: 'copy' } })]);

    expect([...graph.operators.keys()]).toEqual(['a', 'b', 'c']);
    expect(graph.operators.get('a')?.destTable.tblDisplayName).toBe('a');
  });

  it('is empty without leaves', () => {
    expect(etlGraphFromLeaves([]).operators.size).toBe(0);
  });
});

describe('leafNames', () => {
  it('lists the operators nothing reads from', () => {
    expect(leafNames(etlGraphFromLeaves(v1Leaves))).toEqual(['sales_join_sales_copy', 'sales_1_2']);
  });

  it('counts a lone source as a leaf', () => {
    expect(leafNames(etlGraphFromLeaves([source('a'), sql('c', source('b'))]))).toEqual(['a', 'c']);
  });
});

describe('leavesFromGraph', () => {
  it('builds back what it was read from', () => {
    const leaves = leavesFromGraph(etlGraphFromLeaves(v1Leaves));

    expect(leaves.map(etlOperatorToJson)).toEqual(v1Leaves.map(etlOperatorToJson));
  });

  it('puts an edited operator into every leaf that reads it', () => {
    const shared = source('a');
    const graph = etlGraphFromLeaves([sql('b', shared), sql('c', shared)]);
    const edited: EtlGraph = {
      ...graph,
      operators: new Map(graph.operators).set('a', { ...shared, destTable: { ...shared.destTable, tblDisplayName: 'Edited' } })
    };

    const leaves = leavesFromGraph(edited);

    expect(leaves.map(leaf => operatorParents(leaf)[0]?.destTable.tblDisplayName)).toEqual(['Edited', 'Edited']);
  });

  it('follows a join and an email with several parents', () => {
    const a = source('a');
    const b = source('b');
    const graph = etlGraphFromLeaves([email('mail', [join('a_join_b', a, b), sql('c', a)])]);

    const [leaf] = leavesFromGraph(graph);

    expect(leaf && operatorParents(leaf).map(parent => parent.destTable.tblName)).toEqual(['a_join_b', 'c']);
  });

  it('keeps an operator whose parent is gone as it was', () => {
    const graph = etlGraphFromLeaves([sql('b', source('a'))]);
    const operators = new Map(graph.operators);
    operators.delete('a');

    const [leaf] = leavesFromGraph({ ...graph, operators });

    expect(leaf && operatorParents(leaf)[0]?.destTable.tblName).toBe('a');
  });

  it('stops at a cycle instead of looping', () => {
    const graph: EtlGraph = {
      operators: new Map([
        ['x', sql('x', source('y'))],
        ['y', sql('y', source('x'))],
        ['z', sql('z', source('x'))]
      ]),
      parentNames: new Map([
        ['x', ['y']],
        ['y', ['x']],
        ['z', ['x']]
      ])
    };

    expect(leavesFromGraph(graph).map(leaf => leaf.destTable.tblName)).toEqual(['z']);
  });
});

describe('operatorTree', () => {
  it('builds one table with everything it reads from', () => {
    const graph = etlGraphFromLeaves(v1Leaves);

    const tree = operatorTree(graph, 'sales_1_1');

    expect(tree && etlOperatorToJson(tree)).toEqual(etlOperatorToJson(operatorParents(v1Leaves[1]!)[0]!));
  });

  it('is undefined for a table the graph lacks', () => {
    expect(operatorTree(etlGraphFromLeaves(v1Leaves), 'gone')).toBeUndefined();
  });
});

describe('ancestorNames', () => {
  it('lists the tables a table reads from, directly or not', () => {
    const graph = etlGraphFromLeaves(v1Leaves);

    expect([...ancestorNames(graph, 'sales_1_2')]).toEqual(['sales_1_1', 'sales_1']);
    expect([...ancestorNames(graph, 'sales_join_sales_copy')]).toEqual(['sales', 'sales_copy']);
    expect(ancestorNames(graph, 'sales').size).toBe(0);
  });

  it('stops at a cycle', () => {
    const graph: EtlGraph = {
      operators: new Map([
        ['x', sql('x', source('y'))],
        ['y', sql('y', source('x'))]
      ]),
      parentNames: new Map([
        ['x', ['y']],
        ['y', ['x']]
      ])
    };

    expect([...ancestorNames(graph, 'x')]).toEqual(['y', 'x']);
  });
});

describe('uniqueTableName', () => {
  it.each([
    ['sales', [], 'sales'],
    ['sales', ['sales'], 'sales_1'],
    ['sales', ['sales', 'sales_1'], 'sales_2'],
    ['sales_1', ['sales', 'sales_1', 'sales_1_1'], 'sales_1_2']
  ])('names %s with %j taken as %s', (base, taken, expected) => {
    expect(uniqueTableName(base, new Set(taken))).toBe(expected);
  });
});

describe('baseTableName', () => {
  const a = source('a');
  const b = source('b');

  it('names an operator on a source after the source', () => {
    expect(baseTableName([a])).toBe('a');
  });

  it('goes up a chain of single parents to the source', () => {
    expect(baseTableName([sql('a_2', sql('a_1', a))])).toBe('a');
  });

  it('names a join of two tables after both', () => {
    expect(baseTableName([a, b])).toBe('a_join_b');
  });

  it('stops where a chain meets a join', () => {
    expect(baseTableName([sql('c', join('a_join_b', a, b))])).toBe('a_join_b');
  });

  it('takes the first of more than two tables', () => {
    expect(baseTableName([a, b, source('c')])).toBe('a');
  });

  it('gives v1 names for the ETL made with v1', () => {
    const graph = etlGraphFromLeaves(v1Leaves);
    const taken = new Set(graph.operators.keys());
    const sales1 = graph.operators.get('sales_1_1');

    expect(sales1 && uniqueTableName(baseTableName([sales1]), taken)).toBe('sales_1_3');
  });

  it('is empty without parents', () => {
    expect(baseTableName([])).toBe('');
  });
});
