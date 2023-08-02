import { Component, Ref } from 'vue-property-decorator';
import { ChartInfo, TableQueryChartSetting, TableSchema, WidgetExtraData } from '@core/common/domain';
import { EtlOperator, ETLOperatorType, TransformOperator } from '@core/data-cook';
import cloneDeep from 'lodash/cloneDeep';
import QueryBuilder from '@/screens/chart-builder/data-cook/QueryBuilder.vue';
import ChartBuilder from '@/screens/chart-builder/data-cook/ChartBuilder.vue';
import { ChartType } from '@/shared';
import EtlModal from '@/screens/data-cook/components/etl-modal/EtlModal.vue';
import ManageOperatorModal from '@/screens/data-cook/components/manage-operator-modal/ManageOperatorModal';
import { Track } from '@/shared/anotation';
import { TrackEvents } from '@core/tracking/enum/TrackEvents';

@Component({
  components: {
    EtlModal,
    QueryBuilder,
    ChartBuilder
  }
})
export default class TransformTable extends ManageOperatorModal {
  protected operatorType = ETLOperatorType.TransformOperator;

  private readonly chartType = ChartType.FlattenTable;
  private model: TransformOperator | null = null;
  private tableSchema: TableSchema | null = null;
  private callback: ((newOperator: TransformOperator, extraData: WidgetExtraData | undefined) => void) | null = null;
  private querySetting: TableQueryChartSetting | null = null;
  private extraData: WidgetExtraData | null = null;

  @Ref()
  private chartBuilder!: ChartBuilder;

  protected resetModel() {
    this.model = null;
    this.tableSchema = null;
    this.callback = null;
    this.querySetting = null;
    this.extraData = null;
  }

  @Track(TrackEvents.ETLAddTransformTable)
  public add(operator: EtlOperator, tableSchema: TableSchema, callback: (newOperator: TransformOperator, extraData: WidgetExtraData | undefined) => void) {
    this.startCreate();
    this.tableSchema = tableSchema;
    this.callback = callback;
    this.extraData = null;
    const query = new TableQueryChartSetting([], [], [], {}, []);
    this.querySetting = null;
    this.model = new TransformOperator(operator, query, this.makeDestTableConfig([operator]), false, null, null, []);
    this.show();
  }

  @Track(TrackEvents.ETLEditTransformTable)
  public edit(
    operator: TransformOperator,
    tableSchema: TableSchema | null,
    extraData: WidgetExtraData | undefined,
    callback: (newOperator: TransformOperator, extraData: WidgetExtraData | undefined) => void
  ) {
    this.startEdit();
    this.tableSchema = tableSchema;
    this.querySetting = operator?.query ?? null;
    this.extraData = extraData ?? null;
    this.model = cloneDeep(operator);
    this.callback = callback;
    this.show();
  }

  @Track(TrackEvents.ETLSubmitTransformTable)
  private submit() {
    let extraData: WidgetExtraData | undefined;
    if (this.model && this.chartBuilder) {
      // @ts-ignore
      const chartInfo: ChartInfo = this.chartBuilder.getFinalChartInfo()!;
      this.model.query = chartInfo.setting as TableQueryChartSetting;
      extraData = chartInfo.extraData;
    }
    if (this.callback && this.model) {
      this.callback(this.model, extraData);
    }
    this.hide();
  }
}
