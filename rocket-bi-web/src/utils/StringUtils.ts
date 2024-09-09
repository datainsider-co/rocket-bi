import { camelCase, isString, kebabCase, snakeCase, toNumber } from 'lodash';
import { vietnamese } from 'vietnamese-js';

export abstract class StringUtils {
  private static arrayRegex = /(\w+)\[(\d+)]/;
  private static numberRegex = /^-?([0-9]+([.][0-9]*)?|[.][0-9]+)$/;
  static WordPattern = '(-?\\d*\\.\\d\\w*)|([^`~!#%^&*()\\-=+\\[{\\]}\\\\|;:\'",.<>\\/?\\s]+)';

  static isEmpty(str: any): str is string {
    return !str || !str.length;
  }

  static isNotEmpty(str: string | null | undefined): str is string {
    return !!str && !!str.length;
  }

  static isNumberPattern(str: string | null | undefined): boolean {
    return StringUtils.isNotEmpty(str) && StringUtils.numberRegex.test(str);
  }

  /**
   * camelToCapitalizedStr("tienLen") => Tien Len
   */
  static camelToCapitalizedStr(str: string) {
    const newStr = str.replace(/[A-Z]/g, ' $&');
    return newStr[0].toUpperCase() + newStr.slice(1);
  }

  /**
   * camelToDisplayString("tienLen") => Tien len
   */
  static camelToDisplayString(str: string) {
    const newStr = str.replace(/[A-Z]/g, ' $&').toLowerCase();
    return newStr[0].toUpperCase() + newStr.slice(1);
  }

  // check second text includes in firstText
  static isIncludes(keyword: string, text: string): boolean {
    return StringUtils.of(text)
      .trim()
      .toLocaleLowerCase()
      .includes(
        StringUtils.of(keyword)
          .trim()
          .toLocaleLowerCase()
      );
  }

  static removeWhiteSpace(text: string): string {
    return text.replace(/[-\s]*/g, '');
  }

  static formatDisplayNumber(rawData: any, defaultText = '--', locale = 'en-US', options: any = { maximumFractionDigits: 2 }): string {
    const num: number = toNumber(rawData);
    if (isNaN(num)) {
      return rawData ?? defaultText;
    } else {
      return num.toLocaleString(locale, options);
    }
  }

  ///Compare two text
  ///Returns:
  // A negative number if referenceStr occurs before compareString; positive if the referenceStr occurs after compareString; 0 if they are equivalent
  static compare(textA: string, textB: string) {
    if (isString(textA) && isString(textB)) {
      return textA.localeCompare(textB, 'en');
    }
    return 0;
  }

  static toPx(value: any): string {
    const valueAsNumber = toNumber(value);
    if (isNaN(valueAsNumber)) {
      return value;
    } else {
      return valueAsNumber + 'px';
    }
  }

  /**
   * find key is array in key
   *
   * ex:
   * animal.0.cat => []
   *
   * animal[0].cat => [animal]
   *
   * animal[0].cat[1].dog => [animal, animal.cat]
   * @param key
   */
  static findPathHasArray(key: string): string[] {
    const paths: string[] = [];
    let parentPath = '';
    key.split('.').forEach(keyName => {
      const currentPath = StringUtils.getCurrentPath(parentPath, keyName);
      if (this.isArrayKey(keyName)) {
        paths.push(currentPath);
      }
      parentPath = currentPath;
    });
    return paths;
  }

  private static isArrayKey(keyName: string) {
    return StringUtils.arrayRegex.test(keyName);
  }

  private static removeArraySyntax(keyName: string): string {
    if (this.isArrayKey(keyName)) {
      const groups: string[] = this.arrayRegex.exec(keyName) ?? [];
      return groups[1] ?? '';
    } else {
      return keyName;
    }
  }

  private static getCurrentPath(parentPath: string, keyName: string): string {
    const normalizeKey = StringUtils.removeArraySyntax(keyName);
    if (parentPath) {
      return StringUtils.buildPath(parentPath, normalizeKey);
    } else {
      return normalizeKey;
    }
  }

  static buildPath(...paths: string[]): string {
    return paths.join('.');
  }

  /**
   * toKebabCase("tien len") => tien-len
   */
  static toKebabCase(key: string) {
    return kebabCase(key);
  }

  /**
   * toSnakeCase("tien len") => tien_len
   */
  static toSnakeCase(key: string) {
    return snakeCase(key);
  }

  /**
   * toSnakeCase("tien len") => tienLen
   */
  static toCamelCase(value: string): string {
    return camelCase(value);
  }

  static isNumberFirst(text: string): boolean {
    //digit first
    const regex = new RegExp(/^\d/);
    return regex.test(text);
  }

  static formatByteToDisplay(bytes: number): string {
    let result = '';
    if (bytes === 0) {
      return '--';
    } else {
      const k = 1024;
      const dm = 2;
      const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'];
      const i = Math.floor(Math.log(bytes) / Math.log(k));
      result = parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
    }
    return result;
  }

  static normalizeTableName(name: string) {
    return name.toLowerCase().replace(/[^(\d\w_)]/g, '_');
  }

  static normalizeDatabaseName(name: string) {
    return name.toLowerCase().replace(/[^(\d\w_)]/g, '_');
  }

  static getMineType(contentType?: string): string[] {
    if (contentType) {
      const [type, subType] = contentType.split('/');
      return [type, subType];
    } else {
      return [];
    }
  }

  static isEmailFormat(text: string) {
    const regex = new RegExp(
      '^(([^<>()\\[\\]\\\\.,;:\\s@"]+(\\.[^<>()\\[\\]\\\\.,;:\\s@"]+)*)|(".+"))@((\\[[0-9]{1,3}\\.[0-9]{1,3}\\.[0-9]{1,3}\\.[0-9]{1,3}])|(([a-zA-Z\\-0-9]+\\.)+[a-zA-Z]{2,}))$'
    );
    return regex.test(text);
  }

  static getValueFromRegex(text: string, regex: RegExp, groupIndex: number): string | undefined {
    const groups: string[] = regex.exec(text) ?? [];
    return groups[groupIndex] ?? void 0;
  }

  /**
   * Chuyển tiếng việt có dấu thành không dấu
   *
   * Việt Nam => Viet Nam
   */
  static vietnamese(text: string): string {
    return vietnamese(text);
  }

  static insertAt(text: string, textToAdd: string, at: number) {
    return text.slice(0, at) + textToAdd + text.slice(at);
  }

  // todo: don't remove this \n, it will cause the query to be executed incorrectly when query has commend in the end
  static fixCommentInSql(query: string) {
    return `${String(query).trim()} \n`;
  }

  static buildQueryParamRegex(key: string): RegExp {
    return new RegExp(`{{\\s*${key}\\s*}}`, 'g');
  }

  /**
   * convert value to string, if value is null or undefined, return empty string
   * @param value
   */
  static of(value: any): string {
    return String(value ?? '');
  }

  /**
   * return hash code of text
   */
  static hashCode(text?: string | null): number {
    if (!text) {
      return 0;
    }
    let hash = 0;
    for (let i = 0; i < text.length; i++) {
      const char = text.charCodeAt(i);
      hash = (hash << 5) - hash + char;
      hash |= 0; // Convert to 32bit integer
    }
    return hash;
  }

  /**
   * check if text is snake case or not
   * ex:
   * tien_len => true
   *
   * tienLen => false
   *
   * tien-len => false
   *
   * tien => true
   *
   * TienLen => false
   *
   * tien len => false
   */
  static isSnakeCase(text: string): boolean {
    return snakeCase(text) === text;
  }

  static isCamelCase(text: string): boolean {
    return camelCase(text) === text;
  }

  static capitalizeFirstLetter(text: string) {
    return text.charAt(0).toUpperCase() + text.slice(1);
  }
}
