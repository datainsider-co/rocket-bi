import { Component, Ref, Vue } from 'vue-property-decorator';
import { ChartInfo, FlattenPivotTableQuerySetting, PivotTableQuerySetting, QuerySetting, TableSchema, WidgetExtraData } from '@core/common/domain';
import { EtlOperator, PivotTableOperator, ETL_OPERATOR_TYPE } from '@core/data-cook';
import cloneDeep from 'lodash/cloneDeep';
import QueryBuilder from '@/screens/chart-builder/data-cook/QueryBuilder.vue';
import ChartBuilder from '@/screens/chart-builder/data-cook/ChartBuilder.vue';
import { ChartType } from '@/shared';
import EtlModal from '@/screens/data-cook/components/etl-modal/EtlModal.vue';
import ManageOperatorModal from '@/screens/data-cook/components/manage-operator-modal/ManageOperatorModal';
import { Track } from '@/shared/anotation';
import { TrackEvents } from '@core/tracking/enum/TrackEvents';

type TPivotTableCallback = (newOperator: PivotTableOperator, extraData: WidgetExtraData | undefined) => void;

@Component({
  components: {
    EtlModal,
    QueryBuilder,
    ChartBuilder
  }
})
export default class PivotTable extends ManageOperatorModal {
  protected operatorType = ETL_OPERATOR_TYPE.PivotTableOperator;
  private model: PivotTableOperator | null = null;
  private tableSchema: TableSchema | null = null;
  private callback: TPivotTableCallback | null = null;
  private readonly chartType = ChartType.FlattenPivotTable;
  private querySetting: FlattenPivotTableQuerySetting | null = null;
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

  @Track(TrackEvents.ETLAddPivotTable)
  private add(operator: EtlOperator, tableSchema: TableSchema, callback: TPivotTableCallback) {
    this.tableSchema = tableSchema;
    this.startCreate();
    this.callback = callback;
    const query = new FlattenPivotTableQuerySetting([], [], [], [], [], {}, []);
    this.querySetting = null;
    this.extraData = null;
    this.model = new PivotTableOperator(operator, query, this.makeDestTableConfig([operator]), false, null, null, []);
    this.show();
  }

  @Track(TrackEvents.ETLEditPivotTable)
  private edit(operator: PivotTableOperator, tableSchema: TableSchema, extraData: WidgetExtraData | undefined, callback: TPivotTableCallback) {
    this.tableSchema = tableSchema;
    this.startEdit();
    this.callback = callback;
    this.querySetting = operator.query;
    this.extraData = extraData ?? null;
    this.model = cloneDeep(operator);
    this.show();
  }

  @Track(TrackEvents.ETLSubmitPivotTable)
  private submit() {
    let extraData: WidgetExtraData | undefined;
    if (this.model && this.chartBuilder) {
      // @ts-ignore
      const chartInfo: ChartInfo = this.chartBuilder.getFinalChartInfo()!;
      this.model.query = chartInfo.setting as FlattenPivotTableQuerySetting;
      extraData = chartInfo.extraData;
    }
    if (this.callback && this.model) {
      this.callback(this.model, extraData);
    }
    this.hide();
  }
}
