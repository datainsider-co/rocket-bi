import { FieldDetailInfo } from '@core/common/domain/model/function/FieldDetailInfo';

export interface GroupedField {
  groupTitle: string;
  children: FieldDetailInfo[];
}
