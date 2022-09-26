/*
 * @author: tvc12 - Thien Vi
 * @created: 6/9/21, 1:59 PM
 */

import PaginationComponent from '@chart/Table/Pagination.vue';
import DefaultTable from '@chart/Table/DefaultTable/DefaultTable';
import { WidgetRenderer } from '@chart/WidgetRenderer/WidgetRenderer';
import CustomTable from '@chart/CustomTable/CustomTable.vue';
import TableHeader from '@chart/Table/TableHeader.vue';

export class DefaultTableRenderer implements WidgetRenderer<DefaultTable> {
  render(widget: DefaultTable, h: any): any {
    return (
      <div key={widget.tableChartTempId} class={widget.tableChartContainerClass} ref="divTableChart" style={widget.tableStyle}>
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
