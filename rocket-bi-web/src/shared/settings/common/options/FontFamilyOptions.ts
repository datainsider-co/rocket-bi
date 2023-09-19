/*
 * @author: tvc12 - Thien Vi
 * @created: 6/18/21, 2:47 PM
 */

import { SelectOption } from '@/shared';
import { StringUtils } from '@/utils/StringUtils';

export const FontFamilyOptions: SelectOption[] = [
  {
    displayName: 'Arial',
    id: 'Arial, sans-serif'
  },
  {
    displayName: 'Barlow',
    id: 'Barlow'
  },
  {
    displayName: 'Roboto',
    id: 'Roboto'
  },
  {
    displayName: 'Courier New',
    id: 'Courier New, monospace'
  },
  {
    displayName: 'Tahoma',
    id: 'Tahoma, sans-serif'
  },
  {
    displayName: 'Verdana',
    id: 'Verdana, sans-serif'
  },
  {
    displayName: 'Helvetica',
    id: 'Helvetica, sans-serif'
  },
  {
    displayName: 'Montserrat',
    id: 'Montserrat'
  },
  {
    displayName: 'Times New Roman',
    id: 'Times New Roman, serif'
  },
  {
    displayName: 'Georgia',
    id: 'Georgia, serif'
  },
  {
    displayName: 'Garamond',
    id: 'Garamond, serif'
  },
  {
    displayName: 'Primary Text Font',
    id: 'var(--widget-primary-font-family, Roboto)',
    data: {
      isDefault: true
    }
  },
  {
    displayName: 'Secondary Text Font',
    id: 'var(--widget-secondary-font-family, Roboto)',
    data: {
      isDefault: true
    }
  }
].sort((item, nextItem) => StringUtils.compare(item.displayName, nextItem.displayName));
