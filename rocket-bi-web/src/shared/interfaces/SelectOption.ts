export interface SelectOption {
  displayName: string;
  id: number | string | boolean;
  data?: any;
  disable?: boolean;
}

export enum InputType {
  date = 'date_time',
  dateRange = 'date_range',
  text = 'text',
  color = 'color',
  multiSelect = 'multi_select',
  none = 'none',
  numberRange = 'number_range'
}

export interface FilterSelectOption extends SelectOption {
  inputType: InputType;
}
