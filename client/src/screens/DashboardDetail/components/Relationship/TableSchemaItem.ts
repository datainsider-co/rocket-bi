import { Component, Prop, Watch } from 'vue-property-decorator';
import Konva from 'konva';
import { Log } from '@core/utils';
import { PRIMARY_COLOR } from '@/screens/DataCook/components/ManageEtlOperator/constance';
import { TablePosition } from '@core/DataRelationship';
import { Column, ColumnType, TableSchema } from '@core/domain';
import DiagramItem from '@/screens/DataCook/components/DiagramPanel/DiagramItem.vue';
import { IconUtils, TimeoutUtils } from '@/utils';
import { cloneDeep } from 'lodash';
import { DiagramEvent } from '@/screens/DataCook/components/DiagramPanel/DiagramEvent';
import { LLConnection } from '@/screens/DashboardDetail/components/Relationship/RelationshipEditor.ctrl';
import { KonvaNodeEvent } from 'konva/types/types';
import { StringUtils } from '@/utils/string.utils';

@Component({})
export default class TableSchemaItem extends DiagramItem {
  private isExpanded = false;

  @Prop({ type: Object, required: true })
  tableSchema!: TableSchema;

  @Prop()
  private position!: TablePosition;

  @Prop({ required: false, default: [] })
  private relatedColumns!: Column[];

  private columnId(dbName: string, tblName: string, colName: string) {
    return [dbName, tblName, colName].join('_');
  }

  public hideTable() {
    this.isExpanded = false;
  }

  public expand() {
    this.isExpanded = true;
  }

  private get columns(): Column[] {
    const result: Column[] = [];
    this.tableSchema.columns.map(col => {
      if (StringUtils.toSnakeCase(col.name).includes('id') || this.isExpanded || (!this.isExpanded && this.isRelatedColumn(col))) {
        result.push(col);
      }
    });
    return result;
  }

  private isRelatedColumn(column: Column): boolean {
    const foundColumn = this.relatedColumns.find(col => col.name === column.name);
    return foundColumn ? true : false;
  }

  protected draw(): Konva.Group {
    const paddingX = 12;
    const headerHeight = 38;
    const rowHeight = 38;
    const cornerRadius = 4;
    const fontSize = 14;
    const lineHeight = 21;
    const textColor = '#4f4f4f';
    const hoverColor = '#f9faff';
    const btnSize = 24;

    const charWidth = 8;
    const databaseLabel = this.tableSchema.dbName || '<<noname>>';
    const databaseLabelWidth = databaseLabel.length * charWidth + paddingX * 2;
    const tableLabel = this.tableSchema.name || '<<noname>>';
    const tableLabelWidth = tableLabel.length * charWidth + 22 + paddingX * 2;
    const width = 209;
    const height = (this.columns.length + 1) * rowHeight;

    const x: number = this.position.left ?? 0;
    const y: number = this.position.top ?? 0;

    const group = new Konva.Group({
      id: this.id,
      draggable: this.draggable,
      x,
      y,
      width: width + btnSize / 2
    });

    const grpTableInfo = new Konva.Group({
      x: 0,
      y: 0
    });

    const rectContainer = new Konva.Rect({
      x: 0,
      y: rowHeight,
      width,
      height: height,
      cornerRadius,
      fill: '#fff',
      strokeEnabled: false,
      strokeWidth: 1,
      stroke: PRIMARY_COLOR,
      shadowBlur: 8,
      shadowColor: 'rgba(0,0,0,0.1)',
      shadowOffset: {
        x: 0,
        y: 2
      }
    });

    group.add(rectContainer);

    const rectDb = new Konva.Rect({
      x: 0,
      y: 0,
      width,
      height: 0
    });

    const txtDbName = new Konva.Text({
      x: paddingX,
      y: 8,
      width: width - paddingX * 2,
      height: headerHeight,
      verticalAlign: 'middle',
      text: databaseLabel,
      fontSize,
      lineHeight,
      fontStyle: 'bold',
      fontFamily: '"Roboto", sans-serif',
      fill: textColor,
      wrap: 'none',
      ellipsis: true
    });

    const rctTable = new Konva.Rect({
      x: 0,
      y: rowHeight,
      width,
      height: rowHeight,
      fill: '#f2f2f7',
      cornerRadius: [cornerRadius, cornerRadius, 0, 0]
    });

    const tableIconSize = 14;
    const tableIconWidth = tableIconSize + 8;

    //todo: update render rect column add to group to get position at connector
    this.columns.forEach((col, index) => {
      const rectColumn = new Konva.Group({
        id: this.columnId(this.tableSchema.dbName, this.tableSchema.name, col.name),
        x: 0,
        y: rowHeight * (index + 2),
        width,
        height: rowHeight
      });

      const img: HTMLImageElement = document.createElement('img');
      img.src = IconUtils.getSVGIconByColumnType(col.className);
      const columnIconContainer = new Konva.Group({
        x: paddingX,
        y: 0,
        width: tableIconWidth,
        height: rowHeight,
        fontSize,
        lineHeight,
        verticalAlign: 'middle'
      });

      const columnIcon = new Konva.Image({
        x: 0,
        y: rowHeight / 2 - 16 / 2,
        width: 16,
        height: 16,
        verticalAlign: 'middle',
        fontSize,
        image: img
      });
      columnIconContainer.add(columnIcon);
      const txtColumnName = new Konva.Text({
        x: paddingX + tableIconWidth,
        y: 0,
        width: width - paddingX * 2 - tableIconWidth,
        height: rowHeight,
        verticalAlign: 'middle',
        text: col.name,
        fontSize,
        lineHeight,
        fontFamily: '"Roboto", sans-serif',
        fill: this.isRelatedColumn(col) ? PRIMARY_COLOR : textColor,
        wrap: 'none',
        ellipsis: true
      });
      const borderBottom = new Konva.Line({
        points: [0.5, rowHeight - 0.1, width - 0.5, rowHeight],
        stroke: '#f2f2f7',
        strokeWidth: 1,
        lineJoin: 'round',
        // fill: '#fff',
        closed: true
      });

      const transparentLayer = new Konva.Rect({
        draggable: true,
        x: 0,
        y: 0,
        width,
        height: rowHeight,
        fill: 'transparent',
        table: this.tableSchema,
        column: col,
        dragBoundFunc: function(pos) {
          return {
            x: this.absolutePosition().x,
            y: this.absolutePosition().y
          };
        }
      });

      rectColumn.add(borderBottom);
      rectColumn.add(columnIconContainer);
      rectColumn.add(txtColumnName);
      rectColumn.add(transparentLayer);
      group.add(rectColumn);

      transparentLayer.on('mouseover', () => {
        if (this.stage) {
          this.stage.container().style.cursor = 'drag';
          txtColumnName.fill(PRIMARY_COLOR);
        }
      });
      transparentLayer.on('mouseleave', () => {
        if (this.stage) {
          this.stage.container().style.cursor = 'grab';
          const color = this.isRelatedColumn(col) ? PRIMARY_COLOR : textColor;
          txtColumnName.fill(color);
        }
      });

      transparentLayer.on('dragmove', ev => {
        //prevent dragmove event on DiagramItem, avoid redraw connector
        ev.cancelBubble = true;
        this.$emit('draggingColumn', transparentLayer.attrs?.table, transparentLayer.attrs?.column);
      });

      transparentLayer.on('dragend', async ev => {
        // ev.cancelBubble = true

        this.$emit('endDraggingColumn');
        await TimeoutUtils.sleep(100);
        const pos = this.stage?.getPointerPosition() ?? { x: 0, y: 0 };
        const shape = this.layer?.getIntersection(pos);
        if (shape && shape.attrs.table && shape.attrs.column) {
          this.$emit('createConnector', {
            fromTable: transparentLayer.attrs.table,
            fromColumn: transparentLayer.attrs.column,
            toTable: shape.attrs.table,
            toColumn: shape.attrs.column
          } as LLConnection);
        }
      });
    });

    const txtTableName = new Konva.Text({
      x: paddingX,
      y: headerHeight,
      width: width - paddingX * 2,
      height: rowHeight,
      verticalAlign: 'middle',
      text: tableLabel,
      fontSize,
      lineHeight,
      fontFamily: '"Roboto", sans-serif',
      fill: textColor,
      wrap: 'none',
      ellipsis: true
    });

    const btnAction = new Konva.Group({
      x: width - 32,
      y: rowHeight / 2 - btnSize / 2 + rowHeight,
      width: btnSize,
      height: btnSize
    });

    const circle = new Konva.Circle({
      x: btnAction.width() / 2,
      y: btnAction.height() / 2,
      fill: 'transparent',
      radius: btnSize / 2
    });

    const txtButtonIcon = new Konva.Text({
      x: 0,
      y: 0,
      width: btnAction.width(),
      height: btnAction.height(),
      verticalAlign: 'middle',
      align: 'center',
      text: String.fromCharCode(parseInt('e925', 16)),
      fontSize: 14,
      lineHeight,
      fontFamily: 'data-insider-icon',
      fill: textColor
    });

    btnAction.add(circle);
    btnAction.add(txtButtonIcon);

    // grpTableInfo.add(rectContainer);
    // grpTableInfo.add(rectBorder);
    grpTableInfo.add(rectDb);
    grpTableInfo.add(rctTable);
    grpTableInfo.add(txtDbName);
    grpTableInfo.add(txtTableName);

    group.add(grpTableInfo);

    btnAction.on('click', e => {
      // this.isExpanded = !this.isExpanded;
      this.$emit('showAction', this.tableSchema, this.isExpanded, e);
    });
    group.add(btnAction);

    grpTableInfo.on('mouseover', () => {
      if (this.stage) {
        this.stage.container().style.cursor = 'move';
      }
    });
    grpTableInfo.on('mouseleave', () => {
      if (this.stage) {
        this.stage.container().style.cursor = 'grab';
      }
    });
    btnAction.on('mouseover', () => {
      if (this.stage) {
        this.stage.container().style.cursor = 'pointer';
        circle.fill(hoverColor);
      }
    });
    btnAction.on('mouseleave', () => {
      if (this.stage) {
        this.stage.container().style.cursor = 'grab';
        circle.fill('transparent');
      }
    });
    group.on('mouseover', () => {
      rectContainer.strokeEnabled(true);
      this.layer?.draw();
    });
    group.on('mouseleave', () => {
      rectContainer.strokeEnabled(false);
      this.layer?.draw();
    });

    group.on('dragmove', e => {
      e.cancelBubble = true;
      const isXChanged = e.target.getPosition().x !== this.position.left;
      const isYChanged = e.target.getPosition().y !== this.position.top;

      if (this.stage && (isXChanged || isYChanged)) {
        this.stage.fire(DiagramEvent.MoveItem, { id: this.id });
      }
    });

    group.on('dragend', () => {
      const pos = group.position();
      this.position.left = pos.x;
      this.position.top = pos.y;
      this.$emit('changePosition', this.tableSchema, new TablePosition(pos.x, pos.y));
    });

    return group;
  }

  @Watch('isExpanded')
  private async onCollapseTable() {
    await this.redraw();
  }

  public onPositionChanged(pos: TablePosition) {
    if (this.group && this.stage) {
      this.group.x(pos.left);
      this.group.y(pos.top);
      this.stage.fire(DiagramEvent.MoveItem, { id: this.id });
    }
  }
}
