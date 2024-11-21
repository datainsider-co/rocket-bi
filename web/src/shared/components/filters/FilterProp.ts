import { DateHistogramConditionTypes, InputType, NumberConditionTypes, StringConditionTypes } from '@/shared';
import { FieldDetailInfo } from '@core/common/domain/model/function/FieldDetailInfo';

export abstract class FilterProp {
  abstract defaultValues: string[];
  abstract defaultOptionSelected: string;
  abstract profileField: FieldDetailInfo;

  abstract getCurrentValues(): string[];

  abstract getSelectedCondition(): DateHistogramConditionTypes | NumberConditionTypes | StringConditionTypes;

  abstract getCurrentInputType(): InputType;
}
