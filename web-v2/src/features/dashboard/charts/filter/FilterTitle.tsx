import type { CSSProperties } from 'react';

interface FilterTitleProps {
  text?: string;
  style?: CSSProperties;
  className?: string;
  /** The filter's subtitle: a help icon after the title that shows it on hover (v1 `renderSubtitle`). */
  help?: string;
}

/** A filter's title on one line (v1 `.filter-chart`); nothing without text. */
export function FilterTitle({ text, style, className = '', help }: FilterTitleProps) {
  if (!text) return null;
  const title = (
    <div className={`filter-title ${help ? '' : className}`} style={style} title={text}>
      {text}
    </div>
  );
  if (!help) return title;
  return (
    <div className={`filter-title-row ${className}`}>
      {title}
      <img className="filter-title-row__help" src="/icons/ic_help.svg" alt="subtitle" title={help} />
    </div>
  );
}
