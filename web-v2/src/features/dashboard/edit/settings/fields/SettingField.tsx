import type { ReactNode } from 'react';

interface SettingFieldProps {
  label: string;
  className?: string;
  children: ReactNode;
}

/** A label above its input, the way v1's settings dialogs lay out each field. */
export function SettingField({ label, className = '', children }: SettingFieldProps) {
  return (
    <div className={`setting-field ${className}`}>
      <div className="setting-field__label">{label}</div>
      {children}
    </div>
  );
}
