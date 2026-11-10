import type { InternalFilter } from '@/core/query/internalFilter';
import { HeaderFilterItemView } from './HeaderFilterItemView';
import './HeaderFilterBar.css';

interface HeaderFilterBarViewProps {
  filters: readonly InternalFilter[];
  onChange: (filter: InternalFilter) => void;
  onRemove: (id: number) => void;
}

/** The dashboard's filters under its header (v1 `FilterBar`); nothing without filters. */
export function HeaderFilterBarView({ filters, onChange, onRemove }: HeaderFilterBarViewProps) {
  if (filters.length === 0) return null;
  return (
    <section className="header-filter-bar" aria-label="Filters">
      <span className="header-filter-bar__title">Filters ({filters.length})</span>
      <div className="header-filter-bar__list">
        {filters.map(filter => (
          <HeaderFilterItemView key={filter.id} filter={filter} onChange={onChange} onRemove={() => onRemove(filter.id)} />
        ))}
      </div>
    </section>
  );
}
