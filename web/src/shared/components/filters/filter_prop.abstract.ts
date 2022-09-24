import { InputType } from '@/shared';
import { FieldDetailInfo } from '@core/domain/Model/Function/FieldDetailInfo';

export abstract class FilterProp {
  abstract defaultValues: string[];
  abstract defaultOptionSelected: string;
  abstract profileField: FieldDetailInfo;

  abstract getCurrentValues(): string[];

  abstract getCurrentOptionSelected(): string;

  abstract getCurrentInputType(): InputType;
}
