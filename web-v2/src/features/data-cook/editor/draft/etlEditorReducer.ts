import type { EtlJob } from '@/core/data-cook/EtlJob';
import type { EtlOperator } from '@/core/data-cook/EtlOperator';
import { writePosition, type Point } from '@/core/data-cook/etlExtraData';
import { positionTarget, type EtlNodeRef } from '../graph/etlNodeRef';
import {
  addOperator,
  draftFromEtl,
  removeOperator,
  removePersist,
  replaceOperator,
  removeThirdParty,
  renameTable,
  type EtlDraft
} from './etlDraft.utils';

/** The draft and what it started from (the last load, create or save): Discard goes back to `base`. */
export interface EtlEditorState {
  readonly base: EtlDraft;
  readonly draft: EtlDraft;
}

export interface NodeMove {
  readonly ref: EtlNodeRef;
  readonly point: Point;
}

export type EtlEditorAction =
  /** The server made the ETL (lazily, on the first source): its id from now on; the edits stay unsaved. */
  | { readonly type: 'created'; readonly etl: EtlJob }
  /** The server stored the draft and answered with the ETL: the new starting point. */
  | { readonly type: 'saved'; readonly etl: EtlJob }
  | { readonly type: 'discard' }
  | { readonly type: 'rename'; readonly displayName: string }
  | { readonly type: 'addSource'; readonly operator: EtlOperator }
  /** A new operator reading `parentNames`, after the sources it brings (a join with a warehouse table). */
  | { readonly type: 'addOperator'; readonly operator: EtlOperator; readonly parentNames: readonly string[]; readonly sources?: readonly EtlOperator[] }
  | { readonly type: 'updateOperator'; readonly operator: EtlOperator }
  | { readonly type: 'remove'; readonly ref: EtlNodeRef }
  | { readonly type: 'renameTable'; readonly tblName: string; readonly displayName: string }
  | { readonly type: 'move'; readonly moves: readonly NodeMove[] };

export function initEtlEditor(etl: EtlJob): EtlEditorState {
  const draft = draftFromEtl(etl);
  return { base: draft, draft };
}

function removeNode(draft: EtlDraft, ref: EtlNodeRef): EtlDraft {
  switch (ref.type) {
    case 'persist':
      return removePersist(draft, ref.tblName);
    case 'thirdParty':
      return removeThirdParty(draft, ref.tblName, ref.index);
    default:
      // A table, its shape and an email box are all the operator.
      return removeOperator(draft, ref.tblName);
  }
}

function edit(state: EtlEditorState, draft: EtlDraft): EtlEditorState {
  return draft === state.draft ? state : { ...state, draft };
}

export function etlEditorReducer(state: EtlEditorState, action: EtlEditorAction): EtlEditorState {
  const { draft } = state;
  switch (action.type) {
    case 'created':
      return { base: draftFromEtl(action.etl), draft: { ...draft, etl: action.etl } };
    case 'saved':
      return initEtlEditor(action.etl);
    case 'discard':
      return { ...state, draft: state.base };
    case 'rename':
      return edit(state, { ...draft, displayName: action.displayName });
    case 'addSource':
      return edit(state, addOperator(draft, action.operator));
    case 'addOperator': {
      const withSources = (action.sources ?? []).reduce((current, source) => addOperator(current, source), draft);
      return edit(state, addOperator(withSources, action.operator, action.parentNames));
    }
    case 'updateOperator':
      return edit(state, replaceOperator(draft, action.operator));
    case 'remove':
      return edit(state, removeNode(draft, action.ref));
    case 'renameTable':
      return edit(state, renameTable(draft, action.tblName, action.displayName));
    case 'move': {
      const extraData = action.moves.reduce((data, { ref, point }) => {
        const { group, key } = positionTarget(ref);
        return writePosition(data, group, key, { x: Math.round(point.x), y: Math.round(point.y) });
      }, draft.extraData);
      return edit(state, { ...draft, extraData });
    }
  }
}
