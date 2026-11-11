import type { ReactNode } from 'react';
import '../Settings.css';

interface SettingFieldProps {
  label: string;
  className?: string;
  children: ReactNode;
}

/** A setting's label above its control (v1 settings' `label`). */
export function SettingField({ label, className = '', children }: SettingFieldProps) {
  return (
    <label className={`setting-field ${className}`}>
      <span className="setting-label">{label}</span>
      {children}
    </label>
  );
}
