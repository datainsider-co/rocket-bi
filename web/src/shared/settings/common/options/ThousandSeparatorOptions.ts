import { SelectOption } from '@/shared';

export enum ThousandSeparator {
  Comma = 'comma',
  Dot = 'dot',
  Space = 'space',
  None = 'none'
}

export const ThousandSeparatorOptions: SelectOption[] = [
  { displayName: ',', id: ThousandSeparator.Comma },
  { displayName: '.', id: ThousandSeparator.Dot },
  { displayName: 'Space', id: ThousandSeparator.Space },
  { displayName: 'None', id: ThousandSeparator.None }
];
