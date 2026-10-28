import { Alert, Form, Input, Modal, Skeleton } from 'antd';
import type { Control } from 'react-hook-form';
import { FormField } from '@/shared/form/FormField';
import type { EditorLanguage } from './completions.utils';
import { LazyCodeEditor } from './editor/LazyCodeEditor';
import type { FormulaFieldValues } from './fieldActions.utils';
import { FunctionReferenceView } from './FunctionReferenceView';
import type { FunctionReference } from './useFunctionReference';

export interface FormulaForm {
  control: Control<FormulaFieldValues>;
  saving: boolean;
  /** The server's message when saving failed. */
  error?: string;
  onSubmit: () => void;
}

/** The dialog's words, by kind and mode. */
export interface FormulaDialogTexts {
  title: string;
  /** Create or Update. */
  okText: string;
  /** A formula example while the editor is empty. */
  placeholder: string;
}

interface FormulaFieldDialogViewProps {
  texts: FormulaDialogTexts;
  form: FormulaForm;
  /** The editor's suggestions; none while the data source's functions load. */
  language?: EditorLanguage;
  reference: FunctionReference;
  onWord: (word: string) => void;
  onCancel: () => void;
}

const EDITOR_HEIGHT = 340;

/**
 * The dialog of a measure's or calculated column's formula (v1 `CalculatedFieldModal`): the name and the formula on
 * the left, the data source's functions on the right.
 */
export function FormulaFieldDialogView({ texts, form, language, reference, onWord, onCancel }: FormulaFieldDialogViewProps) {
  const { title, okText, placeholder } = texts;
  const { control, saving, error, onSubmit } = form;
  return (
    <Modal open title={title} width={1100} okText={okText} onOk={onSubmit} confirmLoading={saving} onCancel={onCancel} mask={{ closable: false }} destroyOnHidden>
      <div className="grid grid-cols-2 gap-6">
        <div className="min-w-0">
          <Form layout="vertical" component={false}>
            <FormField control={control} name="displayName" label="Column name" required render={field => <Input {...field} placeholder="Column name" autoComplete="off" />} />
            <FormField
              control={control}
              name="formula"
              label="Formula"
              required
              render={field =>
                language ? (
                  <LazyCodeEditor
                    value={field.value}
                    onChange={field.onChange}
                    languageId="di-formula"
                    language={language}
                    onWord={onWord}
                    placeholder={placeholder}
                    ariaLabel="Formula"
                    height={EDITOR_HEIGHT}
                  />
                ) : (
                  <Skeleton.Node active style={{ width: '100%', height: EDITOR_HEIGHT }} />
                )
              }
            />
            {error && <Alert type="error" showIcon title={error} />}
          </Form>
        </div>
        <div className="flex h-[480px] min-h-0 flex-col">
          <FunctionReferenceView {...reference} />
        </div>
      </div>
    </Modal>
  );
}
