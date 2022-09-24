import { Component, Ref } from 'vue-property-decorator';
import { ChartInfo, GroupedTableQuerySetting, QuerySetting, TableQueryChartSetting, TableSchema, WidgetExtraData } from '@core/domain';
import { EtlOperator, TransformOperator, ETL_OPERATOR_TYPE } from '@core/DataCook';
import cloneDeep from 'lodash/cloneDeep';
import QueryBuilder from '@/screens/ChartBuilder/DataCook/QueryBuilder.vue';
import ChartBuilder from '@/screens/ChartBuilder/DataCook/ChartBuilder.vue';
import { ChartType } from '@/shared';
import EtlModal from '@/screens/DataCook/components/EtlModal/EtlModal.vue';
import ManageOperatorModal from '@/screens/DataCook/components/ManageOperatorModal/ManageOperatorModal';
import { Track } from '@/shared/anotation';
import { TrackEvents } from '@core/tracking/enum/TrackEvents';

type TTransformTableCallback = (newOperator: TransformOperator, extraData: WidgetExtraData | undefined) => void;

@Component({
  components: {
    EtlModal,
    QueryBuilder,
    ChartBuilder
  }
})
export default class TransformTable extends ManageOperatorModal {
  protected operatorType = ETL_OPERATOR_TYPE.TransformOperator;

  private readonly chartType = ChartType.FlattenTable;
  private model: TransformOperator | null = null;
  private tableSchema: TableSchema | null = null;
  private callback: TTransformTableCallback | null = null;
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
  private add(operator: EtlOperator, tableSchema: TableSchema, callback: TTransformTableCallback) {
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
  private edit(operator: TransformOperator, tableSchema: TableSchema, extraData: WidgetExtraData | undefined, callback: TTransformTableCallback) {
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
