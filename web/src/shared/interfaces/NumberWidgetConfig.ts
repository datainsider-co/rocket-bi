/*
 * @author: tvc12 - Thien Vi
 * @created: 1/4/21, 8:27 PM
 */

export interface NumberWidgetConfig {
  minWidth: number;
  maxWidth: number;
  numberTextSize: number;
  titleTextSize: number;
  subTitleTextSize: number;
  /**
   * Margin config for responsive
   * @Item1: Margin top of Subtitle
   * @Item2: Margin top of Number
   * @Item3: Margin top of Comparison
   */
  marginConfig: [number, number, number];
}
