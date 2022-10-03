import Vue from 'vue';
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
