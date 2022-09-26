/*
 * @author: tvc12 - Thien Vi
 * @created: 5/19/21, 2:19 PM
 */

export type Accept = true;
export type Deny = false;
export type CloneWhenDrop = 'clone';

export class DropOptions {
  static Accept = true;
  static Deny = false;
  static CloneWhenDrop: 'clone' = 'clone';
}

// https://github.com/SortableJS/Sortable#event-object-demo
export interface GroupConfig {
  name: string;
  put: Accept | Deny | ((to: any, from: any) => Accept | Deny);
  pull: Accept | Deny | CloneWhenDrop | ((to: any, from: any) => Accept | Deny | CloneWhenDrop) | string[];
  revertClone: boolean;
}

export interface DragCustomEvent {
  to: Element & any;
  from: Element & any;
  item: Element & any;
  oldIndex: number;
  newIndex: number;
  oldDraggableIndex: number;
  newDraggableIndex: number;

  [key: string]: any;
}
