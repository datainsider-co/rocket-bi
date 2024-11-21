/*
 * @author: tvc12 - Thien Vi
 * @created: 5/11/21, 11:08 AM
 */

import { Log } from '@core/utils';
import { ViewPort } from '@/shared/models';
import { MethodProfiler } from '@/shared/profiler/Annotation';

export class ViewportController {
  private readonly rowCacheRate = 3;
  private readonly columnCacheRate = 3;
  private lastBufferRect: null | DOMRect = null;

  private rowHeight: number;
  private rowWidth: number;

  private nRow = 0;
  private nRowBuffer = 0;

  private nColumn = 0;
  private nColumnBuffer = 0;
  private viewPort: ViewPort = ViewPort.default();

  private heightBuffer = 0;
  private widthBuffer = 0;

  private screenHeight = 0;
  private screenWidth = 0;

  constructor(rowHeight: number, rowWidth: number) {
    this.rowHeight = rowHeight;
    this.rowWidth = rowWidth;
  }

  static default() {
    return new ViewportController(0, 0);
  }

  getViewport() {
    return this.viewPort;
  }

  init(screenWidth: number, screenHeight: number) {
    this.screenWidth = screenWidth;
    this.screenHeight = screenHeight;
    this.initRowBuffer(screenHeight);
    this.initColumnBuffer(screenWidth);

    this.viewPort = new ViewPort(0, this.nColumnBuffer, 0, this.nRowBuffer);
    this.lastBufferRect = this.createBufferRect(0, 0);

    Log.debug('init::', 'rowWidth::', this.rowWidth, 'rowHeight::', this.rowHeight);
    Log.debug('nRow::', this.nRow, 'nRowBuffer', this.nRowBuffer);
    Log.debug('ColumnSize::', this.nColumn, 'nColumnBuffer', this.nColumnBuffer);
    Log.debug('------------------------------');
  }

  // check small rect overflow with largeRect
  @MethodProfiler({ name: 'isOverflow' })
  private isOverflow(largeRect: DOMRect, smallRect: DOMRect): boolean {
    const isOverflowLeft = smallRect.left < largeRect.left;
    const isOverflowRight = smallRect.right > largeRect.right - this.rowWidth * 1.5;
    const isOverflowTop = smallRect.top < largeRect.top;
    const isOverflowBottom = smallRect.bottom > largeRect.bottom - this.rowHeight * 1.5;
    return isOverflowLeft || isOverflowRight || isOverflowTop || isOverflowBottom;
  }

  canRepaint(top: number, left: number): boolean {
    if (this.lastBufferRect) {
      const currentRect = this.getCurrentRect(top, left);
      return this.isOverflow(this.lastBufferRect, currentRect);
    } else {
      return true;
    }
  }

  private getCurrentRect(top: number, left: number): DOMRect {
    return new DOMRect(left, top, this.screenWidth, this.screenHeight);
  }

  /**
   * Return buffer rect bound current buffer
   * @param top
   * @param left
   * @private
   */
  @MethodProfiler({ name: 'createBufferRect' })
  private createBufferRect(top: number, left: number): DOMRect {
    const currentRect = this.getCurrentRect(top, left);
    const x = currentRect.left + currentRect.width / 2 - this.widthBuffer / 2;
    const y = currentRect.top + currentRect.height / 2 - this.heightBuffer / 2;
    return new DOMRect(Math.max(0, x), Math.max(0, y), this.widthBuffer, this.heightBuffer);
  }

  // keep viewport in center of buffer box
  @MethodProfiler({ name: 'move' })
  move(top: number, left: number): void {
    const bufferRect = this.createBufferRect(top, left);

    const rowStart = Math.floor(Math.max(0, bufferRect.top / this.rowHeight));
    const columnStart = Math.floor(Math.max(0, bufferRect.left / this.rowWidth));
    this.viewPort = new ViewPort(columnStart, this.nColumnBuffer, rowStart, this.nRowBuffer);

    this.lastBufferRect = bufferRect;
  }

  private initRowBuffer(screenHeight: number) {
    this.nRow = Math.ceil(screenHeight / this.rowHeight) + 1;
    // min row buffer 201
    this.nRowBuffer = Math.max(201, Math.floor(this.nRow * this.rowCacheRate));
    this.heightBuffer = this.nRowBuffer * this.rowHeight;
  }

  private initColumnBuffer(screenWidth: number) {
    this.nColumn = Math.ceil(screenWidth / this.rowWidth) + 1;
    // min buffer 51 item
    this.nColumnBuffer = Math.max(101, Math.floor(this.nColumn * this.columnCacheRate));
    this.widthBuffer = this.nColumnBuffer * this.rowWidth;
  }
}
