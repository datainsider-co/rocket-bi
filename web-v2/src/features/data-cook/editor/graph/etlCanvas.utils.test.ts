import { describe, expect, it, vi } from 'vitest';
import fixture from '@/core/data-cook/etl.fixture.json';
import { etlJobFromJson } from '@/core/data-cook/EtlJob';
import type { EtlOperator } from '@/core/data-cook/EtlOperator';
import { etlGraphFromLeaves, type EtlGraph } from '@/core/data-cook/etlGraph';
import { draftFromEtl } from '../draft/etlDraft.utils';
import { keepMeasured, operatorLabel, toEtlEdges, toEtlNodes, type EtlNode, type EtlNodeData } from './etlCanvas.utils';

const draft1 = draftFromEtl(etlJobFromJson(fixture.etlUpdate.response));
const draft2 = draftFromEtl(etlJobFromJson(fixture.etlGetV1.response));
const onMenu = vi.fn<EtlNodeData['onMenu']>();

function nodesById(graph: EtlGraph, extraData = draft2.extraData) {
  return new Map(toEtlNodes(graph, extraData, onMenu).map(node => [node.id, node]));
}

function operator(graph: EtlGraph, name: string): EtlOperator {
  return graph.operators.get(name)!;
}

describe('toEtlNodes', () => {
  const nodes = nodesById(draft2.graph);

  it('draws each table with its database, at its position', () => {
    expect(nodes.get('table:sales')).toMatchObject({
      type: 'etlTable',
      position: { x: 20, y: 20 },
      data: { ref: { type: 'table', tblName: 'sales' }, title: 'di0_ingest', subtitle: 'sales' }
    });
    expect(nodes.get('table:sales_1_1')?.data).toMatchObject({ title: 'ETL Database', subtitle: 'sales_1_1' });
  });

  it("draws an operator's shape, but none for a source", () => {
    expect(nodes.get('operator:sales_join_sales_copy')).toMatchObject({ type: 'etlOperator', position: { x: 400, y: 340 }, data: { title: 'Inner join' } });
    expect(nodes.get('operator:sales_1_1')?.data.title).toBe('SQL Query');
    expect(nodes.has('operator:sales')).toBe(false);
  });

  it('offers Edit Display Name on operator tables only', () => {
    const keys = (id: string) => nodes.get(id)?.data.menu.map(item => item.key);
    expect(keys('table:sales')).not.toContain('rename');
    expect(keys('table:sales_1_1')).toContain('rename');
  });

  it('draws Save To Data Warehouse next to its table when it has no position', () => {
    expect(nodes.get('persist:sales_1_1')).toMatchObject({
      type: 'etlBox',
      position: { x: 800, y: 260 },
      data: { title: 'dc0_v1_out', subtitle: 'regioncount2' }
    });
  });

  it('stacks Save To Database boxes under the warehouse one', () => {
    const graph = {
      ...draft2.graph,
      operators: new Map(draft2.graph.operators).set('sales_1_1', {
        ...operator(draft2.graph, 'sales_1_1'),
        thirdPartyPersists: [{ database_name: 'shop', table_name: 'orders' }, {}]
      })
    };
    const drawn = nodesById(graph);

    expect(drawn.get('thirdParty:0:sales_1_1')).toMatchObject({ position: { x: 800, y: 330 }, data: { title: 'shop', subtitle: 'orders' } });
    expect(drawn.get('thirdParty:1:sales_1_1')?.data).toMatchObject({ title: '<<noname>>', subtitle: '<<noname>>' });
  });

  it('draws an email operator as a box only', () => {
    const drawn = nodesById(draft1.graph, draft1.extraData);

    expect(drawn.get('email:send_email_1')).toMatchObject({ position: { x: 1180, y: 580 }, data: { title: 'Email subject', subtitle: 'x' } });
    expect(drawn.has('table:send_email_1')).toBe(false);
    expect(drawn.has('operator:send_email_1')).toBe(false);
  });

  it('passes the menu handler to every node', () => {
    expect([...nodes.values()].every(node => node.data.onMenu === onMenu)).toBe(true);
  });
});

describe('toEtlEdges', () => {
  it("joins parents to the shape, the shape to its table and the table to its boxes (v1's arrows)", () => {
    expect(toEtlEdges(draft2.graph).map(edge => `${edge.source} > ${edge.target}`)).toEqual([
      'table:sales > operator:sales_join_sales_copy',
      'table:sales_copy > operator:sales_join_sales_copy',
      'operator:sales_join_sales_copy > table:sales_join_sales_copy',
      'table:sales_1 > operator:sales_1_1',
      'operator:sales_1_1 > table:sales_1_1',
      'table:sales_1_1 > persist:sales_1_1',
      'table:sales_1_1 > operator:sales_1_2',
      'operator:sales_1_2 > table:sales_1_2'
    ]);
  });

  it('sends an email operator straight from its parents', () => {
    const edges = toEtlEdges(draft1.graph).filter(edge => edge.target === 'email:send_email_1');
    expect(edges.map(edge => edge.source)).toEqual(['table:sales_transform']);
  });

  it('keeps the two arrows of a self join apart', () => {
    const graph = etlGraphFromLeaves([...draft2.graph.operators.values()]);
    const selfJoin: EtlGraph = { ...graph, parentNames: new Map(graph.parentNames).set('sales_join_sales_copy', ['sales', 'sales']) };
    const ids = toEtlEdges(selfJoin).filter(edge => edge.target === 'operator:sales_join_sales_copy').map(edge => edge.id);

    expect(new Set(ids).size).toBe(2);
  });

  it('draws arrows with an arrow head, around corners', () => {
    expect(toEtlEdges(draft2.graph)[0]).toMatchObject({ type: 'smoothstep', markerEnd: { type: 'arrowclosed' } });
  });
});

describe('operatorLabel', () => {
  it.each([
    ['sales_join_sales_copy', 'Inner join'],
    ['sales_1_2', 'Manage Fields']
  ])('%s is %s', (name, label) => {
    expect(operatorLabel(operator(draft2.graph, name))).toBe(label);
  });

  it('names the other operators', () => {
    expect(operatorLabel(operator(draft1.graph, 'sales_pivot'))).toBe('Pivot Table');
    expect(operatorLabel(operator(draft1.graph, 'sales_py'))).toBe('Python Query');
  });
});

describe('keepMeasured', () => {
  const node = (id: string, x = 0): EtlNode =>
    ({ id, position: { x, y: 0 }, data: {} }) as unknown as EtlNode;

  it("keeps a node's measured size and takes the new position", () => {
    const current = [{ ...node('a'), measured: { width: 10, height: 20 } }];
    expect(keepMeasured([node('a', 5), node('b')], current)).toEqual([{ ...node('a', 5), measured: { width: 10, height: 20 } }, node('b')]);
  });

  it('returns no node for an empty canvas', () => {
    expect(keepMeasured([], [node('a')])).toEqual([]);
  });
});
