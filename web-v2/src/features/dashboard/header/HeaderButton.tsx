import type { ButtonHTMLAttributes, Ref } from 'react';

interface HeaderButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  /** A v1 icon font class (`di-icon-*`). */
  icon: string;
  title: string;
  loading?: boolean;
  ref?: Ref<HTMLButtonElement>;
}

/**
 * v1 `DiButton` as the dashboard header uses it: a borderless text button with an icon, in the theme's secondary text
 * color. It takes any button attribute, so it can be the trigger of a popover or a dropdown.
 */
export function HeaderButton({ icon, title, loading = false, className = '', disabled, ...rest }: HeaderButtonProps) {
  return (
    // Labelled by the title, which narrow screens hide (v1 showed icons only on mobile).
    <button
      type="button"
      className={`dashboard-header-button ${className}`}
      aria-label={title}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      {...rest}
    >
      <i className={loading ? 'fa fa-spin fa-spinner' : icon} aria-hidden />
      <span className="dashboard-header-button__title">{title}</span>
    </button>
  );
}
