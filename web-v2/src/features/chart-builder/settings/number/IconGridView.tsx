import { useState } from 'react';
import { Input } from 'antd';
import { KPI_ICON_GROUPS, searchIcons } from './numberTabs.utils';

interface IconGridViewProps {
  value: string;
  color: string;
  background: string;
  disabled: boolean;
  onChange: (iconClass: string) => void;
}

/** v1 `IconPicker`: the chart setting icons by group, filtered by name. */
export function IconGridView({ value, color, background, disabled, onChange }: IconGridViewProps) {
  const [keyword, setKeyword] = useState('');
  const groups = searchIcons(KPI_ICON_GROUPS, keyword);
  return (
    <div className="flex flex-col gap-2">
      <Input.Search placeholder="Filter..." allowClear disabled={disabled} value={keyword} onChange={event => setKeyword(event.target.value)} />
      <div className="max-h-56 overflow-auto rounded border border-solid border-black/10 p-2">
        {groups.map(({ group, icons }) => (
          <div key={group} className="mb-2">
            <div className="mb-1 text-xs text-black/45">{group}</div>
            <div className="grid grid-cols-8 gap-1">
              {icons.map(icon => (
                <button
                  key={icon}
                  type="button"
                  title={icon}
                  aria-label={icon}
                  aria-pressed={icon === value}
                  disabled={disabled}
                  onClick={() => onChange(icon)}
                  className={`flex h-8 cursor-pointer items-center justify-center rounded border border-solid text-lg disabled:cursor-not-allowed disabled:opacity-50 ${icon === value ? 'border-[var(--color-brand)]' : 'border-transparent'}`}
                  style={{ color, background }}
                >
                  <i className={icon} aria-hidden />
                </button>
              ))}
            </div>
          </div>
        ))}
        {groups.length === 0 && <div className="text-center text-xs text-black/45">No icons match.</div>}
      </div>
    </div>
  );
}
