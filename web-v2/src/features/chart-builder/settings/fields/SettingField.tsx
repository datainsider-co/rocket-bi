import type { ReactNode } from 'react';

interface SettingFieldProps {
  label: string;
  className?: string;
  children: ReactNode;
}

/** A setting's label above its control (v1 settings' `label`). */
export function SettingField({ label, className = '', children }: SettingFieldProps) {
  return (
    <label className={`flex min-w-0 flex-col gap-1 ${className}`}>
      <span className="text-xs text-black/65">{label}</span>
      {children}
    </label>
  );
}
