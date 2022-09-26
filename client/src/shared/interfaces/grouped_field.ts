import { FieldDetailInfo } from '@core/domain/Model/Function/FieldDetailInfo';

export interface GroupedField {
  groupTitle: string;
  children: FieldDetailInfo[];
}
