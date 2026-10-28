import { Tooltip } from 'antd';
import type { KpiModel } from './kpi.utils';

/** The value with its prefix and postfix; the full number on hover. */
export function KpiValue({ kpi }: { kpi: KpiModel }) {
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
