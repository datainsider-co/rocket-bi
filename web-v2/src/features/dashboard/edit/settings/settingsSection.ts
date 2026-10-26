import type { JsonObject } from '@/core/json/json';

/** One tab of the settings dialog: it shows part of the draft and hands back the changed draft. */
export interface SettingsSectionProps {
  draft: JsonObject;
  onChange: (draft: JsonObject) => void;
}
