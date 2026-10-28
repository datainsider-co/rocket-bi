import type { TabProps } from '../tabs/tabProps';
import { KPI_THEMES, kpiThemeChanges } from './numberTabs.utils';

/** v1 number `ThemeTab`: a theme restyles the whole card, keeping its texts and icon. */
export function KpiThemeTab({ viz, onChange }: TabProps) {
  return (
    <div className="grid grid-cols-3 gap-2">
      {KPI_THEMES.map(theme => (
        <button
          key={theme.id}
          type="button"
          aria-label={`Theme ${theme.id}`}
          aria-pressed={viz['theme'] === theme.id}
          onClick={() => onChange(kpiThemeChanges(theme.id, viz))}
          className={`cursor-pointer overflow-hidden rounded-lg border border-solid bg-transparent p-0 transition-transform hover:scale-105 ${viz['theme'] === theme.id ? 'border-[var(--color-brand)]' : 'border-black/10'}`}
        >
          <img src={theme.image} alt="" className="block w-full" />
        </button>
      ))}
    </div>
  );
}
