import { RandomUtils } from '@/utils/random.utils';
import { snakeCase } from 'lodash';

enum PrefixId {
  Button = 'btn',
  Input = 'input',
  Dropdown = 'swm-select',
  Toggle = 'toggle',
  Filter = 'dynamic',
  Widget = 'widget',
  Checkbox = 'checkbox',
  MultiSelection = 'multi-selection'
}

export class IdGenerator {
  static generateButtonId(name: string, index?: number) {
    return index ? `${PrefixId.Button}-${name}-${index}` : `${PrefixId.Button}-${name}`;
  }

  static generateInputId(name: string, index?: number) {
    return index ? `${PrefixId.Input}-${name}-${index}` : `${PrefixId.Input}-${name}`;
  }

  static generateToggleId(name: string, index?: number) {
    return index ? `${PrefixId.Toggle}-${name}-${index}` : `${PrefixId.Toggle}-${name}`;
  }

  static generateCheckboxId(name: string, index?: number) {
    return index ? `${PrefixId.Checkbox}-${name}-${index}` : `${PrefixId.Checkbox}-${name}`;
  }

  static generateDropdownId(name: string, index?: number) {
    return index ? `${PrefixId.Dropdown}-${name}-${index}` : `${PrefixId.Dropdown}-${name}`;
  }

  static generateMultiSelectionId(name: string, index?: number) {
    return index ? `${PrefixId.MultiSelection}-${name}-${index}` : `${PrefixId.MultiSelection}-${name}`;
  }

  static generateFilterId(...metaData: (string | number)[]): string {
    const suffix: string = metaData.join('-');
    return `${PrefixId.Filter}-${suffix}`;
  }

  static generateName(fieldName: string): string {
    const name = snakeCase(fieldName);
    return `${name}`;
  }

  static generateKey(keys: string[], separator = '_'): string {
    return keys.join(separator);
  }
}

export const GenIdMethods = {
  genBtnId: IdGenerator.generateButtonId,
  genInputId: IdGenerator.generateInputId,
  genToggleId: IdGenerator.generateToggleId,
  genCheckboxId: IdGenerator.generateCheckboxId,
  genDropdownId: IdGenerator.generateDropdownId,
  genMultiSelectionId: IdGenerator.generateMultiSelectionId,
  genFilterId: IdGenerator.generateFilterId
};
