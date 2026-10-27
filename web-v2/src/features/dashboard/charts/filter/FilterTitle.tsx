import type { CSSProperties } from 'react';

interface FilterTitleProps {
  text?: string;
  style?: CSSProperties;
  className?: string;
}

/** A filter's title on one line (v1 `.filter-chart`); nothing without text. */
export function FilterTitle({ text, style, className = '' }: FilterTitleProps) {
  if (!text) return null;
  return (
    <div className={`filter-title ${className}`} style={style} title={text}>
      {text}
    </div>
  );
}
