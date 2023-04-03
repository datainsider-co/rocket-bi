export enum ParamValueType {
  text = 'text',
  number = 'number',
  date = 'date',
  list = 'list'
}
export interface QueryParameter {
  displayName: string;
  valueType: ParamValueType;
  value: any;
  list: string[] | null;
}

export function defaultQueryParameter(): QueryParameter {
  return {
    displayName: '',
    value: '',
    valueType: ParamValueType.text,
    list: null
  };
}
