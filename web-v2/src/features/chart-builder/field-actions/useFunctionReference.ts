import { useCallback, useMemo, useState } from 'react';
import { ALL_FUNCTIONS, findFunction, functionGroupsOf, functionsOf, type FunctionCatalog, type FunctionInfo } from './functionCatalog.utils';

export interface FunctionReference {
  readonly groups: readonly string[];
  readonly group: string;
  readonly onGroup: (group: string) => void;
  readonly functions: readonly FunctionInfo[];
  /** The function whose description shows: picked in the list, or named under the editor's cursor. */
  readonly selected?: FunctionInfo;
  readonly onSelect: (info: FunctionInfo) => void;
}

/** The function list beside a formula (v1 `CalculatedFieldModal`): a group, its functions and one's description. */
export function useFunctionReference(catalog: FunctionCatalog | undefined) {
  const [group, setGroup] = useState(ALL_FUNCTIONS);
  const [picked, setPicked] = useState<FunctionInfo>();
  const groups = useMemo(() => (catalog ? functionGroupsOf(catalog) : [ALL_FUNCTIONS]), [catalog]);
  const functions = useMemo(() => (catalog ? functionsOf(catalog, group) : []), [catalog, group]);
  // The first function shows until one is picked, as in v1.
  const selected = picked ?? functions[0];
  const onWord = useCallback(
    (word: string) => {
      const info = catalog && findFunction(catalog, word);
      if (info) setPicked(info);
    },
    [catalog]
  );
  const reference: FunctionReference = { groups, group, onGroup: setGroup, functions, selected, onSelect: setPicked };
  return { reference, onWord };
}
