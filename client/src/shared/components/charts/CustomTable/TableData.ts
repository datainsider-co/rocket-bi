/*
 * @author: tvc12 - Thien Vi
 * @created: 5/28/21, 1:56 PM
 */

import { IndexedHeaderData, RowData } from '@/shared/models';
import { IconAlign, IconLayout, WidgetId } from '@core/domain/Model';
import { ToggleCollapseCallBack } from '@chart/CustomTable/ToggleCollapseCallBack';
import { TableExtraData } from '@chart/CustomTable/TableExtraData';
import { MouseEventData } from '@chart/BaseChart';

export interface CustomBodyCellData {
  rowData: RowData;
  rowIndex: number;
  header: IndexedHeaderData;
  columnIndex: number;
}

export interface DataBarStyle {
  positiveStyle: CSSStyleDeclaration;
  negativeStyle: CSSStyleDeclaration;
}

export interface IconStyle {
  iconHTML: string;
  layout: IconLayout;
  align: IconAlign;
}

export interface CustomStyleData {
  css: CSSStyleDeclaration;
  dataBar?: DataBarStyle;
  icon?: IconStyle;
}

export interface CustomHeaderCellData {
  header: IndexedHeaderData;
}

export type CustomFooterCellData = CustomHeaderCellData;

/**
 * Allow custom cell in body table
 */
export interface CustomCellCallBack {
  /**
   * Override all style of cell. Unstoppable!!, be careful when use it
   * @param bodyCellData: all data of cell
   */
  customBodyCellStyle?: (bodyCellData: CustomBodyCellData) => CustomStyleData;
  customHeaderCellStyle?: (cellData: CustomHeaderCellData) => CustomStyleData;
  customFooterCellStyle?: (cellData: CustomFooterCellData) => CustomStyleData;
  onContextMenu?: (mouseData: MouseEventData<string>) => void;
  onClickRow?: (cell: CustomBodyCellData) => void;
}

export interface CustomTableProp {
  readonly id: string | WidgetId;
  readonly rows: any[];
  readonly headers: any[];
  readonly isShowFooter?: boolean | null;
  readonly hasPinned?: boolean | null;
  readonly enableScrollBar?: boolean | null;
  readonly numPinnedColumn?: number | null;
  readonly rowHeight?: number | null;
  readonly maxHeight?: number | null;
  readonly customCellCallBack?: CustomCellCallBack | null;
  readonly customToggleCollapseFn?: ToggleCollapseCallBack | null;
  readonly extraData?: TableExtraData;
  readonly disableSort?: boolean;
}
