import { isFunction } from 'lodash';

export abstract class ValueController {
  /**
   * @returns true if this is a value controller and enable control value of other filter.
   * If return false, this control will be hidden in list chart control.
   */
  abstract isEnableControl(): boolean;

  /**
   * get all supported value of this value controller.
   * Used to display in config filter panel in chart builder.
   * @returns all supported value of this value controller.
   */
  abstract getSupportedControls(): ValueControlInfo[];

  /**
   * Get all values of this value controller by value type.
   * @returns all values of this value controller by value type.
   * Otherwise, return undefined if no default value.
   */
  abstract getDefaultValueAsMap(): Map<ValueControlType, string[]> | undefined;

  static isValueController(obj: any & ValueController): obj is ValueController {
    return obj && isFunction(obj.isEnableControl) && isFunction(obj.getSupportedControls) && isFunction(obj.getDefaultValueAsMap);
  }
}

export class ValueControlInfo {
  type: ValueControlType;
  displayName: string;
  constructor(type: ValueControlType, displayName: string) {
    this.type = type;
    this.displayName = displayName;
  }
}

export enum ValueControlType {
  SelectedValue = 'selected_value',
  MaxValue = 'max_value',
  MinValue = 'min_value'
}
