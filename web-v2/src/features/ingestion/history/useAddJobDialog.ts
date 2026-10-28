import { useCallback, useState } from 'react';
import { App } from 'antd';
import { useNavigate } from 'react-router';
import { getIngestionSection, IngestionSection } from '../ingestion.utils';
import { jobSavedMessage, type JobSavePlan } from '../job-form/jobForm.utils';

/** v1's "Click here to add Job History": opens the job form; a saved job goes to the Jobs page. */
export function useAddJobDialog() {
  const [isOpen, setOpen] = useState(false);
  const { message } = App.useApp();
  const navigate = useNavigate();

  const open = useCallback(() => setOpen(true), []);
  const close = useCallback(() => setOpen(false), []);
  const onSaved = useCallback(
    (plan: JobSavePlan) => {
      void message.success(jobSavedMessage(plan));
      setOpen(false);
      void navigate(getIngestionSection(IngestionSection.Jobs).path);
    },
    [message, navigate]
  );

  return { isOpen, open, close, onSaved };
}
