import { ConditionType, ScalarFunction } from '@core/domain';
import { DateHistogramConditionTypes } from '@/shared';

export interface DynamicControlData {
  type: 'values' | 'date';
  values?: string[];
  dateValues?: {
    dateType: ConditionType;
    values?: string[];
  };
}
