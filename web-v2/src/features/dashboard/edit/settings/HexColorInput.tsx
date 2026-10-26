import { ColorPicker } from 'antd';

interface HexColorInputProps {
  label: string;
  value: string;
  onChange: (hex: string) => void;
}

/** A color the dashboard stores as hex. */
export function HexColorInput({ label, value, onChange }: HexColorInputProps) {
  return <ColorPicker aria-label={label} value={value} showText onChangeComplete={color => onChange(color.toHexString())} />;
}
