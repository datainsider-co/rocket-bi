import { useRef, useState } from 'react';
import { Form, Input, Modal, type InputRef } from 'antd';
import { fieldNameError } from '../manageFields.utils';

interface FieldNameModalProps {
  initialName: string;
  /** The names of the other fields: a name is used once. */
  otherNames: readonly string[];
  onSubmit: (name: string) => void;
  onCancel: () => void;
}

/** v1 `ManageNormalField`: a field's new name. */
export function FieldNameModal({ initialName, otherNames, onSubmit, onCancel }: FieldNameModalProps) {
  const [name, setName] = useState(initialName);
  const [error, setError] = useState<string>();
  const input = useRef<InputRef>(null);
  const submit = () => {
    const invalid = fieldNameError(name, otherNames);
    if (invalid) setError(invalid);
    else onSubmit(name);
  };
  return (
    <Modal open centered title="Edit Field" okText="Save" width={400} onOk={submit} onCancel={onCancel} destroyOnHidden afterOpenChange={visible => visible && input.current?.focus()}>
      <Form layout="vertical" component={false}>
        <Form.Item label="Field name" validateStatus={error ? 'error' : undefined} help={error}>
          <Input
            ref={input}
            value={name}
            placeholder="Field name"
            onChange={event => {
              setName(event.target.value);
              setError(undefined);
            }}
            onPressEnter={submit}
          />
        </Form.Item>
      </Form>
    </Modal>
  );
}
