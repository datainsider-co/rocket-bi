/*
 * @author: tvc12 - Thien Vi
 * @created: 6/9/21, 1:59 PM
 */

import PaginationComponent from '@chart/Table/Pagination.vue';
import { WidgetRenderer } from '@chart/WidgetRenderer/WidgetRenderer';
import TableHeader from '@chart/Table/TableHeader.vue';
import PivotTable from '@chart/Table/PivotTable/PivotTable';

export class CustomPivotTableRenderer implements WidgetRenderer<PivotTable> {
  render(widget: PivotTable, h: any): any {
    return (
      <div key={widget.containerId} class={widget.tableChartContainerClass} ref="divTableChart" style={widget.tableStyle}>
        <TableHeader {...{ props: widget.headerProps }} />
        <div class="table-chart-table-content" ref="tableContent">
          <div id={widget.nprocessParentId} class="h-100">
            <div id={widget.renderController.containerId} class="w-100 h-100" />
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
