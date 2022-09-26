/*
 * @author: tvc12 - Thien Vi
 * @created: 5/5/21, 4:11 PM
 */

import PaginationComponent from '@chart/Table/Pagination.vue';
import { WidgetRenderer } from '@chart/WidgetRenderer/WidgetRenderer';
import CustomTable from '@chart/CustomTable/CustomTable.vue';
import PivotTable from '@chart/Table/PivotTable/PivotTable';
import TableHeader from '@chart/Table/TableHeader.vue';

export class PivotTableRenderer implements WidgetRenderer<PivotTable> {
  render(widget: PivotTable, h: any): any {
    return (
      <div key={widget.tableChartTempId} class={widget.tableChartContainerClass} ref="divTableChart" style={widget.tableStyle}>
        <TableHeader {...{ props: widget.headerProps }} />
        <div class="table-chart-table-content" ref="tableContent">
          <div id={widget.nprocessParentId}>
            <CustomTable class="table-grid" ref={'table'} {...{ props: widget.tableProps }} onSortChanged={widget.handleSortChanged} />
          </div>
        </div>
        <PaginationComponent
          ref="refPaginationComponent"
          {...{ props: widget.paginationProps }}
          onPageChanged={widget.onPageChanged}
          onPerPageChanged={widget.perPageChanged}
        />
      </div>
    );
  }
}
