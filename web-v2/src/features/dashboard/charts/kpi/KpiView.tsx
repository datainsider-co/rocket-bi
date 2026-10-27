import { Tooltip } from 'antd';
import type { KpiModel } from './kpi.utils';
import './Kpi.css';

function KpiValue({ kpi }: { kpi: KpiModel }) {
  return (
    <Tooltip title={`${kpi.prefix}${kpi.exactValue}${kpi.postfix}`}>
      <div className="kpi__value" style={kpi.valueStyle}>
        {kpi.prefix && <span style={kpi.prefixStyle}>{kpi.prefix}</span>}
        <span>{kpi.value}</span>
        {kpi.postfix && <span style={kpi.postfixStyle}>{kpi.postfix}</span>}
      </div>
    </Tooltip>
  );
}

/**
 * The KPI widget (v1 `NumberWidget`): without a theme v1's `NoneThemeLayout`, title and value centered in the card;
 * with one its `NormalLayout`, icon, title, subtitle, then the value, from the top left.
 */
export function KpiView({ kpi }: { kpi: KpiModel }) {
  if (kpi.layout === 'plain') {
    return (
      <div className="kpi kpi--plain">
        {(kpi.title || kpi.subtitle) && (
          <div className="kpi__header">
            {kpi.title && <div className="kpi__title" style={kpi.title.style} title={kpi.title.text}>{kpi.title.text}</div>}
            {kpi.subtitle && <div className="kpi__subtitle" style={kpi.subtitle.style} title={kpi.subtitle.text}>{kpi.subtitle.text}</div>}
          </div>
        )}
        <KpiValue kpi={kpi} />
      </div>
    );
  }
  return (
    <div className="kpi kpi--themed">
      {kpi.icon && (
        <div className="flex size-12 shrink-0 items-center justify-center" style={kpi.icon.style}>
          <i className={`${kpi.icon.className} text-2xl`} />
        </div>
      )}
      {(kpi.title || kpi.subtitle) && (
        <div className="flex flex-col gap-2">
          {kpi.title && <div style={kpi.title.style}>{kpi.title.text}</div>}
          {kpi.subtitle && <div style={kpi.subtitle.style}>{kpi.subtitle.text}</div>}
        </div>
      )}
      <KpiValue kpi={kpi} />
    </div>
  );
}
