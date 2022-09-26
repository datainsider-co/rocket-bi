import { Component, Vue, Inject, Prop, Watch } from 'vue-property-decorator';

// @ts-ignore
import Draggabilly from 'draggabilly';
import { IconUtils } from '@/utils';
import { Log } from '@core/utils';
import LeaderLine from 'leader-line-new';
import { Column, TableSchema } from '@core/domain';
import { TrackEvents } from '@core/tracking/enum/TrackEvents';
import { Track } from '@/shared/anotation';
import { Position } from 'draggabilly';
import { isEqual } from 'lodash';
import { TablePosition } from '@core/DataRelationship';

const DROP_TYPE = 'drop_column';
const DATA_TRANSFER_KEY = {
  Type: 'type',
  DatabaseName: 'database_name',
  TableName: 'table_name',
  ColumnName: 'column_name',
  ColumnElementId: 'column_element_id'
};
const $ = window.$;

type LLConnection = LeaderLine & {
  $el: HTMLElement;
  fromTable: TableSchema;
  fromColumn: Column;
  toTable: TableSchema;
  toColumn: Column;
};

export enum TableItemMode {
  Edit = 'edit',
  View = 'view'
}

@Component
export default class TableItem extends Vue {
  private readonly trackEvents = TrackEvents;

  private connections: LLConnection[] = [];
  // private leaderLineTransform = { x: 0, y: 0 };
  private draggie!: Draggabilly;
  private collapsed = true;
  private draggingEl!: HTMLElement;
  private draggingLL!: LeaderLine;

  @Prop()
  private table: TableSchema | undefined;

  @Prop({ default: TableItemMode.View })
  private mode!: TableItemMode;

  @Prop()
  private highlight: boolean | undefined;

  @Prop()
  private loading: boolean | undefined;

  @Prop({ default: true, required: false })
  private isShowHideTableOption!: boolean;

  @Prop()
  private position!: TablePosition;

  @Inject() protected readonly getContainment?: Function;
  @Inject() protected readonly onNewConnection?: Function;
  @Inject() protected readonly offNewConnection?: Function;
  @Inject() protected readonly onRemoveConnection?: Function;
  @Inject() protected readonly offRemoveConnection?: Function;
  @Inject() protected readonly newConnection?: Function;
  @Inject() protected readonly getConnection?: Function;
  @Inject() protected readonly removeConnection?: Function;
  @Inject() protected readonly getColumnElId?: Function;
  @Inject() protected readonly findSchema?: Function;

  private hasConnection(column: Column): boolean {
    const foundConnection = this.connections.find(connection => {
      return (
        (connection.fromTable.name === this.table?.name && connection.fromTable.dbName === this.table?.dbName && isEqual(connection.fromColumn, column)) ||
        (connection.toTable.name === this.table?.name && connection.toTable.dbName === this.table?.dbName && isEqual(connection.toColumn, column))
      );
    });
    return foundConnection ? true : false;
  }

  private mounted() {
    if (this.table?.columns.length ?? 0 <= 15) this.collapsed = false;
    this.onNewConnection && this.onNewConnection(this.processNewConnection);
    this.onRemoveConnection && this.onRemoveConnection(this.processRemoveConnection);
    // console.log(LeaderLine);
    this.$nextTick(() => {
      const containment = this.getContainment ? this.getContainment() : null;
      // console.log(this.getContainment());
      this.draggie = new Draggabilly(this.$el, {
        containment,
        handle: '.table-name, .database-name'
      });
      const parentPos = $(containment).offset();
      const childPos = $(this.$el).offset();
      this.draggie.on('dragMove', (event, pointer, moveVector) => this.onDragTable(event, pointer, moveVector));
      this.initTransformStyle(containment);
      if (this.table) {
        $(this.$el).css({
          position: 'absolute',
          top: this.position.top,
          left: this.position.left
        });
      } else {
        setTimeout(() => {
          $(this.$el).css({
            position: 'absolute',
            top: childPos.top - parentPos.top,
            left: childPos.left - parentPos.left
          });
        }, 0);
      }
    });
  }

  private setPosition() {
    const containment = this.getContainment ? this.getContainment() : null;
    const parentPos = $(containment).offset();
    const childPos = $(this.$el).offset();
    this.$set(this.position, 'left', childPos.left - parentPos.left);
    this.$set(this.position, 'top', childPos.top - parentPos.top);
    this.$emit('positionChange');
  }

  @Watch('position')
  onPositionChanged(oldPosition: TablePosition, newPosition: TablePosition) {
    if (oldPosition.left !== newPosition.left && oldPosition.top !== newPosition.top) {
      $(this.$el).css({
        position: 'absolute',
        top: this.position.top,
        left: this.position.left
      });
    }
    this.connections.forEach(connection => {
      connection.position();
    });
  }

  private destroyed() {
    this.offNewConnection && this.offNewConnection(this.processNewConnection);
    this.offRemoveConnection && this.offRemoveConnection(this.processRemoveConnection);
    this.draggie.destroy();
    this.connections.forEach(c => {
      this.removeConnection && this.removeConnection(c);
    });
    this.connections = [];
  }

  private toggleCollapse() {
    this.collapsed = !this.collapsed;
    this.$nextTick(() => {
      this.processMoveTable();
    });
  }

  private initTransformStyle(containment: HTMLElement) {
    const rect = containment.getBoundingClientRect();
    containment.setAttribute('style', `--ll-translate-x: ${-rect.x}px; --ll-translate-y: ${-rect.y}px`);
  }

  private processNewConnection(newConnection: LLConnection) {
    if (newConnection.fromTable.name === this.table?.name || newConnection.toTable.name === this.table?.name) {
      this.connections.push(newConnection);
    }
  }

  private processRemoveConnection(connection: LLConnection) {
    Log.debug('processRemoveConnection', this.table?.name, connection, this.connections.length);
    this.connections = this.connections.filter(item => item !== connection);
    Log.debug(this.table?.name, this.connections.length);
  }

  @Track(TrackEvents.RelationshipRemoveTable, {
    table_name: (_: TableItem, args: any) => args[0]?.name,
    database_name: (_: TableItem, args: any) => args[0]?.dbName
  })
  private removeTable(table: TableSchema & TablePosition) {
    this.$emit('remove', table);
  }

  private calcSocketOption(startEl: Element, endEl: Element): LeaderLine.Options {
    const $startEl = $(startEl);
    const $endEl = $(endEl);
    let startSocket: 'left' | 'right' = 'left';
    let endSocket: 'left' | 'right' = 'left';
    const startLeft = $startEl.offset().left;
    const startWidth = $startEl.width();
    const endLeft = $endEl.offset().left;
    const endWidth = $endEl.width();

    if (startLeft + startWidth < endLeft) {
      startSocket = 'right';
      endSocket = 'left';
    } else if (endLeft + endWidth < startLeft) {
      startSocket = 'left';
      endSocket = 'right';
    }
    return {
      startSocket,
      endSocket
    };
  }

  private processMoveTable() {
    this.connections.forEach(connection => {
      const socketOption = this.calcSocketOption(connection.start as Element, connection.end as Element);
      connection.setOptions(socketOption);
      connection.position();
    });
  }

  private onDragTable(event: Event, pointer: MouseEvent | Touch, moveVector: Position) {
    this.$nextTick(() => {
      this.setPosition();
      this.processMoveTable();
    });
  }

  private onMouseMove(e: MouseEvent) {
    Log.info('onMouseMove', e, this.draggingEl);
    if (this.draggingEl) {
      $(this.draggingEl).css({
        position: 'fixed',
        top: e.clientY,
        left: e.clientX - 4,
        width: '2px',
        height: '2px',
        zIndex: 999999
      });
    }
  }

  private onDrag(e: DragEvent) {
    // Log.info('onDrag', e, this.draggingEl);
    if (this.draggingEl) {
      $(this.draggingEl).css({
        position: 'fixed',
        top: e.clientY,
        left: e.clientX - 4,
        width: '2px',
        height: '2px',
        zIndex: 999999
      });
    }
    if (this.draggingLL) {
      this.draggingLL.show();
      this.draggingLL.position();
    }
  }

  private onDragStart(e: DragEvent, column: Column) {
    const target = $(e.target).closest('.table-columns-item')[0];
    e.dataTransfer?.setData(DATA_TRANSFER_KEY.Type, DROP_TYPE);
    e.dataTransfer?.setData(DATA_TRANSFER_KEY.DatabaseName, this.table?.dbName as string);
    e.dataTransfer?.setData(DATA_TRANSFER_KEY.TableName, this.table?.name as string);
    e.dataTransfer?.setData(DATA_TRANSFER_KEY.ColumnName, column.name);
    e.dataTransfer?.setData(DATA_TRANSFER_KEY.ColumnElementId, target.id);

    this.draggingEl = document.createElement('span');
    this.draggingEl.innerHTML = '&nbsp;';
    // this.draggingEl.classList.add('di-icon-add');
    // Log.info('onDragStart', this.draggingEl);
    document.body.appendChild(this.draggingEl);
    // const img = document.createElement('img');
    // img.src = '/static/icons/upload@3x.png';
    e.dataTransfer?.setDragImage(this.draggingEl, 0, 0);
    this.draggingLL = new LeaderLine(target, this.draggingEl, {
      hide: true,
      size: 1,
      color: '#597fff',

      startPlug: 'disc',
      startPlugSize: 3,
      startPlugColor: 'rgba(0,0,0,0)',
      startPlugOutline: true,
      startPlugOutlineColor: '#597fff',
      startPlugOutlineSize: 1,

      endPlug: 'disc',
      endPlugSize: 3,
      endPlugColor: 'rgba(0,0,0,0)',
      endPlugOutline: true,
      endPlugOutlineColor: '#597fff',
      endPlugOutlineSize: 1,
      path: 'fluid'
    });
  }

  private onDragEnd() {
    if (this.draggingEl) {
      this.draggingEl.remove();
    }
    if (this.draggingLL) {
      this.draggingLL.remove();
    }
  }

  private onDragOver(e: DragEvent) {
    e.preventDefault();
    (e.target as HTMLElement).classList.add('hover');
  }

  private onDragLeave(e: DragEvent) {
    (e.target as HTMLElement).classList.remove('hover');
  }

  private makeConnectionId(srcId: string, destId: string) {
    return ['rel', srcId, destId].join('_');
  }

  private selectConnection(connection: LLConnection, e: MouseEvent) {
    Log.debug(connection);
    this.$emit('selectConnection', connection, e);
  }

  private onDrop(e: DragEvent, column: Column) {
    const target = $(e.target).closest('.table-columns-item')[0];
    const type = e.dataTransfer?.getData(DATA_TRANSFER_KEY.Type);
    target.classList.remove('hover');

    if (type !== DROP_TYPE) return;

    const srcDatabaseName = e.dataTransfer?.getData(DATA_TRANSFER_KEY.DatabaseName);
    const srcTableName = e.dataTransfer?.getData(DATA_TRANSFER_KEY.TableName);
    const srcColumnName = e.dataTransfer?.getData(DATA_TRANSFER_KEY.ColumnName);

    const foundData = this.findSchema ? this.findSchema(srcDatabaseName, srcTableName, srcColumnName) : {};

    const srcTable = foundData.table; //this.getTable(srcDatabaseName, srcTableName);
    const srcColumn = foundData.column; //this.getColumn(srcDatabaseName, srcTableName, srcColumnName);
    Log.debug('srcTable::', e);
    this.newConnection ? this.newConnection(srcTable, srcColumn, this.table, column) : null;
  }

  private getIcon(column: Column) {
    return IconUtils.getIconComponent(column);
  }
}
