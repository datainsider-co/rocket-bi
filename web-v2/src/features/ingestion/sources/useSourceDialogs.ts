import { useCallback, useState } from 'react';
import { App } from 'antd';
import { useNavigate } from 'react-router';
import type { DataSource } from '@/core/ingestion/DataSource';
import type { AvailableSourceEntry } from '../catalog/sourceCatalog';
import { getIngestionSection, IngestionSection } from '../ingestion.utils';
import { jobSavedMessage, type JobSavePlan } from '../job-form/jobForm.utils';
import { dialogAfterSourceSaved, isEditableSource, NO_DIALOG, type SourcesDialog } from './sources.utils';

/**
 * The modals of the Data Sources page: Add Data Source opens the catalog, a picked type its form (CSV its import
 * wizard), and a new source its first job (locked to it). Edit opens the form on the source; a row opens a new job on it. A saved job goes to
 * the Jobs page, as v1 did.
 */
export function useSourceDialogs() {
  const [dialog, setDialog] = useState<SourcesDialog>(NO_DIALOG);
  const { message } = App.useApp();
  const navigate = useNavigate();

  const close = useCallback(() => setDialog(NO_DIALOG), []);
  const openCatalog = useCallback(() => setDialog({ kind: 'catalog' }), []);
  const selectType = useCallback((entry: AvailableSourceEntry) => {
    setDialog(
      entry.form.kind === 'jdbc'
        ? { kind: 'source', target: { mode: 'create', databaseType: entry.form.databaseType } }
        : { kind: 'csv' }
    );
  }, []);
  const edit = useCallback((source: DataSource) => {
    if (isEditableSource(source)) setDialog({ kind: 'source', target: { mode: 'edit', source } });
  }, []);
  const createJob = useCallback((source: DataSource) => {
    if (isEditableSource(source)) setDialog({ kind: 'job', target: { mode: 'create', source, lockSource: true } });
  }, []);
  const sourceSaved = useCallback(
    (source: DataSource, created: boolean) => {
      void message.success(created ? 'Data source created' : 'Data source updated');
      setDialog(dialogAfterSourceSaved(source, created));
    },
    [message]
  );
  const jobSaved = useCallback(
    (plan: JobSavePlan) => {
      void message.success(jobSavedMessage(plan));
      setDialog(NO_DIALOG);
      void navigate(getIngestionSection(IngestionSection.Jobs).path);
    },
    [message, navigate]
  );

  return { dialog, close, openCatalog, selectType, edit, createJob, sourceSaved, jobSaved };
}
