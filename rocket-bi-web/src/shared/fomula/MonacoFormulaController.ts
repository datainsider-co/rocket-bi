/*
 * @author: tvc12 - Thien Vi
 * @created: 5/5/21, 2:57 PM
 */

export interface MonacoFormulaController {
  /**
   * @return current formula name
   */
  formulaName(): string;

  /**
   * @return theme name of current formula
   */
  getTheme(): string;

  /**
   * Init suggestion for formula
   * @param monaco
   */
  init(monaco: any): void;

  /**
   * Dispose suggestion for formula,
   * call this method when you want to change formula or destroy editor
   */
  dispose(): void;
}
