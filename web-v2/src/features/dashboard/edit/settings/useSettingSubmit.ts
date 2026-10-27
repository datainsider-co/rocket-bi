import { useState } from 'react';
import type { JsonObject } from '@/core/json/json';
import { errorMessage } from './dashboardSettings.utils';

/** Saves a settings dialog's draft, with its loading state and the error to show in the dialog (v1 `modal.setError`). */
export function useSettingSubmit(onSubmit: (setting: JsonObject) => Promise<void>) {
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string>();
  const submit = async (draft: JsonObject) => {
    setSaving(true);
    setError(undefined);
    try {
      await onSubmit(draft);
    } catch (cause) {
      setError(errorMessage(cause));
    } finally {
      setSaving(false);
    }
  };
  return { saving, error, submit };
}
