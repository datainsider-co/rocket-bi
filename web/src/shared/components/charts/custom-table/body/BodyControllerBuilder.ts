import { HeaderData, IndexedHeaderData, RowData, RowDataUtils } from '@/shared/models';
import { StringUtils } from '@/utils/StringUtils';
import { BodyController } from '@chart/custom-table/body/BodyController';
import { CustomCellCallBack } from '@chart/custom-table/TableData';
import { NumberFormatter } from '@core/common/services';

export class BodyControllerBuilder {
  private mainHeaders: IndexedHeaderData[] = [];
  private rows: RowData[] = [];
  private onToggleCollapse?: (rowData: RowData, rowIndex: number, header: IndexedHeaderData, columnIndex: number) => void;
  private hasPinned = false;
  private numPinnedColumn = 1;
  private minCellWidth = 0;
  private formatter?: (rowData: RowData, header: IndexedHeaderData) => string;
  private customCellCallBack?: CustomCellCallBack;

  withDefaultFormatter(): BodyControllerBuilder {
    this.formatter = this.defaultFormatter;
    return this;
  }

  withFormatter(formatter: (rowData: RowData, header: IndexedHeaderData) => string): BodyControllerBuilder {
    this.formatter = formatter;
    return this;
  }

  withToggleCollapseEvent(
    onToggleCollapse: (rowData: RowData, rowIndex: number, header: IndexedHeaderData, columnIndex: number) => void
  ): BodyControllerBuilder {
    this.onToggleCollapse = onToggleCollapse;
    return this;
  }

  withMinCellWidth(minCellWidth: number): BodyControllerBuilder {
    this.minCellWidth = minCellWidth;
    return this;
  }

  withTableData(mainHeaders: IndexedHeaderData[], rows: RowData[]): BodyControllerBuilder {
    this.mainHeaders = mainHeaders;
    this.rows = rows;
    return this;
  }

  withPinnedData(hasPinned: boolean, numPinnedColumn: number): BodyControllerBuilder {
    this.hasPinned = hasPinned;
    this.numPinnedColumn = numPinnedColumn;
    return this;
  }

  build(): BodyController {
    return new BodyController(
      this.mainHeaders,
      this.rows,
      this.hasPinned,
      this.numPinnedColumn,
      this.minCellWidth,
      this.formatter ?? this.defaultFormatter,
      this.onToggleCollapse,
      this.customCellCallBack
    );
  }

  withCustomRender(customCellCallBack?: CustomCellCallBack): BodyControllerBuilder {
    this.customCellCallBack = customCellCallBack;
    return this;
  }

  private defaultFormatter(rowData: RowData, header: HeaderData): string {
    const rawData = RowDataUtils.getData(rowData, header) ?? '--';
    const canApplyFormat = !header.isGroupBy;
    if (canApplyFormat) {
      return header.isTextLeft ? rawData : StringUtils.formatDisplayNumber(rawData);
    } else {
      return rawData;
    }
  }
}
