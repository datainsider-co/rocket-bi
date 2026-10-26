import { Tooltip } from 'antd';
import type { KpiModel } from './kpi.utils';

/** v1 `NormalLayout` of the KPI widget: icon, title, subtitle, then the value with its prefix and postfix. */
export function KpiView({ kpi }: { kpi: KpiModel }) {
  return (
    <div className="flex h-full flex-col gap-4 overflow-hidden px-[11px] py-[18px]">
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
      <Tooltip title={`${kpi.prefix}${kpi.exactValue}${kpi.postfix}`}>
        <div className="flex items-center gap-0.5 whitespace-nowrap" style={kpi.valueStyle}>
          {kpi.prefix && <span style={kpi.prefixStyle}>{kpi.prefix}</span>}
          <span>{kpi.value}</span>
          {kpi.postfix && <span style={kpi.postfixStyle}>{kpi.postfix}</span>}
        </div>
      </Tooltip>
    </div>
  );
}
