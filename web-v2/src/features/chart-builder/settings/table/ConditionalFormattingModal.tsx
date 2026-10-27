import { useState } from 'react';
import { Modal } from 'antd';
import { asArray, asRecord, type JsonObject } from '@/core/json/json';
import { ColorFormatForm } from './ColorFormatForm';
import { DataBarForm } from './DataBarForm';
import { invalidBounds, invalidRules, type FormattingType } from './formattingTabs.utils';
import { IconFormatForm } from './IconFormatForm';

interface ConditionalFormattingModalProps {
  type: FormattingType;
  title: string;
  initial: JsonObject;
  onSave: (config: JsonObject) => void;
  onCancel: () => void;
}

function isValid(type: FormattingType, config: JsonObject): boolean {
  if (type === 'dataBar') return invalidBounds(config, ['min', 'max']).length === 0;
  if (type === 'icon') return invalidRules(asArray(asRecord(config['rules'])['iconRules'])).length === 0;
  if (config['formatType'] === 'rules') return invalidRules(asArray(asRecord(config['rules'])['colorRules'])).length === 0;
  return invalidBounds(asRecord(config['scale']), ['min', 'center', 'max']).length === 0;
}

/** v1 `ConditionalFormattingModal`: a formatting's draft, saved whole on OK when its numbers are valid. */
export function ConditionalFormattingModal({ type, title, initial, onSave, onCancel }: ConditionalFormattingModalProps) {
  const [draft, setDraft] = useState(initial);
  const valid = isValid(type, draft);
  return (
    <Modal open title={title} width={type === 'dataBar' ? 420 : 720} okText="Save" okButtonProps={{ disabled: !valid }} maskClosable={false} onOk={() => onSave(draft)} onCancel={onCancel}>
      {type === 'dataBar' && <DataBarForm config={draft} onChange={setDraft} />}
      {type === 'icon' && <IconFormatForm config={draft} onChange={setDraft} />}
      {(type === 'backgroundColor' || type === 'color') && <ColorFormatForm config={draft} onChange={setDraft} />}
    </Modal>
  );
}
