import { useMemo, useRef, useState } from 'react';
import { Form, Input, Modal, type InputRef } from 'antd';
import type { TableSchema } from '@/core/schema/SchemaService';
import { formulaLanguage } from '@/features/chart-builder/field-actions/completions.utils';
import { LazyCodeEditor } from '@/shared/code-editor/LazyCodeEditor';
import { checkExpression } from '../manageFields.utils';
import { useSqlFunctions } from '../useSqlFunctions';

interface ExpressionFieldModalProps {
  /** Add or Save. */
  okText: string;
  /** The table Manage Fields reads: the formula names its columns. */
  table: TableSchema;
  initial: { displayName: string; formula: string };
  otherNames: readonly string[];
  onSubmit: (displayName: string, expression: string) => void;
  onCancel: () => void;
}

/** v1 `ManageExpressionField`: a field's name and its formula, columns written `[Display Name]`. */
export function ExpressionFieldModal({ okText, table, initial, otherNames, onSubmit, onCancel }: ExpressionFieldModalProps) {
  const [displayName, setDisplayName] = useState(initial.displayName);
  const [formula, setFormula] = useState(initial.formula);
  const [errors, setErrors] = useState<{ name?: string | undefined; formula?: string | undefined }>({});
  const input = useRef<InputRef>(null);
  const functions = useSqlFunctions('calculated');
  const language = useMemo(() => formulaLanguage('calculated', table, functions), [table, functions]);
  const submit = () => {
    const checked = checkExpression(displayName, formula, otherNames, table.columns);
    if (checked.ok) onSubmit(displayName, checked.expression);
    else setErrors({ name: checked.nameError, formula: checked.formulaError });
  };

  return (
    <Modal open centered title={okText === 'Add' ? 'Add Field' : 'Edit Field'} okText={okText} width={640} onOk={submit} onCancel={onCancel} mask={{ closable: false }} keyboard={false} destroyOnHidden afterOpenChange={visible => visible && input.current?.focus()}>
      <Form layout="vertical" component={false}>
        <Form.Item label="Field name" validateStatus={errors.name ? 'error' : undefined} help={errors.name}>
          <Input ref={input} value={displayName} placeholder="Field name" onChange={event => setDisplayName(event.target.value)} />
        </Form.Item>
        <Form.Item label="Field expression" validateStatus={errors.formula ? 'error' : undefined} help={errors.formula}>
          <LazyCodeEditor
            value={formula}
            onChange={setFormula}
            languageId="etl-expression"
            language={language}
            placeholder="[Units Sold] * 2"
            ariaLabel="Field expression"
            height={200}
          />
        </Form.Item>
      </Form>
    </Modal>
  );
}
