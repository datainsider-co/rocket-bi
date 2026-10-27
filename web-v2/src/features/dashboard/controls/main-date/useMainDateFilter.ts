import { useCallback, useState } from 'react';
import { App } from 'antd';
import { DateMode } from '@/core/query/dateRanges';
import { dateSelectionOf } from '../../charts/filter/filter.utils';
import { MAIN_DATE_ID, type MainDateState } from '../controls.utils';
import { useDashboardControls } from '../DashboardControlsContext';
import { rangeLabel } from './mainDate.utils';

/** What edit mode gives the main date filter: saving the dashboard's setting with or without it. */
export interface MainDateEditing {
  /** Saves the setting with a main date filter of this default mode, or without one when `undefined`. */
  save: (mode: DateMode | undefined) => Promise<void>;
}

const ALL_TIME: MainDateState = { mode: DateMode.AllTime, dates: [] };

/**
 * The main date filter of the header (v1 `MainDateFilter`, `SetupMainDateFilter`, `DashboardControlBar`): applying a
 * range, and in edit mode setting the filter up, choosing its default again (Edit Main Date) or removing it. Each change
 * applies at once and is then saved; the page restarts its controls once the saved setting comes back.
 */
export function useMainDateFilter(editing?: MainDateEditing) {
  const { mainDate, controls, setMainDate, removeMainDate } = useDashboardControls();
  const { message, modal } = App.useApp();
  /** The Choose Default Time Range popover is open (v1 `isResetMainDateFlow`). */
  const [choosing, setChoosing] = useState(false);

  const save = useCallback(
    async (mode: DateMode | undefined, failure: string) => {
      try {
        await editing?.save(mode);
      } catch {
        void message.error(failure);
      }
    },
    [editing, message]
  );

  const setUp = useCallback(
    (mode: DateMode) => {
      setChoosing(false);
      setMainDate({ mode, dates: [] });
      void save(mode, 'Setup the main date filter failed');
    },
    [setMainDate, save]
  );

  const remove = useCallback(
    () =>
      void modal.confirm({
        title: 'Remove main date filter',
        content: 'Are you sure that you want to remove the main date filter?',
        okText: 'Yes',
        cancelText: 'No',
        onOk: () => {
          removeMainDate();
          return save(undefined, 'Remove the main date filter failed');
        }
      }),
    [modal, removeMainDate, save]
  );

  return {
    mainDate,
    applied: mainDate ?? ALL_TIME,
    label: rangeLabel(dateSelectionOf(controls[MAIN_DATE_ID]).range),
    apply: setMainDate,
    editable: editing !== undefined,
    choosing,
    setChoosing,
    setUp,
    remove
  };
}
