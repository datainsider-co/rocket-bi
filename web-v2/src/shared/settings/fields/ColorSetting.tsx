import { ColorPicker, Input } from 'antd';
import { colorText, isHexColor } from './colorSetting.utils';
import { SettingField } from './SettingField';

interface ColorSettingProps {
  label: string;
  /** A hex color, or a theme variable (`var(--text-color)`) that follows the dashboard's theme. */
  value: string;
  disabled?: boolean;
  className?: string;
  onChange: (value: string) => void;
}

/**
 * A color (v1 `ColorSetting`): its hex, typed and applied on Enter or when the box loses focus, and a swatch that opens
 * the picker. A theme variable shows as Theme with its current color, which neither a hex nor a picker can hold.
 */
export function ColorSetting({ label, value, disabled, className = 'settings-color', onChange }: ColorSettingProps) {
  const isTheme = value.startsWith('var(');
  const commit = (text: string) => {
    const hex = text.trim();
    if (isHexColor(hex) && hex !== value) onChange(hex);
  };
  return (
    <SettingField label={label} className={className}>
      <div className={`color-setting${disabled ? ' color-setting--disabled' : ''}`}>
        {/* Keyed by the value, so a pick, a revert or a rejected text shows the color in use. */}
        <Input
          key={value}
          variant="borderless"
          defaultValue={colorText(value)}
          disabled={disabled}
          onBlur={event => {
            commit(event.target.value);
            if (!isHexColor(event.target.value)) event.target.value = colorText(value);
          }}
          onPressEnter={event => commit(event.currentTarget.value)}
        />
        <ColorPicker value={isTheme ? undefined : value} disabled={disabled} onChangeComplete={color => onChange(color.toHexString())}>
          <button type="button" className="color-setting__swatch" disabled={disabled} aria-label={`Pick ${label.toLowerCase()}`}>
            <span style={{ background: value }} />
          </button>
        </ColorPicker>
      </div>
    </SettingField>
  );
}
