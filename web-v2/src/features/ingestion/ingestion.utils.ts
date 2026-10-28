/** Pages of Data Ingestion, keyed by their path segment under `/data-ingestion` (v1 `Router.ts`). */
export const IngestionSection = {
  DataSources: 'data-source',
  Jobs: 'job',
  QueuedJobs: 'queued-job',
  JobHistory: 'job-history'
} as const;

export type IngestionSection = (typeof IngestionSection)[keyof typeof IngestionSection];

export const INGESTION_PATH = '/data-ingestion';

export interface IngestionSectionConfig {
  readonly key: IngestionSection;
  /** Page title and sidebar label. */
  readonly title: string;
  /** v1 icon font class. */
  readonly icon: string;
  readonly path: string;
}

/** The sidebar of v1 `DataIngestion.vue`, without Streaming (not migrated). */
export const INGESTION_SECTIONS: readonly IngestionSectionConfig[] = [
  { key: IngestionSection.DataSources, title: 'Data Sources', icon: 'di-icon-datasource', path: `${INGESTION_PATH}/data-source` },
  { key: IngestionSection.Jobs, title: 'Jobs', icon: 'di-icon-job', path: `${INGESTION_PATH}/job` },
  { key: IngestionSection.QueuedJobs, title: 'Queued Jobs', icon: 'di-icon-job', path: `${INGESTION_PATH}/queued-job` },
  {
    key: IngestionSection.JobHistory,
    title: 'Jobs History',
    icon: 'di-icon-job-history',
    path: `${INGESTION_PATH}/job-history`
  }
];

export function getIngestionSection(key: IngestionSection): IngestionSectionConfig {
  const section = INGESTION_SECTIONS.find(item => item.key === key);
  if (!section) throw new Error(`Unknown ingestion section: ${key}`);
  return section;
}

/** The section `pathname` is in (`/data-ingestion/<section>/...`). Defaults to Data Sources, where `/data-ingestion` goes. */
export function ingestionSectionFromPath(pathname: string): IngestionSection {
  const [, root, segment] = pathname.split('/');
  if (`/${root ?? ''}` !== INGESTION_PATH) return IngestionSection.DataSources;
  return INGESTION_SECTIONS.find(section => section.key === segment)?.key ?? IngestionSection.DataSources;
}
