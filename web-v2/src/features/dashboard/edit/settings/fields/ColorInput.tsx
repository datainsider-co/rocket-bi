import { ColorPicker } from 'antd';

interface ColorInputProps {
  label: string;
  /** A hex color, as the dashboard stores it. */
  value: string;
  onChange: (hex: string) => void;
}

/** v1 `ColorPickerV2`: a field with a fill icon and the color, which opens a picker. */
export function ColorInput({ label, value, onChange }: ColorInputProps) {
  return (
    <ColorPicker value={value} onChangeComplete={color => onChange(color.toHexString())}>
      <button type="button" className="setting-color-input" aria-label={label} title={value}>
        <i className="di-icon-color" aria-hidden />
        <span className="setting-color-input__swatch" style={{ background: value }} />
      </button>
    </ColorPicker>
  );
}
