import type { DataBar } from './tableFormatting.utils';

export interface CellIcon {
  icon: string;
  /** v1 icon layout: `left`, `right` of the text, or `only_icon`. */
  layout: string;
  /** v1 icon alignment: `top`, `center`, `bottom`. */
  align: string;
}

const ALIGN_SELF: Record<string, string> = { top: 'flex-start', center: 'center', bottom: 'flex-end' };

/** A cell's text with its data bar behind it and its icon beside it (v1 `data-bar-panel`, `icon-bar`). */
export function TableCellContent({ text, bar, icon }: { text: string; bar?: DataBar; icon?: CellIcon }) {
  const iconView = icon && (
    <span className="table-cell__icon" style={{ alignSelf: ALIGN_SELF[icon.align] ?? 'center' }}>
      {icon.icon}
    </span>
  );
  return (
    <>
      {bar && (
        <span className="table-cell__bar" aria-hidden>
          <span
            className="table-cell__bar-part"
            style={{ left: `${bar.positive.left}%`, width: `${bar.positive.width}%`, background: bar.positiveColor, ...(bar.axisColor && !bar.rightToLeft && { borderLeft: `1px solid ${bar.axisColor}` }) }}
          />
          <span
            className="table-cell__bar-part"
            style={{ left: `${bar.negative.left}%`, width: `${bar.negative.width}%`, background: bar.negativeColor, ...(bar.axisColor && bar.rightToLeft && { borderLeft: `1px solid ${bar.axisColor}` }) }}
          />
        </span>
      )}
      {icon ? (
        <span className={`table-cell__icon-bar ${icon.layout === 'right' ? 'flex-row-reverse' : ''}`}>
          {iconView}
          {icon.layout !== 'only_icon' && <span className="truncate">{text}</span>}
        </span>
      ) : (
        <span className="table-cell__text">{text}</span>
      )}
    </>
  );
}
