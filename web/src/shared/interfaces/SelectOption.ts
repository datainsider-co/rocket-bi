export interface SelectOption {
  displayName: string;
  id: number | string | boolean;
  data?: any;
  disable?: boolean;
}

export enum InputType {
  Date = 'date_time',
  DateRange = 'date_range',
  Text = 'text',
  MultiSelect = 'multi_select',
  None = 'none',
  NumberRange = 'number_range'
}

export interface FilterSelectOption extends SelectOption {
  inputType: InputType;
}
