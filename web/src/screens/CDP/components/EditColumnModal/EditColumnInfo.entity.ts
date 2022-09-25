export class EditColumnInfo {
  name: string;
  displayName: string | null;
  isPropertiesColumn: boolean;

  constructor(name: string, displayName?: string | null, isPropertiesColumn?: boolean) {
    this.name = name;
    this.displayName = displayName || null;
    this.isPropertiesColumn = isPropertiesColumn ?? false;
  }

  get prettyName(): string {
    return this.displayName || this.name;
  }

  static fromProperties(name: string): EditColumnInfo {
    return new EditColumnInfo(name, null, true);
  }
}
