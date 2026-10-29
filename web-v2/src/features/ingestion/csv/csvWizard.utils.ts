import type { CsvColumn, CsvSetting } from '@/core/ingestion/CsvImport';
import type { CsvTableRef } from '@/core/ingestion/CsvImportService';
import { DEFAULT_ENCODING } from './csvFile';

/** v1 `UPLOAD_STAGE`: browse file → preview → describe database → uploading. */
export const CSV_IMPORT_STEPS = ['file', 'preview', 'destination', 'upload'] as const;

export type CsvImportStep = (typeof CSV_IMPORT_STEPS)[number];

/** How the file is read: the encoding is decoded in the browser, the rest goes to the server as `csv_setting`. */
export interface CsvReadSetting extends CsvSetting {
  readonly encoding: string;
}

export interface CsvWizardState {
  readonly step: CsvImportStep;
  readonly file: File | undefined;
  readonly setting: CsvReadSetting;
  /** The columns once edited. Until then the preview shows what the server guessed. */
  readonly columns: readonly CsvColumn[] | undefined;
  /** The table being imported into, from the upload step on. */
  readonly target: CsvTableRef | undefined;
}

export type CsvWizardAction =
  | { readonly type: 'fileSelected'; readonly file: File; readonly delimiter: string }
  | { readonly type: 'settingChanged'; readonly setting: Partial<CsvReadSetting> }
  | { readonly type: 'columnsEdited'; readonly columns: readonly CsvColumn[] }
  | { readonly type: 'back' }
  | { readonly type: 'previewAccepted' }
  | { readonly type: 'uploadStarted'; readonly target: CsvTableRef };

export const INITIAL_CSV_WIZARD: CsvWizardState = {
  step: 'file',
  file: undefined,
  setting: { encoding: DEFAULT_ENCODING, includeHeader: true, delimiter: ',' },
  columns: undefined,
  target: undefined
};

const PREVIOUS_STEP: Partial<Record<CsvImportStep, CsvImportStep>> = { preview: 'file', destination: 'preview' };

/**
 * A new file or another way to read it starts the columns over from the server's guess; v1 did the same. The upload
 * step has no way back: the rows are being written.
 */
export function csvWizardReducer(state: CsvWizardState, action: CsvWizardAction): CsvWizardState {
  switch (action.type) {
    case 'fileSelected':
      return {
        ...state,
        step: 'preview',
        file: action.file,
        setting: { ...state.setting, includeHeader: true, delimiter: action.delimiter },
        columns: undefined
      };
    case 'settingChanged':
      return { ...state, setting: { ...state.setting, ...action.setting }, columns: undefined };
    case 'columnsEdited':
      return { ...state, columns: action.columns };
    case 'back':
      return { ...state, step: PREVIOUS_STEP[state.step] ?? state.step };
    case 'previewAccepted':
      return state.step === 'preview' ? { ...state, step: 'destination' } : state;
    case 'uploadStarted':
      return { ...state, step: 'upload', target: action.target };
  }
}

/** v1 refused a second file and an empty one (`BrowseFile` watcher). */
export function fileError(files: readonly File[]): string | undefined {
  if (files.length > 1) return 'Pick one file at a time.';
  const file = files[0];
  if (!file) return 'Pick a file.';
  return file.size === 0 ? 'This file is empty. Pick another one.' : undefined;
}
