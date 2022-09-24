/*
 * @author: tvc12 - Thien Vi
 * @created: 6/18/21, 2:47 PM
 */

import { SelectOption } from '@/shared';

export const AlignOptions: SelectOption[] = [
  {
    displayName: 'Left',
    id: 'left'
  },
  {
    displayName: 'Right',
    id: 'right'
  },
  {
    displayName: 'Center',
    id: 'center'
  }
];

export const FlexAlignOptions: SelectOption[] = [
  {
    displayName: 'Top',
    id: 'flex-start'
  },
  {
    displayName: 'Center',
    id: 'center'
  },
  {
    displayName: 'Bottom',
    id: 'flex-end'
  }
];
