/**
 * Features that are built but not on everywhere, read from `VITE_ENABLE_*` at build time. v1 had the opposite
 * (`VUE_APP_IS_DISABLE_*` in `public/config/*.js`) and turned Data Ingestion, Lake House, Streaming and CDP off in every
 * environment; of those, v2 only has Data Ingestion.
 */
export interface FeatureFlags {
  /** `/data-ingestion/*` and its header link. */
  readonly ingestion: boolean;
}

/** `true` only for the string `true` (any case): Vite env values are strings, and an unset flag means off. */
function isOn(value: unknown): boolean {
  return typeof value === 'string' && value.trim().toLowerCase() === 'true';
}

export function readFeatureFlags(env: Readonly<Record<string, unknown>>): FeatureFlags {
  return { ingestion: isOn(env['VITE_ENABLE_INGESTION']) };
}

export const featureFlags: FeatureFlags = readFeatureFlags(import.meta.env);
