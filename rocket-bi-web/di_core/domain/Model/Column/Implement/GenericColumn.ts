export class GenericColumn {
  className: string;
  dataType: string;
  displayName: string;
  name: string;
  isNullable?: boolean;
  isAsTimestamp?: boolean;
  defaultValue?: string;
  inputFormats?: string[];
  nestedColumns?: any;

  constructor(data: any) {
    this.className = data.className || '';
    this.displayName = data.displayName || '';
    this.name = data.name || '';
    this.dataType = data.dataType || '';
    this.isNullable = data.isNullable || false;
    this.isAsTimestamp = data.isAsTimestamp || false;
    this.defaultValue = data.defaultValue || '';
    this.inputFormats = data.inputFormats || [];
    this.nestedColumns = data.nestedColumns || void 0;
  }
}
