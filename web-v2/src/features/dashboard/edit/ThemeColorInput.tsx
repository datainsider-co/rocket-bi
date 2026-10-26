import { Button, ColorPicker, Space } from 'antd';

interface ThemeColorInputProps {
  label: string;
  /** A hex color, or a theme variable (`var(--accent)`) that follows the dashboard's theme. */
  value: string;
  /** What Theme resets to. */
  themeValue: string;
  onChange: (value: string) => void;
}

/** A color, or the theme's: v1 stored theme variables as colors, which a picker can't show. */
export function ThemeColorInput({ label, value, themeValue, onChange }: ThemeColorInputProps) {
  const isTheme = value.startsWith('var(');
  return (
    <Space.Compact>
      <ColorPicker aria-label={label} value={isTheme ? undefined : value} showText={() => (isTheme ? 'Theme' : value)} onChangeComplete={color => onChange(color.toHexString())} />
      <Button disabled={value === themeValue} onClick={() => onChange(themeValue)}>
        Theme
      </Button>
    </Space.Compact>
  );
}
