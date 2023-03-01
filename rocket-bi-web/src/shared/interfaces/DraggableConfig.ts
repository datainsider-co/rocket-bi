import { ConfigType, FunctionFamilyInfo } from '@/shared';

export interface IconMenuItem {
  src: string;
  alt: string;
  click?: any;
  ///Default: false
  hidden?: boolean;
  ///Default: true
  enable?: boolean;
}

export interface DraggableConfig {
  key: ConfigType;
  title: string;
  placeholder: string;
  preferFunctionTypes: string[];
  isOptional?: boolean;
  maxItem?: number;
  enable?: boolean;
  // get default FunctionFamilyInfo with column type
  defaultTextFunctionInfo?: FunctionFamilyInfo;
  defaultNumberFunctionInfo?: FunctionFamilyInfo;
  defaultDateFunctionInfo?: FunctionFamilyInfo;
}

export interface VisualizationItemData extends ItemData {
  configPanels: DraggableConfig[];
  extraPanels: DraggableConfig[];
  isHidden?: boolean;
  useChartBuilder?: boolean;
}

export interface ItemData {
  src: string;
  title: string;
  type: string;
  hidden?: boolean;
}
