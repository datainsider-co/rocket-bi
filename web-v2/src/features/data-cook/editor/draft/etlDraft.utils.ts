import { z } from 'zod';
import { etlJobToJson, type EtlJob } from '@/core/data-cook/EtlJob';
import {
  EtlOperatorClassName,
  etlOperatorFromJson,
  type EtlOperator,
  type GetDataOperator,
  type PersistConfiguration
} from '@/core/data-cook/EtlOperator';
import { etlGraphFromLeaves, leavesFromGraph, uniqueTableName, type EtlGraph } from '@/core/data-cook/etlGraph';
import {
  PositionGroup,
  positionKey,
  readPosition,
  removePosition,
  removeRenderOptions,
  thirdPartyPositionKey,
  writePosition,
  writeRenderOptions
} from '@/core/data-cook/etlExtraData';
import { asString, type JsonObject } from '@/core/json/json';
import { layoutEtl } from '../graph/etlLayout.utils';

/**
 * What the editor changes: the ETL as a flat graph (`etlGraph`) with its layout and name. `etl` is the ETL the server
 * last answered with; its schedule and incremental settings go back as they are (the Save dialog edits them, DC9).
 */
export interface EtlDraft {
  readonly etl: EtlJob;
  readonly displayName: string;
  readonly graph: EtlGraph;
  /** `extra_data`, with a position for every table and operator (`layoutEtl`). */
  readonly extraData: JsonObject;
}

/** v1's name for a new ETL. */
export const NEW_ETL_NAME = 'Untitled ETL';

export function draftFromEtl(etl: EtlJob): EtlDraft {
  const graph = etlGraphFromLeaves(etl.operators);
  return { etl, displayName: etl.displayName, graph, extraData: layoutEtl(graph, etl.extraData) };
}

/** The ETL to save: the leaves rebuilt from the graph. */
export function etlFromDraft(draft: EtlDraft): EtlJob {
  return { ...draft.etl, displayName: draft.displayName, operators: leavesFromGraph(draft.graph), extraData: draft.extraData };
}

/** What Save would send, to tell whether anything changed (moving a box counts: its position is saved). */
export function draftSnapshot(draft: EtlDraft): string {
  return JSON.stringify(etlJobToJson(etlFromDraft(draft)));
}

function withOperators(graph: EtlGraph, operators: ReadonlyMap<string, EtlOperator>, parentNames = graph.parentNames): EtlGraph {
  return { operators, parentNames };
}

/** The source already reading `dbName.tblName`, if any: v1 added a table once. */
export function findSource(graph: EtlGraph, dbName: string, tblName: string): GetDataOperator | undefined {
  for (const operator of graph.operators.values()) {
    if (operator.kind === 'getData' && operator.tableSchema.dbName === dbName && operator.tableSchema.name === tblName) {
      return operator;
    }
  }
  return undefined;
}

/**
 * A source reading a warehouse table (v1 `createGetDataOperator`): named after the table (not its display name), made
 * unique among the ETL's tables, with the server's table JSON as its `table_schema`.
 */
export function newSourceOperator(table: JsonObject, dbDisplayName: string, taken: ReadonlySet<string>): EtlOperator {
  const tblName = uniqueTableName(asString(table['name']), taken);
  return etlOperatorFromJson({
    class_name: EtlOperatorClassName.GetData,
    dest_table_config: { tbl_name: tblName, db_display_name: dbDisplayName, tbl_display_name: tblName },
    table_schema: table,
    is_persistent: false,
    third_party_persist_configurations: []
  });
}

/** `operator` as a new leaf, placed like v1 places a new source (below the others). */
export function addOperator(draft: EtlDraft, operator: EtlOperator, parentNames: readonly string[] = []): EtlDraft {
  const name = operator.destTable.tblName;
  const operators = new Map(draft.graph.operators).set(name, operator);
  const graph = withOperators(draft.graph, operators, new Map(draft.graph.parentNames).set(name, parentNames));
  return { ...draft, graph, extraData: layoutEtl(graph, draft.extraData) };
}

/** `tblName` and every operator reading from it, directly or not: what removing it takes away (v1). */
export function downstreamNames(graph: EtlGraph, tblName: string): string[] {
  const found = new Set([tblName]);
  // Parents come before the operators reading them, so one pass in graph order finds every descendant.
  for (const [name, parents] of graph.parentNames) {
    if (parents.some(parent => found.has(parent))) found.add(name);
  }
  return [...found].filter(name => graph.operators.has(name));
}

/** Every box drawn for `tblName` and its builder state, so a removed table leaves nothing behind (v1 `clearOperatorData`). */
function withoutPositions(extraData: JsonObject, tblName: string, thirdParties: number): JsonObject {
  const key = positionKey(tblName);
  const groups = [PositionGroup.Table, PositionGroup.Operator, PositionGroup.SavedTable, PositionGroup.SavedEmail];
  let result = groups.reduce((data, group) => removePosition(data, group, key), removeRenderOptions(extraData, tblName));
  for (let index = 0; index < thirdParties; index += 1) {
    result = removePosition(result, PositionGroup.SavedThirdParty, thirdPartyPositionKey(tblName, index));
  }
  return result;
}

/**
 * The draft without `tblName` and everything after it (v1 `removeOperator`). The other input of a removed join becomes
 * a leaf again.
 */
export function removeOperator(draft: EtlDraft, tblName: string): EtlDraft {
  const removed = new Set(downstreamNames(draft.graph, tblName));
  const operators = new Map([...draft.graph.operators].filter(([name]) => !removed.has(name)));
  const parentNames = new Map([...draft.graph.parentNames].filter(([name]) => !removed.has(name)));
  const extraData = [...removed].reduce(
    (data, name) => withoutPositions(data, name, draft.graph.operators.get(name)?.thirdPartyPersists.length ?? 0),
    draft.extraData
  );
  return { ...draft, graph: withOperators(draft.graph, operators, parentNames), extraData };
}

function updateOperator(draft: EtlDraft, tblName: string, update: (operator: EtlOperator) => EtlOperator): EtlDraft {
  const operator = draft.graph.operators.get(tblName);
  if (!operator) return draft;
  return { ...draft, graph: withOperators(draft.graph, new Map(draft.graph.operators).set(tblName, update(operator))) };
}

/** The ChartBuilder state of a Transform or Pivot, kept in `extra_data` as v1 did; none leaves what is there. */
export function withRenderOptions(draft: EtlDraft, tblName: string, renderOptions: JsonObject | undefined): EtlDraft {
  return renderOptions ? { ...draft, extraData: writeRenderOptions(draft.extraData, tblName, renderOptions) } : draft;
}

/** An edited operator in place of the one writing the same table; what it reads stays (v1 `handleUpdateOperator`). */
export function replaceOperator(draft: EtlDraft, operator: EtlOperator): EtlDraft {
  return updateOperator(draft, operator.destTable.tblName, () => operator);
}

/** v1 "Edit Display Name": only the display name changes; the table keeps its name. */
export function renameTable(draft: EtlDraft, tblName: string, displayName: string): EtlDraft {
  return updateOperator(draft, tblName, operator => ({ ...operator, destTable: { ...operator.destTable, tblDisplayName: displayName } }));
}

/** Save To Data Warehouse of a table, added or edited (v1 `handleSaveToDataWareHouse`). */
export function setPersist(draft: EtlDraft, tblName: string, persist: PersistConfiguration): EtlDraft {
  return updateOperator(draft, tblName, operator => (operator.kind === 'sendEmail' ? operator : { ...operator, persist }));
}

/** Remove of a Save To Data Warehouse box. */
export function removePersist(draft: EtlDraft, tblName: string): EtlDraft {
  const updated = updateOperator(draft, tblName, operator => ({ ...operator, persist: undefined }));
  return { ...updated, extraData: removePosition(updated.extraData, PositionGroup.SavedTable, positionKey(tblName)) };
}

/** Remove of the `index`-th Save To Database box; the boxes after it keep where they were drawn. */
export function removeThirdParty(draft: EtlDraft, tblName: string, index: number): EtlDraft {
  const operator = draft.graph.operators.get(tblName);
  if (!operator || index < 0 || index >= operator.thirdPartyPersists.length) return draft;
  const count = operator.thirdPartyPersists.length;
  let extraData = draft.extraData;
  for (let current = index; current < count; current += 1) {
    const key = thirdPartyPositionKey(tblName, current);
    const next = readPosition(extraData, PositionGroup.SavedThirdParty, thirdPartyPositionKey(tblName, current + 1));
    extraData = next ? writePosition(extraData, PositionGroup.SavedThirdParty, key, next) : removePosition(extraData, PositionGroup.SavedThirdParty, key);
  }
  const updated = updateOperator(draft, tblName, item => ({ ...item, thirdPartyPersists: item.thirdPartyPersists.filter((_, at) => at !== index) }));
  return { ...updated, extraData };
}

/** v1 `DiRenameModal` rules and `ETL_JOB_NAME_INVALID_REGEX`, for the ETL's name and a table's display name. */
const MAX_NAME_LENGTH = 250;
const SPECIAL_CHARACTERS = /[\\/?*"><:|@(){}`]/;

export const etlNameSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, 'Field is required.')
    .max(MAX_NAME_LENGTH, `Max length is ${MAX_NAME_LENGTH} chars.`)
    .refine(name => !SPECIAL_CHARACTERS.test(name), "Field can't contain special characters")
});

export type EtlNameForm = z.infer<typeof etlNameSchema>;

/** The confirm before a remove that takes `after` more steps with it (v1 removed them without asking). */
export function removeStepsText(displayName: string, after: number): string {
  return `Remove '${displayName}' and the ${after === 1 ? 'step' : `${after} steps`} after it?`;
}

/** v1 ignored a table picked twice; v2 says why nothing happened. */
export function alreadySourceText(tblName: string): string {
  return `${tblName} is already a source of this ETL`;
}
