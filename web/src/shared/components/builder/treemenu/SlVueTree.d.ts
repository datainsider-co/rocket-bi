import Vue from 'vue';
import { Field } from '@core/common/domain';

export interface SlTreeNodeModel<TDataType> {
  title: string;
  isLeaf?: boolean;
  children?: SlTreeNodeModel<TDataType>[];
  isExpanded?: boolean;
  isSelected?: boolean;
  isDraggable?: boolean;
  isSelectable?: boolean;
  data?: TDataType;
  tag?: object;
  isNested?: boolean;
  field?: Field;
  /**
   * icon component name, refer it than iconSrc
   */
  icon?: string;
  /**
   * icon as image url, it will be ignored if icon is set
   * it will render as <img src="iconSrc" />
   */
  iconSrc?: string;
}
export interface SlTreeNode<TDataType> extends SlTreeNodeModel<TDataType> {
  isVisible?: boolean;
  isFirstChild: boolean;
  isLastChild: boolean;
  ind: number;
  level: number;
  path: number[];
  pathStr: string;
  children: SlTreeNode<TDataType>[];
}
export interface CursorPosition<TDataType> {
  node: SlTreeNode<TDataType>;
  placement: 'before' | 'inside' | 'after';
}
export interface VueData<TDataType> {
  rootCursorPosition: CursorPosition<TDataType>;
  rootDraggingNode: SlTreeNode<TDataType>;
}
export default class SlVueTree<TDataType> extends Vue {
  value: SlTreeNodeModel<TDataType>[];
  level: number;
  parentInd: number;
  cursorPosition: CursorPosition<TDataType>;
  readonly nodes: SlTreeNode<TDataType>[];
  getNode(path: number[]): SlTreeNode<TDataType>;
}
