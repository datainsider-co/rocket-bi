import type { ReactNode } from 'react';
import { Link } from 'react-router';
import { CaretDownIcon } from './icons/CaretDownIcon';

interface HeaderNavButtonProps {
  icon: ReactNode;
  label: string;
  active: boolean;
  /** A link when set; otherwise a button that opens a dropdown, with a caret. */
  to?: string;
  open?: boolean;
}

const BASE =
  'flex cursor-pointer items-center gap-1.5 rounded-lg border-0 px-3 py-2 text-sm tracking-[0.2px] whitespace-nowrap no-underline transition-colors max-sm:px-2 max-sm:py-1';
const IDLE = 'bg-transparent text-white hover:bg-white hover:text-header';
const HIGHLIGHT = 'bg-white text-header hover:text-header';

/** One header entry (v1 `.header-bar-item.navigator`). Labels hide below `lg`, as in v1. */
export function HeaderNavButton({ icon, label, active, to, open = false }: HeaderNavButtonProps) {
  const className = `${BASE} ${active || open ? HIGHLIGHT : IDLE}`;
  const content = (
    <>
      {icon}
      <span className="max-lg:hidden">{label}</span>
    </>
  );

  if (to !== undefined) {
    return (
      <Link to={to} title={label} aria-label={label} aria-current={active ? 'page' : undefined} className={className}>
        {content}
      </Link>
    );
  }
  return (
    <button type="button" title={label} aria-label={label} className={`${className} font-[inherit]`}>
      {content}
      <CaretDownIcon open={open} />
    </button>
  );
}
