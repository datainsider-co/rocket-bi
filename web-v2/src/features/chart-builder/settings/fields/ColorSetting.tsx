import { ColorPicker } from 'antd';
import { SettingField } from './SettingField';

interface ColorSettingProps {
  label: string;
  /** A hex color, or a theme variable (`var(--text-color)`) that follows the dashboard's theme. */
  value: string;
  disabled?: boolean;
  className?: string;
  onChange: (value: string) => void;
}

/** A color (v1 `ColorSetting`). A theme variable shows as Theme with its current color, which a picker can't hold. */
export function ColorSetting({ label, value, disabled, className, onChange }: ColorSettingProps) {
  const isTheme = value.startsWith('var(');
  return (
    <SettingField label={label} className={className}>
      <ColorPicker value={isTheme ? undefined : value} disabled={disabled} onChangeComplete={color => onChange(color.toHexString())}>
        <button
          type="button"
          disabled={disabled}
          className="flex h-8 w-full cursor-pointer items-center gap-2 rounded-md border border-solid border-black/15 bg-white px-2 text-left text-sm disabled:cursor-not-allowed disabled:opacity-50"
        >
          <span className="size-4 shrink-0 rounded-sm border border-solid border-black/15" style={{ background: value }} />
          <span className="truncate">{isTheme ? 'Theme' : value}</span>
        </button>
      </ColorPicker>
    </SettingField>
  );
}
