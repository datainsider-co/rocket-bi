/*
 * @author: tvc12 - Thien Vi
 * @created: 5/5/21, 2:57 PM
 */

export interface FormulaController {
  /**
   * Trả về name của formula
   */
  formulaName(): string;

  /**
   * Trả về theme đã được định nghĩa ở monaco
   */
  getTheme(themeType: 'light' | 'dark' | 'custom'): string;

  /**
   * Init suggestion
   * @param monaco
   */
  init(monaco: any): void;

  dispose(): void;
}
