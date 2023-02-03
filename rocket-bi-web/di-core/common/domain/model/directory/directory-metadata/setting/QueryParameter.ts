export enum ParamValueType {
  text = 'text',
  number = 'number',
  date = 'date'
}

export interface QueryParameter {
  displayName: string;
  valueType: ParamValueType;
  value: any;
}

export function defaultQueryParameter(): QueryParameter {
  return {
    displayName: '',
    valueType: ParamValueType.text,
    value: ''
  };
}
