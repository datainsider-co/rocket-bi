import DiagramItem from '../DiagramItem.vue';
import { Component, Inject, Prop, Watch } from 'vue-property-decorator';
import Konva from 'konva';
import { Log } from '@core/utils';
import { EtlOperator, Position } from '@core/DataCook';
import { PRIMARY_COLOR } from '@/screens/DataCook/components/ManageEtlOperator/constance';
import { ThirdPartyPersistConfiguration } from '@core/DataCook/Domain/ETL/ThirdPartyPersistConfiguration/ThirdPartyPersistConfiguration';
import { Image } from 'konva/types/shapes/Image';

@Component({})
export default class ThirdPartyPersistConfig extends DiagramItem {
  @Prop({ type: Object, required: true })
  private operator!: EtlOperator;

  @Prop({ type: Object, required: true })
  private thirdPartyConfig!: ThirdPartyPersistConfiguration;

  @Prop({ type: Number, required: true, default: -1 })
  private thirdPartyConfigIndex!: number;

  @Inject() protected readonly getTablePosition!: (operator: EtlOperator) => Position | null;
  @Inject() protected readonly getSavedThirdPartyPosition!: (operator: EtlOperator, thirdPartyIndex: number) => Position | null;
  @Inject() protected readonly setSavedThirdPartyPosition!: (operator: EtlOperator, position: Position, thirdPartyIndex: number) => void;

  private txtDatabaseName: Konva.Text | null = null;
  private txtTableName: Konva.Text | null = null;
  private errorMsg = '';

  private get configImg(): Konva.Image {
    const img: HTMLImageElement = document.createElement('img');
    img.src = this.thirdPartyConfig.getImgSource();
    return new Konva.Image({
      x: 0,
      y: 0,
      width: 52,
      height: 52,
      verticalAlign: 'middle',
      align: 'center',
      fontSize: 30,
      border: 0,
      lineHeight: 1,
      fontFamily: 'data-insider-icon',
      fill: '#f2f2f2',
      image: img
    });
  }

  protected async drawAsync(): Promise<Konva.Group> {
    const MAX_WIDTH = 350;
    const height = 52;
    const thirdPartyIconHeight = 52;
    const paddingX = 10;
    const headerHeight = 36;
    const cornerRadius = 4;
    const fontSize = 14;
    const textColor = '#4f4f4f';
    const btnSize = 18;

    const charWidth = 8;
    const dbIconWidth = 52;
    const thirdPartyIconWidth = 52;
    const dbIconFontSize = 30;
    const databaseLabel = this.thirdPartyConfig.databaseName || '<<noname>>';
    const tableLabel = this.thirdPartyConfig.tableName || '<<noname>>';

    const databaseLabelWidth = dbIconWidth + databaseLabel.length * charWidth + paddingX * 2;
    const tableLabelWidth = dbIconWidth + tableLabel.length * charWidth + 22 + paddingX * 2;
    const width = Math.min(MAX_WIDTH, Math.max(140, tableLabelWidth, databaseLabelWidth));
    const txtTableNameY = 30;

    const position = this.getSavedThirdPartyPosition(this.operator, this.thirdPartyConfigIndex);
    Log.debug('getSavedThirdPartyPosition::', this.thirdPartyConfigIndex, position);
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
      height
    });

    const rectContainer = new Konva.Rect({
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
      text: String.fromCharCode(parseInt('e906', 16)),
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

    group.add(rectContainer);
    group.add(rectDb);
    group.add(this.configImg);
    group.add(rctInfo);

    group.add(this.txtDatabaseName);
    group.add(this.txtTableName);
    group.on('mouseover', () => {
      if (this.stage) {
        this.stage.container().style.cursor = 'move';
      }
      rectContainer.strokeEnabled(true);
      this.layer?.draw();
    });
    group.on('mouseleave', () => {
      if (this.stage) {
        this.stage.container().style.cursor = 'grab';
      }
      rectContainer.strokeEnabled(false);
      this.layer?.draw();
    });
    group.on('click touchend', e => {
      this.$emit('click', e);
    });
    group.on('dragend', () => {
      Log.info('dragend', group.x(), group.y());
      const pos = group.position();
      this.setSavedThirdPartyPosition(this.operator, new Position(pos.y.toString() + 'px', pos.x.toString() + 'px'), this.thirdPartyConfigIndex);
    });
    return group;
  }

  @Watch('thirdPartyConfig.className', { deep: true })
  private async handleClassNameChanged() {
    await this.redraw();
  }

  @Watch('thirdPartyConfig.databaseName', { deep: true })
  private async handleDatabaseNameChanged() {
    await this.redraw();
  }

  @Watch('thirdPartyConfig.tableName', { deep: true })
  private async handleTableNameChanged() {
    await this.redraw();
  }
}
