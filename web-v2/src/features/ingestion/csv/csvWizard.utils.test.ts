import { describe, expect, it } from 'vitest';
import type { CsvColumn } from '@/core/ingestion/CsvImport';
import { csvWizardReducer, fileError, INITIAL_CSV_WIZARD, type CsvWizardAction, type CsvWizardState } from './csvWizard.utils';

const file = new File(['a;b\n1;2'], 'data.csv');
const columns: CsvColumn[] = [{ name: 'a', type: 'string', json: {} }];

function run(state: CsvWizardState, ...actions: CsvWizardAction[]): CsvWizardState {
  return actions.reduce(csvWizardReducer, state);
}

const previewing = run(INITIAL_CSV_WIZARD, { type: 'fileSelected', file, delimiter: ';' });

describe('csvWizardReducer', () => {
  it('previews a picked file with the delimiter found, the first row as header', () => {
    expect(previewing).toEqual({
      ...INITIAL_CSV_WIZARD,
      step: 'preview',
      file,
      setting: { encoding: 'utf-8', includeHeader: true, delimiter: ';' }
    });
  });

  it('starts the columns over for a new file', () => {
    const edited = run(previewing, { type: 'columnsEdited', columns }, { type: 'back' });
    expect(run(edited, { type: 'fileSelected', file, delimiter: ',' }).columns).toBeUndefined();
  });

  it('keeps edited columns', () => {
    expect(run(previewing, { type: 'columnsEdited', columns }).columns).toBe(columns);
  });

  it('starts the columns over when the file is read another way', () => {
    const state = run(previewing, { type: 'columnsEdited', columns }, { type: 'settingChanged', setting: { includeHeader: false } });
    expect(state.columns).toBeUndefined();
    expect(state.setting).toEqual({ encoding: 'utf-8', includeHeader: false, delimiter: ';' });
  });

  it('goes from the preview to the destination', () => {
    expect(run(previewing, { type: 'previewAccepted' }).step).toBe('destination');
  });

  it('accepts the preview only on the preview step', () => {
    expect(run(INITIAL_CSV_WIZARD, { type: 'previewAccepted' }).step).toBe('file');
  });

  it.each([
    ['preview', 'file'],
    ['destination', 'preview'],
    ['file', 'file'],
    ['upload', 'upload']
  ] as const)('goes back from %s to %s', (step, previous) => {
    expect(run({ ...previewing, step }, { type: 'back' }).step).toBe(previous);
  });

  it('uploads into the table picked', () => {
    const target = { dbName: 'db', name: 't' };
    expect(run(previewing, { type: 'previewAccepted' }, { type: 'uploadStarted', target })).toMatchObject({ step: 'upload', target });
  });
});

describe('fileError', () => {
  it('accepts one file with content', () => {
    expect(fileError([file])).toBeUndefined();
  });

  it('rejects an empty file', () => {
    expect(fileError([new File([], 'empty.csv')])).toBe('This file is empty. Pick another one.');
  });

  it('rejects more than one file', () => {
    expect(fileError([file, file])).toBe('Pick one file at a time.');
  });

  it('asks for a file when there is none', () => {
    expect(fileError([])).toBe('Pick a file.');
  });
});
