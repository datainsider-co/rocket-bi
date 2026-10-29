import { Form, Radio, Select } from 'antd';
import { CSV_ENCODINGS } from './csvFile';
import { CSV_DELIMITERS } from './csvText.utils';
import type { CsvReadSetting } from './csvWizard.utils';

interface CsvSettingsPanelProps {
  setting: CsvReadSetting;
  disabled: boolean;
  onChange: (setting: Partial<CsvReadSetting>) => void;
}

/**
 * How to read the file (v1 `PreviewFile` sidebar). v1's "batch upload metadata" is left out: only its old upload flow
 * read `add_batch_info`.
 */
export function CsvSettingsPanel({ setting, disabled, onChange }: CsvSettingsPanelProps) {
  return (
    <Form layout="vertical" component="div" disabled={disabled}>
      <Form.Item label="Column headers">
        <Radio.Group
          vertical
          value={setting.includeHeader}
          onChange={event => onChange({ includeHeader: event.target.value as boolean })}
          options={[
            { value: true, label: 'Use first row as headers' },
            { value: false, label: 'Generate headers' }
          ]}
        />
      </Form.Item>
      <Form.Item label="Delimiter" htmlFor="csv-delimiter">
        <Select
          id="csv-delimiter"
          value={setting.delimiter}
          options={CSV_DELIMITERS.map(({ value, label }) => ({ value, label }))}
          onChange={delimiter => onChange({ delimiter })}
        />
      </Form.Item>
      <Form.Item label="File encoding" htmlFor="csv-encoding">
        <Select
          id="csv-encoding"
          value={setting.encoding}
          options={CSV_ENCODINGS.map(({ value, label }) => ({ value, label }))}
          onChange={encoding => onChange({ encoding })}
        />
      </Form.Item>
    </Form>
  );
}
