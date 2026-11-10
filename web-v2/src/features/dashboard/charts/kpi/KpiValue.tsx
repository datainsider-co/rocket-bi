import { Tooltip } from 'antd';
import type { KpiModel } from './kpi.utils';

/** The value with its prefix and postfix; the full number on hover (v1 `.number-tooltip`: no arrow, 4px 8px around it). */
export function KpiValue({ kpi }: { kpi: KpiModel }) {
  return (
    <Tooltip
      title={`${kpi.prefix}${kpi.exactValue}${kpi.postfix}`}
      arrow={false}
      placement={kpi.tooltip.placement}
      styles={{ container: { minHeight: 0, padding: '4px 8px', ...kpi.tooltip.style } }}
    >
      <div className="kpi__value" style={kpi.valueStyle}>
        <span style={kpi.prefixStyle}>{kpi.prefix}</span>
        <span>{kpi.value}</span>
        <span style={kpi.postfixStyle}>{kpi.postfix}</span>
      </div>
    </Tooltip>
  );
}
