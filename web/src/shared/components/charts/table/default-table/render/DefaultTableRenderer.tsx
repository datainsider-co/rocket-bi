/*
 * @author: tvc12 - Thien Vi
 * @created: 6/9/21, 1:59 PM
 */

import PaginationComponent from '@chart/table/Pagination.vue';
import DefaultTable from '@chart/table/default-table/DefaultTable';
import { WidgetRenderer } from '@chart/widget-renderer/WidgetRenderer';
import CustomTable from '@chart/custom-table/CustomTable.vue';
import TableHeader from '@chart/table/TableHeader.vue';

export class DefaultTableRenderer implements WidgetRenderer<DefaultTable> {
  render(widget: DefaultTable, h: any): any {
    return (
      <div key={widget.tableChartTempId} class="table-chart-container" ref="divTableChart" oncontextmenu={widget.handleOnRightClick} style={widget.tableStyle}>
        <TableHeader {...{ props: widget.headerProps }} />
        <div class="table-chart-table-content" ref="tableContent">
          <div id={widget.nprocessParentId}>
            <CustomTable class="table-grid" ref={'table'} {...{ props: widget.tableProps }} onSortChanged={widget.handleSortChanged} />
          </div>
        </div>
        {!widget.disablePagination && (
          <PaginationComponent
            ref="refPaginationComponent"
            {...{ props: widget.paginationProps }}
            // @ts-ignore
            onPageChanged={widget.onPageChanged}
            onPerPageChanged={widget.perPageChanged}
          />
        )}
      </div>
    );
  }
}
