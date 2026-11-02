/** v1's run status icons (`assets/icon/data_ingestion/status`), shared by Data Ingestion and Data Cook. */
export type StatusIcon = 'synced' | 'error' | 'queued' | 'syncing' | 'initialized' | 'terminated' | 'unknown';

const ICON_DIR = '/ingestion/status';

export function statusIconUrl(icon: StatusIcon): string {
  return `${ICON_DIR}/${icon}.svg`;
}
