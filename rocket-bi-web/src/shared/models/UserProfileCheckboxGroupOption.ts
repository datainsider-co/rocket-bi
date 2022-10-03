import { Field } from '@core/common/domain/model';

export class UserProfileCheckboxGroupOption {
  value: string;
  text: string;
  isNested: boolean;
  field: Field;
  disabled: boolean;

  constructor(value: string, text: string, isNested: boolean, field: Field, disabled?: boolean) {
    this.isNested = isNested || false;
    this.value = value || '';
    this.text = text || '';
    this.field = field || {};
    this.disabled = disabled || false;
  }
}
