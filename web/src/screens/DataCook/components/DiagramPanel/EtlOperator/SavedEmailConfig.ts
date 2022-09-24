import DiagramItem from '../DiagramItem.vue';
import { Component, Inject, Prop, Watch } from 'vue-property-decorator';
import Konva from 'konva';
import { Log } from '@core/utils';
import { EtlOperator, Position, SendToGroupEmailOperator } from '@core/DataCook';
import { PRIMARY_COLOR } from '@/screens/DataCook/components/ManageEtlOperator/constance';
import { ListUtils } from '@/utils';
import { DiagramEvent } from '@/screens/DataCook/components/DiagramPanel/DiagramEvent';

export interface DragPosition {
  x: number;
  y: number;
  width: number;
  height: number;
}

@Component({})
export default class SavedEmailConfig extends DiagramItem {
  @Prop({ type: Object, required: true })
  public readonly operator!: EtlOperator;

  @Inject() protected readonly getTablePosition!: (operator: EtlOperator) => Position | null;
  @Inject() protected readonly getSavedEmailConfigPosition!: (operator: EtlOperator) => Position | null;
  @Inject() protected readonly setSavedEmailConfigPosition!: (operator: EtlOperator, position: Position) => void;
  @Inject() protected readonly handleMergeEmailConfig!: (operator: EtlOperator, dragPosition: DragPosition) => void;

  private txtDatabaseName: Konva.Text | null = null;
  private txtTableName: Konva.Text | null = null;
  private errorMsg = '';
  private rectContainer: Konva.Rect | null = null;

  protected async drawAsync(): Promise<Konva.Group> {
    const MAX_WIDTH = 350;
    const height = 52;
    const paddingX = 10;
    const headerHeight = 36;
    const cornerRadius = 4;
    const fontSize = 14;
    const textColor = '#4f4f4f';
    const btnSize = 18;

    const charWidth = 8;
    const dbIconWidth = 52;
    const dbIconFontSize = 30;
    const databaseLabel = 'Email subject';
    const etlOperator = this.operator as SendToGroupEmailOperator;
    const tableLabel = etlOperator?.subject || this.operator.emailConfiguration?.subject || '<<no subject>>';

    const databaseLabelWidth = dbIconWidth + databaseLabel.length * charWidth + paddingX * 2;
    const tableLabelWidth = dbIconWidth + tableLabel.length * charWidth + 22 + paddingX * 2;
    const width = Math.min(MAX_WIDTH, Math.max(140, tableLabelWidth, databaseLabelWidth));
    const txtTableNameY = 30;

    const position = this.getSavedEmailConfigPosition(this.operator);
    let x = 0;
    let y = 0;

    if (!position) {
      const tablePosition = this.getTablePosition(this.operator);
      x = 200 + parseFloat((tablePosition?.left || '0').replace('px', ''));
      y = 80 + parseFloat((tablePosition?.top || '0').replace('px', ''));
    } else {
      x = parseFloat((position?.left || '0').replace('px', ''));
      y = parseFloat((position?.top || '0').replace('px', ''));
    }

    const group = new Konva.Group({
      id: this.id,
      draggable: true,
      x: x,
      y: y,
      width: width + btnSize / 2,
      height,
      listening: true
    });

    this.rectContainer = new Konva.Rect({
      x: 0,
      y: 0,
      width,
      height,
      cornerRadius,
      fill: '#fff',
      strokeEnabled: false,
      strokeWidth: 2,
      stroke: PRIMARY_COLOR,
      shadowBlur: 8,
      shadowColor: 'rgba(0,0,0,0.1)',
      shadowOffset: {
        x: 0,
        y: 2
      }
    });

    const txtDatabaseIcon = new Konva.Text({
      x: 0,
      y: 0,
      width: dbIconWidth,
      height,
      verticalAlign: 'middle',
      align: 'center',
      text: String.fromCharCode(parseInt('e956', 16)),
      fontSize: dbIconFontSize,
      lineHeight: 1,
      fontFamily: 'data-insider-icon',
      fill: '#6c757d'
    });

    const rectDb = new Konva.Rect({
      x: 0,
      y: 0,
      width: dbIconWidth,
      height: height,
      fill: '#f2f2f7',
      cornerRadius: [cornerRadius, 0, 0, cornerRadius]
    });

    const rctInfo = new Konva.Rect({
      x: rectDb.width(),
      y: 0,
      width: width - rectDb.width(),
      height: height,
      fill: '#fff',
      cornerRadius: [0, cornerRadius, cornerRadius, 0]
    });

    this.txtDatabaseName = new Konva.Text({
      x: rectDb.width() + paddingX,
      y: 0,
      width: width - paddingX * 2,
      height: headerHeight,
      verticalAlign: 'middle',
      text: databaseLabel,
      fontSize,
      fontStyle: 'bold',
      fontFamily: '"Roboto", sans-serif',
      fill: textColor,
      wrap: 'none',
      ellipsis: true
    });

    this.txtTableName = new Konva.Text({
      x: rectDb.width() + paddingX,
      y: txtTableNameY,
      width: width - rectDb.width() - paddingX,
      height: height / 2,
      text: tableLabel,
      fontSize,
      fontFamily: '"Roboto", sans-serif',
      fill: textColor,
      wrap: 'none',
      ellipsis: true
    });

    group.add(this.rectContainer);
    group.add(rectDb);
    group.add(txtDatabaseIcon);
    group.add(rctInfo);
    group.add(this.txtDatabaseName);
    group.add(this.txtTableName);
    group.on('mouseover', () => {
      if (this.stage) {
        this.stage.container().style.cursor = 'move';
      }
      this.showBorder();
    });
    group.on('mouseleave', () => {
      if (this.stage) {
        this.stage.container().style.cursor = 'grab';
      }
      this.hideBorder();
    });
    group.on('dragstart', e => {
      group.setZIndex(1000);
    });
    group.on('click touchend', e => {
      group.setZIndex(1000);
      this.$emit('click', e);
    });
    group.on('dragend', () => {
      Log.info('dragend', group.x(), group.y());
      const pos = group.position();
      const newPosition: Position = Position.fromXY(pos.x, pos.y);
      this.setSavedEmailConfigPosition(this.operator, newPosition);
      this.handleMergeEmailConfig(this.operator, {
        y: group.y(),
        x: group.x(),
        height: group.height(),
        width: group.width()
      });
    });

    return group;
  }

  isSameOperator(operator: EtlOperator) {
    return this.operator == operator;
  }

  isOverlap(comparePosition: DragPosition) {
    if (this.group) {
      const isNotOverlapFromRight: boolean = comparePosition.x > this.group.x() + this.group.width();
      const isNotOverlapFromLeft: boolean = comparePosition.x + comparePosition.width < this.group.x();
      const isNotOverlapFromBottom: boolean = comparePosition.y > this.group.y() + this.group.height();
      const isNotOverlapFromTop: boolean = comparePosition.y + comparePosition.height < this.group.y();
      return !(isNotOverlapFromLeft || isNotOverlapFromRight || isNotOverlapFromBottom || isNotOverlapFromTop);
    } else {
      return false;
    }
  }

  @Watch('operator.subject')
  onSubjectChanged() {
    this.redraw();
  }

  showBorder() {
    if (this.rectContainer && this.layer && !this.rectContainer.strokeEnabled()) {
      this.rectContainer.strokeEnabled(true);
      this.layer.draw();
    }
  }

  hideBorder() {
    if (this.rectContainer && this.layer && this.rectContainer.strokeEnabled()) {
      this.rectContainer.strokeEnabled(false);
      this.layer.draw();
    }
  }

  protected onDragMove() {
    if (this.stage) {
      this.stage.fire(DiagramEvent.MoveItem, { id: this.id });
    }
    if (this.group) {
      this.$emit('dragmove', this, {
        x: this.group.x(),
        y: this.group.y(),
        width: this.group.width(),
        height: this.group.height()
      });
    }
  }
}
