import { useCallback, useReducer, useState } from 'react';
import { App } from 'antd';
import type { CsvTableRef } from '@/core/ingestion/CsvImportService';
import { toErrorMessage } from '../ingestion.utils';
import { columnErrors, nullCounts, renameColumn, setColumnType } from './csvColumns.utils';
import { readSample } from './csvFile';
import { guessDelimiter } from './csvText.utils';
import { isUploadRunning } from './csvUpload.utils';
import { csvWizardReducer, fileError, INITIAL_CSV_WIZARD, type CsvReadSetting } from './csvWizard.utils';
import { useCsvDestination } from './useCsvDestination';
import { useCsvPreview } from './useCsvPreview';
import { useCsvUpload } from './useCsvUpload';

/** Picking a file: it is checked, and its first row read to guess the delimiter. */
function useCsvFilePicker(encoding: string, onPicked: (file: File, delimiter: string) => void) {
  const [state, setState] = useState<{ isReading: boolean; error: string | undefined }>({ isReading: false, error: undefined });

  const select = useCallback(
    async (files: readonly File[]) => {
      const error = fileError(files);
      const file = files[0];
      if (error || !file) {
        setState({ isReading: false, error });
        return;
      }
      setState({ isReading: true, error: undefined });
      try {
        const delimiter = guessDelimiter(await readSample(file, encoding, false));
        setState({ isReading: false, error: undefined });
        onPicked(file, delimiter);
      } catch (readError) {
        setState({ isReading: false, error: toErrorMessage(readError) });
      }
    },
    [encoding, onPicked]
  );

  return { ...state, select };
}

/** The CSV import wizard: file → preview (how to read it, columns) → destination → upload. */
export function useCsvImport(onClose: () => void) {
  const [state, dispatch] = useReducer(csvWizardReducer, INITIAL_CSV_WIZARD);
  const { modal } = App.useApp();
  const picker = useCsvFilePicker(
    state.setting.encoding,
    useCallback((file: File, delimiter: string) => dispatch({ type: 'fileSelected', file, delimiter }), [])
  );
  const preview = useCsvPreview(state.file, state.setting, state.columns);
  const upload = useCsvUpload();
  const destination = useCsvDestination(preview.columns, (target: CsvTableRef) => {
    if (!state.file) return;
    dispatch({ type: 'uploadStarted', target });
    upload.start(state.file, state.setting, target);
  });

  const errors = columnErrors(preview.columns);
  const running = state.step === 'upload' && isUploadRunning(upload.state.phase);

  const close = () => {
    if (!running) {
      onClose();
      return;
    }
    void modal.confirm({
      title: 'Stop importing?',
      content: 'The rows imported so far stay in the table.',
      okText: 'Stop',
      okButtonProps: { danger: true },
      cancelText: 'Keep importing',
      onOk: () => {
        upload.stop();
        onClose();
      }
    });
  };

  return {
    step: state.step,
    close,
    file: { isReading: picker.isReading, error: picker.error, onSelect: picker.select },
    preview: {
      setting: state.setting,
      onSettingChange: (setting: Partial<CsvReadSetting>) => dispatch({ type: 'settingChanged', setting }),
      preview,
      columnEdit: {
        errors,
        nullCounts: nullCounts(preview.records, preview.columns.length),
        onRename: (index: number, name: string) =>
          dispatch({ type: 'columnsEdited', columns: renameColumn(preview.columns, index, name) }),
        onTypeChange: (index: number, type: string) =>
          dispatch({ type: 'columnsEdited', columns: setColumnType(preview.columns, index, type) })
      },
      canContinue:
        !preview.isLoading && !preview.errorMessage && preview.columns.length > 0 && errors.every(error => !error),
      onBack: () => dispatch({ type: 'back' }),
      onNext: () => dispatch({ type: 'previewAccepted' })
    },
    destination: { form: destination, onBack: () => dispatch({ type: 'back' }) },
    upload: {
      fileName: state.file?.name ?? '',
      table: state.target ? `${state.target.dbName}.${state.target.name}` : '',
      upload,
      onClose: close
    }
  };
}

export type CsvImportModel = ReturnType<typeof useCsvImport>;
