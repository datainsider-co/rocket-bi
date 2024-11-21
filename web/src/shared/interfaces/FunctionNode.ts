import { SlTreeNode, SlTreeNodeModel } from '@/shared/components/builder/treemenu/SlVueTree';
import { Field, TableSchema } from '@core/common/domain/model';
import { ActionType } from '@/utils/PermissionUtils';

export interface LabelNode {
  label: string;
  type?: string;
  isHidden?: boolean;
}

export interface ActionNode {
  label: string;
  type: ActionType;
  actions: string[];
}

export interface FunctionNode {
  label: string;
  type?: string;
  options?: LabelNode[];
  subFunctions?: FunctionNode[];
}

export interface DataFlavor<T> {
  node: T;
}

export interface FunctionTreeNode extends SlTreeNode<FunctionNode> {
  id: number;
  functionFamily: string;
  functionType: string;
  /**
   * @deprecated unused in app, can remove in next version
   */
  optionsOpened: boolean;
  displayName: string;
  selectedCondition: string;
  /**
   * @deprecated can remove in next version
   */
  parent: SlTreeNodeModel<TableSchema>;
  /**
   * @deprecated can remove in next version
   */
  selectedConfig: string;
  field?: Field;
  displayAsColumn?: boolean;
  sorting: string;
  numElemsShown?: number | null;
  isShowNElements?: boolean;
  extraData?: {
    isMeasure?: boolean;
    isCalculated?: boolean;
  };
}
