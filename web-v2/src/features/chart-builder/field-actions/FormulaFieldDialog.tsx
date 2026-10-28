import { useMemo } from 'react';
import type { TableSchema } from '@/core/schema/SchemaService';
import { formulaLanguage } from './completions.utils';
import { formulaDialogTextsOf } from './fieldActions.utils';
import { functionsOf, ALL_FUNCTIONS } from './functionCatalog.utils';
import { FormulaFieldDialogView } from './FormulaFieldDialogView';
import { useFormulaFieldForm, type FormulaFieldTarget } from './useFormulaFieldForm';
import { useFunctionCatalog } from './useFunctionCatalog';
import { useFunctionReference } from './useFunctionReference';

interface FormulaFieldDialogProps {
  target: FormulaFieldTarget;
  /** The table as the server returned it after saving. */
  onSaved: (table: TableSchema) => void;
  onCancel: () => void;
}

/** Creates or edits a measure or calculated column of a table. Mount it per opening so the form starts over. */
export function FormulaFieldDialog({ target, onSaved, onCancel }: FormulaFieldDialogProps) {
  const { kind, table, editing } = target;
  const catalog = useFunctionCatalog(kind);
  const { reference, onWord } = useFunctionReference(catalog);
  const language = useMemo(() => catalog && formulaLanguage(kind, table, functionsOf(catalog, ALL_FUNCTIONS)), [catalog, kind, table]);
  const form = useFormulaFieldForm(target, onSaved);
  return (
    <FormulaFieldDialogView
      texts={formulaDialogTextsOf(kind, editing !== undefined)}
      form={form}
      language={language}
      reference={reference}
      onWord={onWord}
      onCancel={onCancel}
    />
  );
}
