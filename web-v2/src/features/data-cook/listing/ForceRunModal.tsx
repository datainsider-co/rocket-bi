import { useState } from 'react';
import { Calendar, Modal, Typography } from 'antd';
import dayjs, { type Dayjs } from 'dayjs';
import type { EtlJob } from '@/core/data-cook/EtlJob';
import { isPastDay } from './etlListing.utils';

interface ForceRunModalProps {
  etl: EtlJob;
  /** When the dialog opened: today is picked, earlier days are disabled. */
  now: number;
  isSubmitting: boolean;
  onSubmit: (day: Dayjs) => void;
  onClose: () => void;
}

/**
 * v1 `ForceRunSettingModal`: pick the day the ETL runs, today by default. Today runs it now, a later day at its
 * start; the schedule goes on afterwards.
 */
export function ForceRunModal({ etl, now, isSubmitting, onSubmit, onClose }: ForceRunModalProps) {
  const [day, setDay] = useState(() => dayjs(now));

  return (
    <Modal
      open
      title="Force Run"
      okText="Force Run"
      width={420}
      confirmLoading={isSubmitting}
      onOk={() => onSubmit(day)}
      onCancel={onClose}
    >
      <Typography.Paragraph type="secondary">
        Select the day to run <Typography.Text strong>{etl.displayName}</Typography.Text>
      </Typography.Paragraph>
      <Calendar
        fullscreen={false}
        value={day}
        disabledDate={date => isPastDay(date, now)}
        onSelect={date => setDay(date)}
      />
    </Modal>
  );
}
