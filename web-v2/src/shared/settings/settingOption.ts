/** A choice in a setting's dropdown. */
export interface SettingOption<T extends string | number = string> {
  readonly label: string;
  readonly value: T;
}
