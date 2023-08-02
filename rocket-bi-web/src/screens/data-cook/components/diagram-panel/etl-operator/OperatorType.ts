import DiagramItem from '../DiagramItem.vue';
import { Component, Inject, Prop, Watch } from 'vue-property-decorator';
import Konva from 'konva';
import { Log } from '@core/utils';
import { CheckProgressResponse, ETLOperatorType, ETL_OPERATOR_TYPE_NAME, EtlOperator, JOIN_TYPE_NAME, JoinOperator, Position } from '@core/data-cook';
import { ERROR_COLOR, FONT_FAMILY, ACCENT_COLOR, TEXT_COLOR, TEXT_SIZE } from '@/screens/data-cook/components/manage-etl-operator/Constance';
import { DiagramEvent } from '@/screens/data-cook/components/diagram-panel/DiagramEvent';
import { ListUtils } from '@/utils';

const STROKE_COLOR = '#505050';

@Component({})
export default class OperatorType extends DiagramItem {
  private rhombus: Konva.Line | null = null;
  private txtOperatorName: Konva.Text | null = null;

  @Prop({ type: Object, required: true })
  private operator!: EtlOperator;

  @Prop({ type: Boolean, default: false })
  private readonly isError!: boolean;

  @Inject() protected readonly getOperatorPosition!: (operator: EtlOperator) => Position | null;
  @Inject() protected readonly setOperatorPosition!: (operator: EtlOperator, position: Position) => void;
  @Inject() protected readonly getPreviewEtlResponse!: (operator: EtlOperator) => CheckProgressResponse | null;

  private get operatorName() {
    switch (this.operator?.className) {
      case ETLOperatorType.JoinOperator:
        return JOIN_TYPE_NAME[(this.operator as JoinOperator).joinConfigs[0].joinType];
      case ETLOperatorType.TransformOperator:
      case ETLOperatorType.ManageFieldOperator:
      case ETLOperatorType.PivotTableOperator:
      case ETLOperatorType.SQLQueryOperator:
      case ETLOperatorType.PythonOperator:
        return ETL_OPERATOR_TYPE_NAME[this.operator?.className];
      default:
        return '';
    }
  }

  protected draw(): Konva.Group {
    const width = 120;
    const height = 76;
    const offsetTop = 4;

    const position = this.getOperatorPosition(this.operator);
    const x: number = parseFloat((position?.left || '0px').replace('px', ''));
    const y: number = parseFloat((position?.top || '0px').replace('px', ''));

    const group = new Konva.Group({
      id: this.id,
      draggable: true,
      x,
      y,
      width,
      height
    });
    const rhombusBg = new Konva.Line({
      points: [0, height / 2, width / 2, 0, width / 2, 0, width, height / 2, width, height / 2, width / 2, height],
      strokeWidth: 0,
      lineJoin: 'round',
      fill: '#fff',
      closed: true
    });

    this.rhombus = new Konva.Line({
      points: [0, height / 2, width / 2, 0, width / 2, 0, width, height / 2, width, height / 2, width / 2, height],
      stroke: STROKE_COLOR,
      strokeWidth: 1,
      lineJoin: 'round',
      // fill: '#fff',
      closed: true
    });
    this.txtOperatorName = new Konva.Text({
      y: offsetTop,
      width,
      height: height - offsetTop,
      verticalAlign: 'middle',
      align: 'center',
      text: this.operatorName,
      fill: TEXT_COLOR,
      fontSize: TEXT_SIZE,
      fontFamily: FONT_FAMILY,
      lineHeight: 1.2,
      padding: 10
    });

    group.add(rhombusBg);
    group.add(this.txtOperatorName);
    group.add(this.rhombus);

    this.rhombus.on('mouseover', () => {
      if (this.stage) {
        this.stage.container().style.cursor = 'move';
      }
      this.rhombus?.stroke(ACCENT_COLOR);
      this.layer?.draw();
    });
    this.rhombus.on('mouseleave', () => {
      if (this.stage) {
        this.stage.container().style.cursor = 'grab';
      }
      if (this.isError) {
        this.rhombus?.stroke(ERROR_COLOR);
      } else {
        this.rhombus?.stroke(STROKE_COLOR);
      }
      this.layer?.draw();
    });

    this.rhombus.on('click touchend', e => {
      this.$emit('click', e);
      Log.info('group:click', e);
    });

    group.on('dragend', () => {
      Log.info('dragend', group.x(), group.y());
      const pos = group.position();
      this.setOperatorPosition(this.operator, new Position(pos.y.toString() + 'px', pos.x.toString() + 'px'));
    });

    return group;
  }

  @Watch('isError')
  private handlePreviewResponse() {
    if (this.isError) {
      this.rhombus?.stroke(ERROR_COLOR);
      // this.stage?.fire(DiagramEvent.ChangeConnectorColor, { id: this.id, color: ERROR_COLOR });
    } else {
      this.rhombus?.stroke(STROKE_COLOR);
      // this.stage?.fire(DiagramEvent.ChangeConnectorColor, { id: this.id, color: PRIMARY_COLOR });
    }
    this.layer?.draw();
  }

  @Watch('operatorName')
  private handleOperatorNameChanged() {
    Log.info('>>> handleOperatorNameChanged', this.operatorName);
    this.txtOperatorName?.setText(this.operatorName);
    this.layer?.draw();
  }
}
