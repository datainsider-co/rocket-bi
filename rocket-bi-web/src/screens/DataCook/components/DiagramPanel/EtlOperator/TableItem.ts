import DiagramItem from '../DiagramItem.vue';
import { Component, Inject, Prop, Watch } from 'vue-property-decorator';
import Konva from 'konva';
import { Log } from '@core/utils';
import { EtlOperator, Position } from '@core/DataCook';
import { PRIMARY_COLOR } from '@/screens/DataCook/components/ManageEtlOperator/constance';

const MAX_WIDTH = 300;

@Component({})
export default class TableItem extends DiagramItem {
  @Inject() protected readonly getTablePosition!: (operator: EtlOperator) => Position | null;
  @Inject() protected readonly setTablePosition!: (operator: EtlOperator, position: Position) => void;

  @Prop({ type: Object, required: true })
  private operator!: EtlOperator;

  protected draw(): Konva.Group {
    const height = 76;
    const paddingX = 12;
    const headerHeight = 38;
    const cornerRadius = 4;
    const fontSize = 14;
    const lineHeight = 21;
    const textColor = '#4f4f4f';
    const btnSize = 18;

    const charWidth = 8;
    const databaseLabel = this.operator?.destDatabaseDisplayName || '<<noname>>';
    const databaseLabelWidth = databaseLabel.length * charWidth + paddingX * 2;
    const tableLabel = this.operator?.destTableDisplayName || this.operator?.destTableName || '<<noname>>';
    const tableLabelWidth = tableLabel.length * charWidth + 22 + paddingX * 2;
    const width = Math.min(MAX_WIDTH, Math.max(140, tableLabelWidth, databaseLabelWidth));

    const position = this.getTablePosition(this.operator);
    const x: number = parseFloat((position?.left || '0').replace('px', ''));
    const y: number = parseFloat((position?.top || '0').replace('px', ''));

    const group = new Konva.Group({
      id: this.id,
      draggable: true,
      x,
      y,
      width: width + btnSize / 2,
      height
    });

    const grpTableInfo = new Konva.Group({
      x: 0,
      y: 0
    });

    const rectContainer = new Konva.Rect({
      x: 0,
      y: 0,
      width,
      height,
      cornerRadius,
      fill: '#f2f2f7',
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

    const rectDb = new Konva.Rect({
      x: 0,
      y: 0,
      width,
      height: height / 2,
      fill: '#f2f2f7',
      cornerRadius: [cornerRadius, cornerRadius, 0, 0]
    });

    const txtDbName = new Konva.Text({
      x: paddingX,
      y: 0,
      width: width - paddingX * 2,
      height: headerHeight,
      verticalAlign: 'middle',
      text: databaseLabel,
      fontSize,
      lineHeight,
      fontFamily: '"Roboto", sans-serif',
      fill: textColor,
      wrap: 'none',
      ellipsis: true
    });

    const rctTable = new Konva.Rect({
      x: 0,
      y: headerHeight,
      width,
      height: height - headerHeight,
      fill: '#fff',
      cornerRadius: [0, 0, cornerRadius, cornerRadius]
    });

    const tableIconSize = 14;
    const tableIconWidth = tableIconSize + 8;
    const txtTableIcon = new Konva.Text({
      x: paddingX,
      y: headerHeight,
      width: tableIconWidth,
      height: height - headerHeight,
      verticalAlign: 'middle',
      text: String.fromCharCode(parseInt('e94d', 16)),
      fontSize,
      lineHeight,
      fontFamily: 'data-insider-icon',
      fill: textColor
    });

    const txtTableName = new Konva.Text({
      x: paddingX + tableIconWidth,
      y: headerHeight,
      width: width - paddingX * 2 - tableIconWidth,
      height: height - headerHeight,
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
      x: width - btnSize / 2,
      y: height / 2 - btnSize / 2,
      width: btnSize,
      height: btnSize
    });

    const circle = new Konva.Circle({
      x: btnAction.width() / 2,
      y: btnAction.height() / 2,
      fill: 'rgb(89, 127, 255)',
      radius: btnSize / 2
    });

    const txtButtonIcon = new Konva.Text({
      x: 0,
      y: 0,
      width: btnAction.width(),
      height: btnAction.height(),
      verticalAlign: 'middle',
      align: 'center',
      text: String.fromCharCode(parseInt('e90c', 16)),
      fontSize: 9,
      lineHeight,
      fontFamily: 'data-insider-icon',
      fill: '#fff'
    });

    btnAction.add(circle);
    btnAction.add(txtButtonIcon);

    grpTableInfo.add(rectContainer);
    // grpTableInfo.add(rectBorder);
    grpTableInfo.add(rectDb);
    grpTableInfo.add(rctTable);
    grpTableInfo.add(txtDbName);
    grpTableInfo.add(txtTableIcon);
    grpTableInfo.add(txtTableName);

    group.add(grpTableInfo);
    group.add(btnAction);

    btnAction.on('click touchend', e => {
      this.$emit('click', e);
      Log.info('btnAction:click', e);
    });

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
      }
    });
    btnAction.on('mouseleave', () => {
      if (this.stage) {
        this.stage.container().style.cursor = 'grab';
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
    group.on('dragend', () => {
      Log.info('dragend', group.x(), group.y());
      const pos = group.position();
      this.setTablePosition(this.operator, new Position(pos.y.toString() + 'px', pos.x.toString() + 'px'));
    });

    return group;
  }

  @Watch('operator.destTableConfiguration.tblDisplayName')
  private onDestTableDisplayNameChanged() {
    this.redraw();
  }
}
