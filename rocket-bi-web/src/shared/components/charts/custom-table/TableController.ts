/*
 * @author: tvc12 - Thien Vi
 * @created: 5/14/21, 11:14 AM
 */

import { BodyRowData, TableBodyRenderEngine } from '@chart/custom-table/body/TableBodyRenderEngine';
import { FooterCellData, TableFooterRenderEngine } from '@chart/custom-table/footer/TableFooterRenderEngine';
import { HeaderData, IndexedHeaderData, RowData, RowDataUtils, ViewPort } from '@/shared/models';
import { TableHeaderRenderEngine } from '@chart/custom-table/header/TableHeaderRenderEngine';
import { HeaderController, HeaderRowData } from '@chart/custom-table/header/HeaderController';
import { HeaderControllerBuilder } from '@chart/custom-table/header/HeaderControllerBuilder';
import { SortDirection } from '@core/common/domain/request';
import { BodyController } from '@chart/custom-table/body/BodyController';
import { BodyControllerBuilder } from '@chart/custom-table/body/BodyControllerBuilder';
import { FooterController } from '@chart/custom-table/footer/FooterController';
import { CustomCellCallBack } from '@chart/custom-table/TableData';
import { TableExtraData } from '@chart/custom-table/TableExtraData';
import { HighchartUtils, MetricNumberMode, StringUtils } from '@/utils';
import { NumberFormatter, RangeData } from '@core/common/services';
import { get, toNumber } from 'lodash';
import { Log } from '@core/utils';
import { TableFieldFormatterUtils } from '@chart/table/default-table/style/TableFieldFormatterUtils';

export interface TableProperties {
  rows: RowData[];
  mainHeaders: IndexedHeaderData[];
  headers: IndexedHeaderData[];
  headerCellHeight: number;
  cellHeight: number;
  cellWidth: number;
  toggleCollapse: (rowData: RowData, rowIndex: number, header: HeaderData, columnIndex: number) => void;
  sortAsMap: Map<string, SortDirection>;
  emitOnSortChanged: (header: HeaderData) => void;
  hasPinned: boolean;
  numPinnedColumn: number;
  customCellCallBack?: CustomCellCallBack;
  extraData: TableExtraData;
  disableSort: boolean;
}

export class TableController {
  private headerController!: HeaderController;
  private bodyController!: BodyController;
  private bodyRenderEngine!: TableBodyRenderEngine;
  private footerRenderEngine!: TableFooterRenderEngine;
  private footerController!: FooterController;

  init(tableData: TableProperties) {
    const {
      mainHeaders,
      rows,
      toggleCollapse,
      cellHeight,
      headerCellHeight,
      cellWidth,
      headers,
      sortAsMap,
      emitOnSortChanged,
      hasPinned,
      numPinnedColumn,
      customCellCallBack,
      extraData,
      disableSort
    } = tableData;
    this.bodyRenderEngine = new TableBodyRenderEngine();
    this.footerRenderEngine = new TableFooterRenderEngine();
    this.headerController = new HeaderControllerBuilder()
      .withCellInfo(cellWidth, headerCellHeight)
      .withHeaderData(headers, mainHeaders)
      .withRowData(rows)
      .withSortData(sortAsMap, emitOnSortChanged)
      .withPinnedData(hasPinned, numPinnedColumn)
      .withCustomRender(customCellCallBack)
      .withDisableSort(disableSort)
      .build();

    this.bodyController = new BodyControllerBuilder()
      .withFormatter(this.getBodyFormatter(extraData))
      .withTableData(mainHeaders, rows)
      .withMinCellWidth(cellWidth)
      .withPinnedData(hasPinned, numPinnedColumn)
      .withToggleCollapseEvent(toggleCollapse)
      .withCustomRender(customCellCallBack)
      .build();
    this.footerController = new FooterController(
      mainHeaders,
      cellWidth,
      hasPinned,
      numPinnedColumn,
      this.getFooterFormatter(extraData),
      extraData,
      customCellCallBack
    );
  }

  renderFooter(viewPort: ViewPort): any {
    const cellData: FooterCellData[] = this.footerController.getFooterCellData(viewPort);
    return this.footerRenderEngine.renderFooter(cellData);
  }

  renderBody(viewPort: ViewPort): HTMLElement {
    const listCellData: BodyRowData[] = this.bodyController.getListRowData(viewPort);
    return this.bodyRenderEngine.renderBody(listCellData);
  }

  renderHeader(viewport: ViewPort): HTMLElement {
    const listCellData: HeaderRowData[] = this.headerController.getAllHeaderRowData(viewport);
    return TableHeaderRenderEngine.renderHeaders(listCellData);
  }

  private getBodyFormatter(extraData: TableExtraData) {
    return (rowData: RowData, header: HeaderData) => {
      const rawData = RowDataUtils.getData(rowData, header) ?? '--';
      const canApplyFormat = !header.isGroupBy;
      if (canApplyFormat) {
        if (header.isTextLeft || header.disabledFormatBodyCell) {
          return rawData;
        } else {
          const fieldFormatter = TableFieldFormatterUtils.getFieldFormatterContainsHeaderKey(header, extraData.fieldFormatting ?? {});
          const fieldFormatDisplayUnit: MetricNumberMode | undefined = fieldFormatter?.displayUnit;
          const generalDisplayUnit = extraData.plotOptions?.table?.dataLabels?.displayUnit;
          const fieldFormatPrecision: number | undefined = fieldFormatter?.precision;
          const generalPrecision = extraData.precision;
          const displayUnit = fieldFormatDisplayUnit ?? generalDisplayUnit ?? MetricNumberMode.None;
          const precision = fieldFormatPrecision ?? generalPrecision;
          const thousandSep = extraData.thousandSep;
          const decimalPoint = extraData.decimalPoint;
          return this.numberFormatter(rawData, displayUnit, precision, decimalPoint, thousandSep);
        }
      } else {
        return rawData;
      }
    };
  }

  private getFooterFormatter(extraData: TableExtraData) {
    return (header: IndexedHeaderData) => {
      const isFirstColumn = header.columnIndex == 0;
      if (isFirstColumn || header.disabledFormatFooterCell) {
        return extraData.total?.label?.text ?? 'Total';
      } else {
        const fieldFormatter = TableFieldFormatterUtils.getFieldFormatterContainsHeaderKey(header, extraData.fieldFormatting ?? {});
        const fieldFormatDisplayUnit: MetricNumberMode | undefined = fieldFormatter?.displayUnit;
        const generalDisplayUnit = extraData.plotOptions?.table?.dataLabels?.displayUnit;
        const fieldFormatPrecision: number | undefined = fieldFormatter?.precision;
        const generalPrecision = extraData.precision;
        const displayUnit = fieldFormatDisplayUnit ?? generalDisplayUnit ?? MetricNumberMode.None;
        const precision = fieldFormatPrecision ?? generalPrecision;
        const thousandSep = extraData.thousandSep;
        const decimalPoint = extraData.decimalPoint;
        return this.numberFormatter(header.total, displayUnit, precision, decimalPoint, thousandSep);
      }
    };
  }

  private numberFormatter(rawData: any, displayUnit: MetricNumberMode, precision?: number, decimalPoint?: string, thousandSep?: string): string {
    const newMetricNumber: string[] | undefined = HighchartUtils.toMetricNumbers(displayUnit);
    const ranges: RangeData[] | undefined = HighchartUtils.buildRangeData(newMetricNumber);
    const numberFormatter = new NumberFormatter(ranges, precision, decimalPoint, thousandSep);
    const num: number = toNumber(rawData);
    return isNaN(num) ? rawData : numberFormatter.format(num);
  }
}
