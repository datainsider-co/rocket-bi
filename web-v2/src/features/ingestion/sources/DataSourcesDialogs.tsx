import type { DataSource } from '@/core/ingestion/DataSource';
import { SourceCatalogModal } from '../catalog/SourceCatalogModal';
import type { AvailableSourceEntry } from '../catalog/sourceCatalog';
import { JobFormModal } from '../job-form/JobFormModal';
import type { JobSavePlan } from '../job-form/jobForm.utils';
import { SourceFormModal } from '../source-form/SourceFormModal';
import type { SourcesDialog } from './sources.utils';

interface DataSourcesDialogsProps {
  dialog: SourcesDialog;
  onSelectType: (entry: AvailableSourceEntry) => void;
  onSourceSaved: (source: DataSource, created: boolean) => void;
  onJobSaved: (plan: JobSavePlan) => void;
  onClose: () => void;
}

/** The one modal of the Data Sources page that is open, if any. Forms mount on open, so each starts fresh. */
export function DataSourcesDialogs({ dialog, onSelectType, onSourceSaved, onJobSaved, onClose }: DataSourcesDialogsProps) {
  return (
    <>
      <SourceCatalogModal open={dialog.kind === 'catalog'} onSelect={onSelectType} onClose={onClose} />
      {dialog.kind === 'source' && <SourceFormModal target={dialog.target} onSaved={onSourceSaved} onClose={onClose} />}
      {dialog.kind === 'job' && <JobFormModal target={dialog.target} onSaved={onJobSaved} onClose={onClose} />}
    </>
  );
}
