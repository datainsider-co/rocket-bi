/*
 * @author: tvc12 - Thien Vi
 * @created: 5/25/21, 2:46 PM
 */

import { GridStack, GridStackOptions } from 'gridstack';
import { GridStackEngine } from 'gridstack/dist/gridstack-engine';

export interface CustomGridStackOptions extends GridStackOptions {
  enableOverlap?: boolean;
}

export interface CustomGridstackEngine extends GridStackEngine {
  setEnableOverlap(enableOverlap: boolean): void;
  toggleOverlap(): void;
}

export interface CustomGridstack extends GridStack {
  engine: CustomGridstackEngine;
}
