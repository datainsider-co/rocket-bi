import { Component, Prop, Provide, Ref, Vue, Watch } from 'vue-property-decorator';
import {
  CheckProgressResponse,
  DataCookService,
  EmailConfiguration,
  ETL_OPERATOR_TYPE,
  ETL_OPERATOR_TYPE_SHORT_NAME,
  EtlExtraData,
  EtlJobInfo,
  EtlJobRequest,
  EtlOperator,
  GetDataOperator,
  JoinOperator,
  ManageFieldOperator,
  MultiPreviewEtlOperatorResponse,
  PersistConfiguration,
  PivotTableOperator,
  Position,
  PositionValue,
  SendToGroupEmailOperator,
  SQLQueryOperator,
  TableConfiguration,
  TransformOperator
} from '@core/data-cook';
import { Log } from '@core/utils';
import JoinTable from '../manage-operator-modal/join-table/JoinTable.vue';
import SelectSource from '../select-source/SelectSource.vue';
import OperatorContextMenu from '../operator-context-menu/OperatorContextMenu.vue';
import TableContextMenu from '../table-context-menu/TableContextMenu.vue';
import { DatabaseSchema, DIException, TableSchema, WidgetExtraData } from '@core/common/domain';
import { Inject as InjectService } from 'typescript-ioc';
import SelectSourcePopover from '@/screens/data-cook/components/select-source-popover/SelectSourcePopover.vue';
import PreviewTableData from '@/screens/data-management/components/preview-table-data/PreviewTableData.vue';
import QueryTable from '@/screens/data-cook/components/manage-operator-modal/query-table/QueryTable.vue';
import SaveEtl from '@/screens/data-cook/components/save-etl/SaveEtl.vue';
import PivotTable from '@/screens/data-cook/components/manage-operator-modal/pivot-table/PivotTable.vue';
import TransformTable from '@/screens/data-cook/components/manage-operator-modal/transform-table/TransformTable.vue';
import ManageFields from '@/screens/data-cook/components/manage-operator-modal/manage-fields/ManageFields.vue';
import cloneDeep from 'lodash/cloneDeep';
import { Distance, ETL_JOB_NAME_INVALID_REGEX, ManageEtlModel, TTableContextMenuPayload } from './Constance';
import { JobStatus } from '@core/data-ingestion';
import { EtlJobData, EtlJobError } from '@core/data-cook/domain/etl/EtlJobData';
import camelCase from 'lodash/camelCase';
import differenceWith from 'lodash/differenceWith';
import uniqBy from 'lodash/uniqBy';
import Swal from 'sweetalert2';
import DiagramPanel from '@/screens/data-cook/components/diagram-panel/DiagramPanel.vue';
import TableItem from '../diagram-panel/etl-operator/TableItem';
import OperatorType from '../diagram-panel/etl-operator/OperatorType';
import ArrowConnector from '@/screens/data-cook/components/diagram-panel/ArrowConnector.vue';
import SavedTable from '@/screens/data-cook/components/diagram-panel/etl-operator/SavedTable';
import ThirdPartyPersistConfig from '@/screens/data-cook/components/diagram-panel/etl-operator/ThirdPartyPersistConfig';
import SavedTableContextMenu from '@/screens/data-cook/components/saved-table-context-menu/SavedTableContextMenu.vue';
import SaveToDataWareHouse from '@/screens/data-cook/components/save-to-data-warehouse/SaveToDataWareHouse.vue';
import SaveToDatabase from '@/screens/data-cook/components/save-to-database/SaveToDatabase.vue';
import { ThirdPartyPersistConfiguration } from '@core/data-cook/domain/etl/third-party-persist-configuration/ThirdPartyPersistConfiguration';
import SavedPartyConfigContextMenu from '@/screens/data-cook/components/saved-table-context-menu/SavedPartyConfigContextMenu.vue';
import { ListUtils } from '@/utils';
import DiRenameModal from '@/shared/components/DiRenameModal.vue';
import SendToEmail from '@/screens/data-cook/components/send-to-email/SendToEmail.vue';
import SavedEmailConfigContextMenu from '@/screens/data-cook/components/saved-table-context-menu/SavedEmailConfigContextMenu.vue';
import SavedEmailConfig, { DragPosition } from '@/screens/data-cook/components/diagram-panel/etl-operator/SavedEmailConfig';
import { StringUtils } from '@/utils/StringUtils';
import { RouterUtils } from '@/utils/RouterUtils';
import { Routers } from '@/shared';
import { Track } from '@/shared/anotation';
import { TrackEvents } from '@core/tracking/enum/TrackEvents';

const MIN_TOP = 20;

@Component({
  components: {
    JoinTable,
    SelectSource,
    TableContextMenu,
    OperatorContextMenu,
    SelectSourcePopover,
    PreviewTableData,
    QueryTable,
    SaveEtl,
    PivotTable,
    TransformTable,
    ManageFields,
    SaveToDataWareHouse,
    SaveToDatabase,
    SendToEmail,
    DiagramPanel,
    TableItem,
    OperatorType,
    ArrowConnector,
    SavedTable,
    SavedEmailConfig,
    SavedTableContextMenu,
    SavedEmailConfigContextMenu,
    DiRenameModal,
    ThirdPartyPersistConfig,
    SavedPartyConfigContextMenu
  }
})
export default class ManageEtlOperator extends Vue {
  @InjectService
  private dataCookService!: DataCookService;
  private loading = false;
  private model: ManageEtlModel = new ManageEtlModel();
  private mapColumn: Record<string, number> = {};
  private mapMaxTop: Record<number, number> = {};

  private maxTop = MIN_TOP;

  private previewEtl: EtlOperator | null = null;
  // for show border
  private currentEmailConfigOverlap: SavedEmailConfig | null = null;

  @Prop({ type: Object, default: () => null })
  private value!: EtlJobInfo;

  @Ref()
  private diagramPanel?: DiagramPanel;

  @Ref()
  private operatorType?: OperatorType;

  @Ref()
  private saveEtl!: SaveEtl;

  @Ref()
  joinTable!: JoinTable;

  @Ref()
  queryTable!: QueryTable;

  @Ref()
  pivotTable!: PivotTable;

  @Ref()
  transformTable!: TransformTable;

  @Ref()
  operatorContextMenu!: OperatorContextMenu;

  @Ref()
  tableContextMenu!: TableContextMenu;

  @Ref()
  savedTableContextMenu!: SavedTableContextMenu;

  @Ref()
  savedEmailConfigContextMenu!: SavedEmailConfigContextMenu;

  @Ref()
  savedPartyConfigContextMenu!: SavedPartyConfigContextMenu;

  @Ref()
  manageFields!: ManageFields;

  @Ref()
  saveToDataWareHouse!: SaveToDataWareHouse;

  @Ref()
  saveToDatabase!: SaveToDatabase;

  @Ref()
  sendToEmail!: SendToEmail;

  @Ref()
  renameModal!: DiRenameModal;

  @Ref()
  private readonly savedEmailConfigs!: SavedEmailConfig[];

  private get leafOperators() {
    if (this.value) {
      return this.value.operators;
    }
    return [];
  }

  private set leafOperators(value: EtlOperator[]) {
    if (this.value) {
      this.value.operators = value;
    }
  }

  private getPreviewTableLabel(operator: EtlOperator) {
    if (operator.isGetData) {
      return operator.destDatabaseDisplayName + '.' + operator.destTableDisplayName;
    } else {
      return operator.destTableDisplayName;
    }
  }

  private mounted() {
    this.initModel();
  }

  private async initModel() {
    this.loading = true;
    this.model = new ManageEtlModel();
    this.maxTop = MIN_TOP;

    this.model.extraData = cloneDeep(this.value.extraData?.renderOptions ?? {});
    this.model.operatorPosition = cloneDeep(this.value.extraData?.operatorPosition ?? {});
    this.model.tablePosition = cloneDeep(this.value.extraData?.tablePosition ?? {});
    this.model.savedTablePosition = cloneDeep(this.value.extraData?.savedTablePosition ?? {});
    this.model.savedEmailConfigPosition = cloneDeep(this.value.extraData?.savedEmailConfigPosition ?? {});
    this.model.savedThirdPartyPosition = cloneDeep(this.value.extraData?.savedThirdPartyPosition ?? {});
    this.model.stagePosition = PositionValue.fromObject(this.value.extraData?.stagePosition);

    Log.info('initModel::operators', this.leafOperators.length);
    // Get Preview DB Name
    await this.getDatabaseName();
    // Init All Get / NotGet Operators
    this.leafOperators.forEach(ope => {
      ope.getAllGetDataOperators().forEach(getDataOpe => {
        this.updateGetOperatorPosition(getDataOpe);
        // this.addGetDataOperator(getDataOpe.tableSchema);
      });
      ope.getAllNotGetDataOperators().forEach(ope => {
        this.updateNotGetOperatorPosition(ope);
      });
    });
    this.multiPreviewOperators(this.leafOperators);
    if (this.allOperators[0]) {
      this.selectPreviewOperator(this.allOperators[0]);
    }
    this.loading = false;
  }

  @Provide('etlDbDisplayName')
  private etlDbDisplayName = 'ETL Database';

  @Provide('makeDestTableConfig')
  private makeDestTableConfig(leftOperators: EtlOperator[] | TableSchema, newOperatorType: ETL_OPERATOR_TYPE): TableConfiguration {
    let tableName = '';
    if (leftOperators instanceof TableSchema) {
      const tableSchema = leftOperators as TableSchema;
      tableName = tableSchema.name;
    } else {
      Log.debug('makeDestTableConfig::leftOps::', leftOperators);
      let leftOps = leftOperators;
      let ope = ListUtils.isNotEmpty(leftOperators) ? leftOperators[0] : null;
      while (true) {
        if (ope && ListUtils.isNotEmpty(ope.getLeftOperators()) && leftOps.length < 2) {
          tableName = ope.destTableName;
          leftOps = ope.getLeftOperators();
          ope = leftOps[0];
          Log.debug('makeDestTableConfig::loop::leftOps::', leftOps);
        } else {
          Log.debug('makeDestTableConfig::Failcase::', ope?.getLeftOperators());
          break;
        }
      }
      Log.debug('makeDestTableConfig::leftOps::', leftOps);
      if (leftOps.length === 2) {
        tableName = leftOps[0].destTableName + '_join_' + leftOps[1].destTableName;
      } else {
        tableName = leftOps[0].destTableName;
      }
    }

    let count = 0;
    let temp = tableName;
    while (this.model.map[temp]) {
      count += 1;
      temp = [tableName, count].join('_');
    }
    if (count > 0) {
      tableName = [tableName, count].join('_');
    }
    return new TableConfiguration(tableName, this.etlDbDisplayName, tableName);
  }

  @Provide('getAllNotGetOperators')
  private getAllNotGetOperators(): EtlOperator[] {
    return this.model.notGetDataItems;
  }

  @Provide('buildTableKey')
  private buildTableKey(dbName: string, tblName: string) {
    return [dbName, tblName].join('.');
  }

  @Provide('getRenderTableItems')
  private getRenderTableItems(tables: TableSchema[] = []) {
    const results: HTMLElement[] = [];

    tables.forEach(table => {
      const refKey = this.getTableRef(table.dbName, table.name);
      // @ts-ignore
      if (this.$refs[refKey] && this.$refs[refKey][0]) {
        // @ts-ignore
        results.push(this.$refs[refKey][0].$el as HTMLElement);
      }
    });
    return results;
  }

  @Provide('getRenderDestTable')
  private getRenderDestTable(destTable: TableConfiguration) {
    const refKey = this.getDestTableRef(destTable.tblName);
    // @ts-ignore
    if (this.$refs[refKey] && this.$refs[refKey][0]) {
      // @ts-ignore
      return this.$refs[refKey][0].$el as HTMLElement;
    }
    return null;
  }

  @Provide('getRenderOperatorItems')
  private getRenderOperatorItems(operators: EtlOperator[] = []) {
    const results: HTMLElement[] = [];

    operators.forEach(ope => {
      if (ope.isGetData) {
        const getDataOpe = ope as GetDataOperator;
        const refKey = this.getTableRef(getDataOpe.tableSchema.dbName, getDataOpe.tableSchema.name);
        // @ts-ignore
        if (this.$refs[refKey] && this.$refs[refKey][0]) {
          // @ts-ignore
          results.push(this.$refs[refKey][0].$el as HTMLElement);
        }
      } else if (ope.destTableConfiguration) {
        const el = this.getRenderDestTable(ope.destTableConfiguration);
        if (el) {
          results.push(el);
        }
      }
    });

    return results;
  }

  @Provide('isLoadingOperator')
  private isLoadingOperator(operator: EtlOperator) {
    return this.model.mapLoading[operator.destTableName];
  }

  @Provide('getOperatorPosition')
  private getOperatorPosition(operator: EtlOperator) {
    Log.info('getOperatorPosition', operator.destTableName, this.model.operatorPosition[camelCase(operator.destTableName)]);
    return this.model.operatorPosition[camelCase(operator.destTableName)] || null;
  }

  @Provide('setOperatorPosition')
  private setOperatorPosition(operator: EtlOperator, position: Position) {
    this.model.operatorPosition[camelCase(operator.destTableName)] = position;
  }

  @Provide('getTablePosition')
  private getTablePosition(operator: EtlOperator) {
    return this.model.tablePosition[camelCase(operator.destTableName)] || null;
  }

  @Provide('setTablePosition')
  private setTablePosition(operator: EtlOperator, position: Position) {
    this.model.tablePosition[camelCase(operator.destTableName)] = position;
  }

  @Provide('getSavedTablePosition')
  private getSavedTablePosition(operator: EtlOperator) {
    return this.model.savedTablePosition[camelCase(operator.destTableName)] || null;
  }

  @Provide('setSavedTablePosition')
  private setSavedTablePosition(operator: EtlOperator, position: Position) {
    this.model.savedTablePosition[camelCase(operator.destTableName)] = position;
  }

  @Provide('setSavedEmailConfigPosition')
  private setSavedEmailConfigPosition(operator: EtlOperator, position: Position) {
    this.model.savedEmailConfigPosition[camelCase(operator.destTableName)] = position;
  }

  @Provide('handleMergeEmailConfig')
  private handleMergeEmailConfig(sourceOperator: EtlOperator, position: DragPosition) {
    if (this.currentEmailConfigOverlap) {
      this.currentEmailConfigOverlap.hideBorder();
      const destOperator: EtlOperator = this.currentEmailConfigOverlap.operator;
      const finalEmailOperator: SendToGroupEmailOperator = this.mergeEmailOperator(sourceOperator, destOperator);
      this.sendToEmail.showEditModal(finalEmailOperator, (newOperator: SendToGroupEmailOperator) => {
        this.handleRemoveSendToEmail(sourceOperator);
        this.handleRemoveSendToEmail(destOperator);
        this.setSavedEmailConfigPosition(newOperator, Position.fromXY(position.x, position.y));
        this.handleNewOperator(ListUtils.getHead(newOperator.operators) || null, newOperator);
      });
      this.currentEmailConfigOverlap = null;
    }
  }

  private handleDragEmailConfig(source: SavedEmailConfig, position: DragPosition) {
    const emailConfig: SavedEmailConfig | undefined = this.savedEmailConfigs.find((destConfig: SavedEmailConfig) => {
      return source != destConfig && destConfig.isOverlap(position);
    });
    if (emailConfig && this.currentEmailConfigOverlap != emailConfig) {
      this.currentEmailConfigOverlap?.hideBorder();
      emailConfig?.showBorder();
      this.currentEmailConfigOverlap = emailConfig;
    } else if (!emailConfig && this.currentEmailConfigOverlap) {
      this.currentEmailConfigOverlap.hideBorder();
      this.currentEmailConfigOverlap = null;
    }
  }

  private mergeEmailOperator(source: EtlOperator, dest: EtlOperator) {
    const sourceOperator: SendToGroupEmailOperator = this.toSendGroupEmailOperator(source);
    const destOperator: SendToGroupEmailOperator = this.toSendGroupEmailOperator(dest);
    const parentOperators: EtlOperator[] = EtlOperator.unique([...sourceOperator.operators, ...destOperator.operators]);
    return new SendToGroupEmailOperator(
      parentOperators,
      this.makeDestTableConfig(parentOperators, ETL_OPERATOR_TYPE.SendToGroupEmailOperator),
      ListUtils.unique([...sourceOperator.receivers, ...destOperator.receivers]),
      ListUtils.unique([...sourceOperator.cc, ...destOperator.cc]),
      ListUtils.unique([...sourceOperator.bcc, ...destOperator.bcc]),
      sourceOperator.subject || destOperator.subject,
      ListUtils.unique([...sourceOperator.fileNames, ...destOperator.fileNames]),
      sourceOperator.content || destOperator.content,
      sourceOperator.displayName || destOperator.displayName,
      sourceOperator.isZip || destOperator.isZip
    );
  }

  /**
   * @throws [DIException] when can not to send group email operator
   */
  private toSendGroupEmailOperator(operator: EtlOperator): SendToGroupEmailOperator {
    if (operator.isSendToGroupEmail) {
      return operator as SendToGroupEmailOperator;
    }
    if (operator.emailConfiguration) {
      const parentOperator: EtlOperator = cloneDeep(operator);
      parentOperator.emailConfiguration = null;
      const emailConfiguration: EmailConfiguration = operator.emailConfiguration;
      const tableConfiguration: TableConfiguration = this.makeDestTableConfig([operator], ETL_OPERATOR_TYPE.SendToGroupEmailOperator);
      return new SendToGroupEmailOperator(
        [parentOperator],
        tableConfiguration,
        emailConfiguration.receivers,
        emailConfiguration.cc,
        emailConfiguration.bcc,
        emailConfiguration.subject,
        [emailConfiguration.fileName],
        emailConfiguration.content,
        emailConfiguration.displayName,
        false
      );
    } else {
      throw new DIException('can not to send group email operator');
    }
  }

  @Provide('getSavedEmailConfigPosition')
  private getSavedEmailConfigPosition(operator: EtlOperator) {
    return this.model.savedEmailConfigPosition[camelCase(operator.destTableName)] || null;
  }

  @Provide('getSavedThirdPartyPosition')
  private getSavedThirdPartyPosition(operator: EtlOperator, thirdPartyConfigIndex: number) {
    return this.model.savedThirdPartyPosition[camelCase(operator.destTableName + thirdPartyConfigIndex.toString())] || null;
  }

  @Provide('setSavedThirdPartyPosition')
  private setSavedThirdPartyPosition(operator: EtlOperator, position: Position, thirdPartyConfigIndex: number) {
    this.model.savedThirdPartyPosition[camelCase(operator.destTableName + thirdPartyConfigIndex.toString())] = position;
  }

  @Provide('getPreviewEtlResponse')
  private getPreviewEtlResponse(operator: EtlOperator): CheckProgressResponse | null {
    if (this.model.mapLoading[operator.destTableName]) {
      return null;
    }
    return this.model.mapPreviewData[operator.destTableName] ?? null;
  }

  private prepareEditOperator(operator: EtlOperator) {
    switch (operator.className) {
      case ETL_OPERATOR_TYPE.JoinOperator:
        return Promise.all([
          this.previewOperator((operator as JoinOperator).joinConfigs[0].leftOperator),
          this.previewOperator((operator as JoinOperator).joinConfigs[0].rightOperator)
        ]);
      case ETL_OPERATOR_TYPE.TransformOperator:
        return this.previewOperator((operator as TransformOperator).operator);
      case ETL_OPERATOR_TYPE.ManageFieldOperator:
        return this.previewOperator((operator as ManageFieldOperator).operator);
      case ETL_OPERATOR_TYPE.PivotTableOperator:
        return this.previewOperator((operator as PivotTableOperator).operator);
      case ETL_OPERATOR_TYPE.SQLQueryOperator:
        return this.previewOperator((operator as SQLQueryOperator).operator);
      case ETL_OPERATOR_TYPE.GetDataOperator:
      default:
        return this.previewOperator(operator);
    }
  }

  private getDatabaseName() {
    this.dataCookService
      .getDatabaseName(this.value.id)
      .then(resp => {
        this.model.dbName = resp.databaseName;
      })
      .catch(e => {
        Log.info('ManageEtlOperator::getDatabaseName', e);
      });
  }

  private get allOperators(): EtlOperator[] {
    return ([] as EtlOperator[]).concat(this.model.getDataItems).concat(this.model.notGetDataItems);
  }

  private retryPreviewOperator(operator: EtlOperator) {
    this.$delete(this.model.mapPreviewData, operator.destTableName);
    return this.previewOperator(operator, true);
  }

  private selectPreviewOperator(operator: EtlOperator, force = false) {
    this.previewEtl = operator;
    this.previewOperator(operator, force);
  }

  private showLoading(operators: EtlOperator[]) {
    operators.forEach(operator => {
      Log.info('showLoading', operator.destTableName);
      this.$set(this.model.mapLoading, operator.destTableName, true);
    });
  }
  private hideLoading(operators: EtlOperator[]) {
    operators.forEach(operator => {
      Log.info('hideLoading', operator.destTableName);
      this.$delete(this.model.mapLoading, operator.destTableName);
    });
  }

  private async multiPreviewOperators(operators: EtlOperator[], force = false) {
    if (force || ListUtils.isNotEmpty(operators)) {
      const allOperators = uniqBy(operators.map(ope => ope.getAllOperators()).flat(), operator => operator.destTableName);
      try {
        this.showLoading(allOperators);
        const previewData: MultiPreviewEtlOperatorResponse = await this.dataCookService.multiPreview(this.value.id, operators, true);
        Log.info('multiPreview::completed');
        this.renderData(previewData);
        this.renderError(previewData);
      } catch (ex) {
        Log.error('multiPreview::error', ex);
        this.renderErrorByOperators(allOperators, ex.message);
      } finally {
        this.hideLoading(allOperators);
      }
    }
  }

  private renderData(previewData: MultiPreviewEtlOperatorResponse): void {
    if (previewData.data) {
      previewData.data.allTableSchemas.forEach(tableSchema => {
        this.$set(this.model.mapPreviewData, tableSchema.name, new CheckProgressResponse(0, JobStatus.Synced, new EtlJobData(tableSchema), null));
      });
    }
  }

  private renderError(previewData: MultiPreviewEtlOperatorResponse): void {
    if (previewData.error) {
      this.$set(this.model.mapPreviewData, previewData.error.tableError, new CheckProgressResponse(0, JobStatus.Error, null, previewData.error));
    }
  }

  private renderErrorByOperators(operators: EtlOperator[], message: string): void {
    operators.forEach(operator => {
      this.$set(
        this.model.mapPreviewData,
        operator.destTableName,
        new CheckProgressResponse(0, JobStatus.Error, null, new EtlJobError(message, operator.destTableName))
      );
    });
  }

  /**
   * preview operator if table is not preview or force is true
   */
  private async previewOperator(operator: EtlOperator, force = false): Promise<CheckProgressResponse> {
    if (force || (!this.model.mapPreviewData[operator.destTableName] && !this.model.mapLoading[operator.destTableName])) {
      Log.info('process preview force or not have preview yet', operator.destTableDisplayName);
      let operators: EtlOperator[] = this.leafOperators.filter(leafOperator => leafOperator.isExistOperatorName(operator.destTableName));
      if (ListUtils.isEmpty(operators)) {
        operators = [operator];
      }
      await this.multiPreviewOperators(operators, force);
    } else {
      Log.info('previewOperator: already preview operator');
    }
    return this.model.mapPreviewData[operator.destTableName];
  }

  private getOperatorTypeRef(operator: EtlOperator) {
    return ['operator-type', operator.destTableName].join('_');
  }

  private getTableRef(dbName: string, tblName: string) {
    return ['tables', dbName, tblName].join('_');
  }

  private getDestTableRef(tblName: string) {
    return ['dest-tables', tblName].join('_');
  }

  private getEmailConfigId(subject: string) {
    return 'saved_email_config_' + StringUtils.toSnakeCase(subject);
  }

  private getEmailConnectorId(subject: string) {
    return 'saved_connector' + '_send_to_email_' + StringUtils.toSnakeCase(subject);
  }

  private getDiagramPanelMousePosition(e: MouseEvent) {
    if (this.diagramPanel) {
      const containerRect = this.diagramPanel.getBoundingClientRect();
      const pointerPosition = this.diagramPanel.getPointerPosition();
      if (containerRect && pointerPosition) {
        const top = containerRect.top + (pointerPosition?.y ?? 0);
        const left = containerRect.left + (pointerPosition?.x ?? 0);
        return { top, left };
      }
    }
    return { top: 0, left: 0 };
  }

  private showSelectOperatorType(operator: EtlOperator, e: MouseEvent) {
    Log.info('showSelectOperatorType', e);
    this.previewOperator(operator);

    const pos = this.getDiagramPanelMousePosition(e);
    this.tableContextMenu.showPopover(operator, pos.top, pos.left);
  }

  private showSavedTableContextMenu(operator: EtlOperator, e: MouseEvent) {
    const pos = this.getDiagramPanelMousePosition(e);
    this.savedTableContextMenu.showPopover(operator, pos.top, pos.left);
  }

  private showSavedEmailConfigContextMenu(operator: EtlOperator, e: MouseEvent) {
    const pos = this.getDiagramPanelMousePosition(e);
    this.savedEmailConfigContextMenu.showPopover(operator, pos.top, pos.left);
  }

  private showSavedThirdPartyConfigContextMenu(operator: EtlOperator, thirdPartyConfig: ThirdPartyPersistConfiguration, index: number, e: MouseEvent) {
    Log.debug('showSavedThirdPartyConfigContextMenu::', thirdPartyConfig, index);
    const pos = this.getDiagramPanelMousePosition(e);
    this.savedPartyConfigContextMenu.showPopover(operator, thirdPartyConfig, index, pos.top, pos.left);
  }

  private showOperatorContextMenu(operator: EtlOperator, e: MouseEvent) {
    this.prepareEditOperator(operator);
    const pos = this.getDiagramPanelMousePosition(e);
    this.operatorContextMenu.showPopover(operator, pos.top, pos.left);
  }

  private handleEditOperator(operator: EtlOperator) {
    switch (operator.className) {
      case ETL_OPERATOR_TYPE.JoinOperator:
        // @ts-ignore
        this.editJoinOperator(operator as JoinOperator);
        break;
      case ETL_OPERATOR_TYPE.SQLQueryOperator:
        // @ts-ignore
        this.editQueryOperator(operator as SQLQueryOperator);
        break;
      case ETL_OPERATOR_TYPE.PivotTableOperator:
        // @ts-ignore
        this.editPivotTableOperator(operator as PivotTableOperator);
        // this.pivotTable.edit(operator);
        break;
      case ETL_OPERATOR_TYPE.TransformOperator:
        // @ts-ignore
        this.editTransformTableOperator(operator as TransformOperator);
        // this.transformTable.edit(operator);
        break;
      case ETL_OPERATOR_TYPE.ManageFieldOperator:
        this.editManageFieldOperator(operator as ManageFieldOperator);
        break;
      default:
        Log.info('Not support yet');
    }
  }

  private handleTableContextMenu(operator: EtlOperator, operatorType: ETL_OPERATOR_TYPE, payload: TTableContextMenuPayload) {
    switch (operatorType) {
      case ETL_OPERATOR_TYPE.JoinOperator:
        if (payload.operator) {
          this.startJoinOperatorFromOperator(operator, payload.operator);
        } else if (payload.database && payload.table) {
          this.startJoinOperatorFromTable(operator, payload.database, payload.table);
        }
        break;
      case ETL_OPERATOR_TYPE.SQLQueryOperator:
        this.startQueryOperator(operator);
        break;
      case ETL_OPERATOR_TYPE.PivotTableOperator:
        this.startPivotTableOperator(operator);
        break;
      case ETL_OPERATOR_TYPE.TransformOperator:
        this.startTransformTableOperator(operator);
        break;
      case ETL_OPERATOR_TYPE.ManageFieldOperator:
        this.startManageFieldOperator(operator);
        break;
      default:
        Log.info('Not support yet');
    }
  }

  @Track(TrackEvents.ETLAddSQLQuery)
  private async startQueryOperator(operator: EtlOperator) {
    const tableSchema = this.getTableSchema(operator);
    if (this.queryTable && tableSchema) {
      // @ts-ignore
      this.queryTable.add(operator, tableSchema, newOperator => {
        this.handleNewOperator(operator, newOperator);
        Log.info(newOperator);
        Log.debug('startQueryOperator::', newOperator);
      });
    } else {
      this.showAddOperatorError([operator]);
    }
  }

  @Track(TrackEvents.ETLEditSQLQuery)
  private async editQueryOperator(operator: SQLQueryOperator) {
    const tableSchema = this.getTableSchema(operator.operator);
    if (this.queryTable && tableSchema) {
      // @ts-ignore
      this.queryTable.edit(operator, tableSchema, (updatedOperator: SQLQueryOperator) => {
        if (operator.query !== updatedOperator.query) {
          this.processUpdateOperator<SQLQueryOperator>(updatedOperator.destTableName, ope => {
            ope.query = updatedOperator.query;
          });
          this.previewOperator(operator, true);
        }
        Log.info(updatedOperator);
      });
    } else {
      this.showEditOperatorError([operator.operator]);
    }
  }

  private showAddOperatorError(operators: EtlOperator[]) {
    const tblDisplayNames = operators.map(o => o.destTableDisplayName).join(', ');
    Swal.fire({
      icon: 'error',
      title: 'Can not add operator',
      html: `Preview table <strong>${tblDisplayNames}</strong> fail`
    });
  }

  private showSaveToDatabaseError(operator: EtlOperator) {
    Swal.fire({
      icon: 'error',
      title: 'Can not save to database',
      html: `Preview table <strong>${operator.destTableDisplayName}</strong> fail`
    });
  }

  private showEditOperatorError(operators: EtlOperator[]) {
    const tblDisplayNames = operators.map(o => o.destTableDisplayName).join(', ');
    Swal.fire({
      icon: 'error',
      title: 'Can not edit this Operator',
      html: `Preview table <strong>${tblDisplayNames}</strong> fail`
    });
  }

  private async startPivotTableOperator(operator: EtlOperator) {
    const tableSchema = this.getTableSchema(operator);
    if (this.pivotTable && tableSchema) {
      // @ts-ignore
      this.pivotTable.add(operator, tableSchema, (newOperator: PivotTableOperator, extraData: WidgetExtraData | undefined) => {
        this.handleNewOperator(operator, newOperator);
        this.model.extraData[camelCase(newOperator.destTableName)] = extraData ?? {};
        Log.info(newOperator);
      });
    } else {
      this.showAddOperatorError([operator]);
    }
  }

  private async editPivotTableOperator(operator: PivotTableOperator) {
    const tableSchema = this.getTableSchema(operator.operator);
    if (this.pivotTable && tableSchema) {
      // @ts-ignore
      this.pivotTable.edit(
        operator,
        tableSchema,
        this.model.extraData[camelCase(operator.destTableName)],
        (updatedOperator: PivotTableOperator, extraData: WidgetExtraData | undefined) => {
          this.processUpdateOperator<PivotTableOperator>(updatedOperator.destTableName, ope => {
            ope.query = updatedOperator.query;
          });
          this.model.extraData[camelCase(updatedOperator.destTableName)] = extraData ?? {};
          this.previewOperator(operator, true);
          Log.info(updatedOperator);
        }
      );
    } else {
      this.showEditOperatorError([operator.operator]);
    }
  }

  private getTableSchema(operator: EtlOperator): TableSchema | null {
    return this.getPreviewEtlResponse(operator)?.data?.tableSchema ?? null;
  }

  private async startTransformTableOperator(operator: EtlOperator) {
    const tableSchema = this.getTableSchema(operator);
    if (this.transformTable && tableSchema) {
      // @ts-ignore
      this.transformTable.add(operator, tableSchema, (newOperator: TransformOperator, extraData: WidgetExtraData | undefined) => {
        this.handleNewOperator(operator, newOperator);
        this.model.extraData[camelCase(newOperator.destTableName)] = extraData ?? {};
        Log.info(newOperator);
      });
    } else {
      this.showAddOperatorError([operator]);
    }
  }

  private async editTransformTableOperator(operator: TransformOperator) {
    const tableSchema = this.getTableSchema(operator.operator);
    Log.info('editTransformTableOperator', operator, tableSchema);
    if (this.transformTable && tableSchema) {
      // @ts-ignore
      this.transformTable.edit(
        operator,
        tableSchema,
        this.model.extraData[camelCase(operator.destTableName)],
        (updatedOperator: TransformOperator, extraData: WidgetExtraData | undefined) => {
          this.processUpdateOperator<TransformOperator>(updatedOperator.destTableName, ope => {
            ope.query = updatedOperator.query;
          });
          this.model.extraData[camelCase(updatedOperator.destTableName)] = extraData ?? {};
          this.previewOperator(operator, true);
          Log.info(updatedOperator);
        }
      );
    } else {
      this.showEditOperatorError([operator.operator]);
    }
  }

  private async startManageFieldOperator(operator: EtlOperator) {
    const tableSchema = this.getTableSchema(operator);
    if (this.manageFields && tableSchema) {
      // @ts-ignore
      this.manageFields.add(this.value.id, operator, tableSchema, newOperator => {
        this.handleNewOperator(operator, newOperator);
        Log.info(newOperator);
      });
    } else {
      this.showAddOperatorError([operator]);
    }
  }

  private async editManageFieldOperator(operator: ManageFieldOperator) {
    const tableSchema = this.getTableSchema(operator.operator);
    if (this.manageFields && tableSchema) {
      // @ts-ignore
      this.manageFields.edit(this.value.id, operator, tableSchema, (updatedOperator: ManageFieldOperator) => {
        this.processUpdateOperator<ManageFieldOperator>(updatedOperator.destTableName, ope => {
          ope.fields = updatedOperator.fields;
          ope.extraFields = updatedOperator.extraFields;
        });
        this.previewOperator(operator, true);
        // this.handleNewOperator(operator, newOperator);
        Log.info(updatedOperator);
      });
    } else {
      this.showEditOperatorError([operator.operator]);
    }
  }

  private removeOperator(operator: EtlOperator) {
    // handle remove item from model
    this.$delete(this.model.map, operator.destTableName);
    this.$delete(this.model.extraData, camelCase(operator.destTableName));
    this.$delete(this.model.tablePosition, camelCase(operator.destTableName));
    this.$delete(this.model.operatorPosition, camelCase(operator.destTableName));
    this.$delete(this.model.savedTablePosition, camelCase(operator.destTableName));
    this.$delete(this.model.savedThirdPartyPosition, camelCase(operator.destTableName));
    this.$delete(this.model.mapPreviewData, operator.destTableName);
    this.$delete(this.model.mapLoading, operator.destTableName);

    if (operator.isGetData) {
      this.model.getDataItems = this.model.getDataItems.filter(item => item.destTableName !== operator.destTableName);
      this.$delete(this.model.mapTable, (operator as GetDataOperator).tableSchema.sqlAddress);
    } else {
      this.model.notGetDataItems = this.model.notGetDataItems.filter(item => item.destTableName !== operator.destTableName);
    }
  }

  private browseDeathAndAliveNodes(root: EtlOperator, deletedNode: EtlOperator): [EtlOperator[], EtlOperator[]] {
    const stack: EtlOperator[] = [];
    let alive: EtlOperator[] = [];
    let death: EtlOperator[] = [];
    let current: EtlOperator | undefined = root;
    while (current) {
      Log.info('browseNode', current.destTableDisplayName);
      const leftOperators: EtlOperator[] = current.getLeftOperators();
      const nexts: EtlOperator[] = differenceWith(leftOperators, alive.concat(death), (a, b) => a.destTableName === b.destTableName);
      if (current.destTableName === deletedNode.destTableName) {
        Log.info(' >>> browseNode', {
          stack,
          death
        });
        death.push(...stack, deletedNode);
        alive.push(...nexts);
        current = stack.pop();
        // break;
      } else if (nexts[0]) {
        stack.push(current);
        current = nexts[0];
      } else {
        if (!death.some(item => item.destTableName === current?.destTableName)) {
          alive = differenceWith(alive, leftOperators, (a, b) => a.destTableName === b.destTableName).filter(
            item => item.destTableName !== deletedNode.destTableName
          );
          alive.push(current);
        }
        current = stack.pop();
      }
    }
    death = uniqBy(death, item => item.destTableName);
    return [death, alive];
  }

  @Track(TrackEvents.ETLRemoveOperator)
  private handleRemoveOperator(operator: EtlOperator) {
    const tempOperators = this.leafOperators.concat([]);
    this.leafOperators.forEach((rootOperator, index) => {
      const [deathOperators, aliveOperators] = this.browseDeathAndAliveNodes(rootOperator, operator);
      deathOperators.forEach(this.removeOperator);
      // re-calculated index
      tempOperators.splice(index, 1, ...aliveOperators);
    });
    Log.debug('handleRemoveOperator::operators::size', this.leafOperators.length);
    this.leafOperators = this.compactOperators(tempOperators);
    Log.debug('handleRemoveOperator::afterCompact:operators::size', this.leafOperators.length);

    if (this.previewEtl && !this.allOperators.find(operator => operator.destTableName === this.previewEtl?.destTableName) && this.allOperators[0]) {
      this.selectPreviewOperator(this.allOperators[0]);
    }
  }

  @Track(TrackEvents.ETLRenameOperator)
  private handleRenameOperator(operator: EtlOperator) {
    this.renameModal.show(operator.destTableDisplayName, (newName: string) => {
      this.handleSubmitRenameOperator(newName, operator);
    });
  }

  private handleSubmitRenameOperator(newName: string, operator: EtlOperator) {
    Log.info('handleSubmitRename', newName);
    if (!newName) return;
    if (ETL_JOB_NAME_INVALID_REGEX.test(newName)) {
      this.renameModal.setError("Field can't contain special characters");
    } else {
      operator.destTableConfiguration.tblDisplayName = newName;
      this.renameModal.hide();
    }
    // this.renameModal.setLoading(true);
    // const temp = new EtlJobRequest(newName, this.model?.operators ?? [], this.model?.scheduleTime ?? new NoneScheduler());
    // this.dataCookService
    //   .updateEtl(this.model?.id ?? 0, temp)
    //   .then(() => {
    //     this.model ? (this.model.displayName = newName) : null;
    //     this.renameModal.hide();
    //   })
    //   .catch(e => {
    //     this.renameModal.setError(e.message);
    //     this.renameModal.setLoading(false);
    //   });
  }

  private parsePixel(pixelValue: string | undefined) {
    return parseFloat((pixelValue || '0').replace('px', ''));
  }

  private getSuggestedTop(operator: EtlOperator) {
    const position = this.getTablePosition(operator);
    let top = this.parsePixel(position?.top) || MIN_TOP;
    const left = (this.parsePixel(position?.left) || MIN_TOP) + Distance.TableToOperator;
    this.model.notGetDataItems.forEach(sameLevelOpe => {
      if (sameLevelOpe.getLeftOperators().find(ope => ope.destTableName === operator.destTableName)) {
        const sameLevelPosition = this.getTablePosition(sameLevelOpe);
        top = Math.max(top, this.parsePixel(sameLevelPosition?.top) + Distance.TableToTable);
        // left = Math.max(left, this.parsePixel(sameLevelPosition?.left) + Distance.TableToOperator);
      }
    });
    return { top, left };
  }

  private updateNotGetOperatorPosition(operator: EtlOperator) {
    if (!operator.isGetData && !this.model.map[operator.destTableName]) {
      // Prepare Position Before add Item to model
      let operatorPosition = this.getOperatorPosition(operator);
      let tablePosition = this.getTablePosition(operator);
      operator.getLeftOperators().forEach(ope => {
        if (!this.mapColumn[ope.destTableName]) {
          throw Error('Not init column yet');
        } else {
          this.mapColumn[operator.destTableName] = this.mapColumn[ope.destTableName] + 1;
        }
      });
      if (!operatorPosition || !tablePosition) {
        let top = MIN_TOP;
        let left = MIN_TOP;
        operator.getLeftOperators().forEach(leftOperator => {
          const suggestedPosition = this.getSuggestedTop(leftOperator);
          top = Math.max(top, suggestedPosition.top);
          left = Math.max(left, suggestedPosition.left);
        });

        operatorPosition = Position.fromTopLeft(top, left);
        if (operator.isSendToGroupEmail) {
          tablePosition = Position.fromTopLeft(top, left);
        } else {
          tablePosition = Position.fromTopLeft(top, left + Distance.OperatorToTable);
        }
        this.setOperatorPosition(operator, operatorPosition);
        this.setTablePosition(operator, tablePosition);

        this.maxTop = Math.max(this.maxTop, top + Distance.TableToTable);
      }

      this.model.notGetDataItems.push(operator);
      this.model.map[operator.destTableName] = operator;
    }

    return operator;
  }

  private updateGetOperatorPosition(operator: GetDataOperator) {
    if (!this.model.map[operator.destTableName]) {
      // Prepare Position Before add Item to model
      let position = this.getTablePosition(operator);
      if (!position) {
        position = Position.fromTopLeft(this.maxTop, MIN_TOP);
        this.maxTop += Distance.TableToTable;
        this.setTablePosition(operator, position);
      } else {
        this.maxTop = Math.max(this.maxTop, this.parsePixel(position.top) + Distance.TableToTable);
      }

      this.model.getDataItems.push(operator);
      this.model.map[operator.destTableName] = operator;
      this.model.mapTable[operator.tableSchema.sqlAddress] = operator;

      this.mapColumn[operator.destTableName] = 1;
    }
  }

  private createGetDataOperator(tableSchema: TableSchema, database: DatabaseSchema, addToModel = true): GetDataOperator {
    if (!this.model.mapTable[tableSchema.sqlAddress]) {
      const destTableConf = this.makeDestTableConfig(tableSchema, ETL_OPERATOR_TYPE.GetDataOperator);
      destTableConf.dbDisplayName = database.displayName || database.name;
      const newOperator = new GetDataOperator(tableSchema, destTableConf);
      if (addToModel) {
        this.updateGetOperatorPosition(newOperator);
      }
      return newOperator;
    }
    return this.model.mapTable[tableSchema.sqlAddress] as GetDataOperator;
  }

  private processUpdateOperator<T extends EtlOperator>(destTableName: string, processUpdate: (operator: T) => void) {
    this.leafOperators.forEach(rootOperator => {
      rootOperator.getAllNotGetDataOperators().forEach(operator => {
        if (operator.destTableName === destTableName) {
          processUpdate(operator as T);
        }
      });
    });
  }

  private async startJoinOperatorFromTable(operator: EtlOperator, database: DatabaseSchema, table: TableSchema) {
    Log.info('startJoinOperator::showLoading');
    const rightOperator = this.createGetDataOperator(table, database, false);
    const leftSchema = this.getTableSchema(operator);
    const rightSchema = cloneDeep(rightOperator.tableSchema);
    rightSchema.dbName = this.model.dbName;
    rightSchema.name = rightOperator.destTableName;
    rightSchema.displayName = rightOperator.destTableConfiguration.tblDisplayName;
    if (this.joinTable && leftSchema && rightSchema) {
      Log.info('startJoinOperator::joinTable.loading');
      // @ts-ignore
      this.joinTable?.add(operator, rightOperator, leftSchema, rightSchema, (newOperator: JoinOperator) => {
        this.updateGetOperatorPosition(rightOperator);
        this.handleNewOperator(operator, newOperator);
      });
    } else {
      this.showAddOperatorError([operator]);
    }
  }

  private async startJoinOperatorFromOperator(operator: EtlOperator, joinWith: EtlOperator) {
    Log.info('startJoinOperatorFromOperator::showLoading');
    const rightOperator = joinWith;
    const leftSchema = this.getTableSchema(operator);
    const rightSchema = this.getTableSchema(joinWith);
    if (this.joinTable && leftSchema && rightSchema) {
      Log.info('startJoinOperatorFromOperator::joinTable.loading');
      // @ts-ignore
      this.joinTable?.add(operator, rightOperator, leftSchema, rightSchema, (newOperator: JoinOperator) => {
        this.handleNewOperator(operator, newOperator);
      });
    } else {
      this.showAddOperatorError([operator]);
    }
  }

  private async editJoinOperator(operator: JoinOperator) {
    const leftOpe = operator.joinConfigs[0]?.leftOperator;
    const rightOpe = operator.joinConfigs[0]?.rightOperator;
    if (leftOpe && rightOpe) {
      const leftSchema = this.getTableSchema(leftOpe);
      const rightSchema = this.getTableSchema(rightOpe);
      Log.info({
        joinTable: this.joinTable,
        leftSchema,
        rightSchema
      });
      if (this.joinTable && leftSchema && rightSchema) {
        // @ts-ignore
        this.joinTable?.edit(operator, leftSchema, rightSchema, (updatedOperator: JoinOperator) => {
          this.processUpdateOperator<JoinOperator>(updatedOperator.destTableName, ope => {
            ope.joinConfigs[0].conditions = updatedOperator.joinConfigs[0].conditions;
            ope.joinConfigs[0].joinType = updatedOperator.joinConfigs[0].joinType;
          });
          this.previewOperator(operator, true);
        });
      } else {
        this.showEditOperatorError([leftOpe, rightOpe]);
      }
    }
  }

  /**
   * append new operator to original operator like. operator -> newOperator
   */
  private handleNewOperator(parentOperator: EtlOperator | null, newOperator: EtlOperator | null) {
    if (newOperator) {
      Log.debug('handleNewOperator::', newOperator?.destTableName);
      const parentName = parentOperator?.destTableName;
      const currentLeafIndex: number = this.leafOperators.findIndex(operator => operator.destTableName === parentName);
      Log.debug('handleNewOperator::parentOperators::parentName', parentName, 'currentLeafIndex', currentLeafIndex);
      if (currentLeafIndex >= 0) {
        Log.debug('handleNewOperator:: parent is leaf node');
        this.leafOperators[currentLeafIndex] = newOperator;
        this.leafOperators = this.leafOperators.concat([]);
      } else {
        this.leafOperators = this.leafOperators.concat(newOperator);
      }
      Log.debug('handleNewOperator::leafOperators:size', this.leafOperators.length);

      this.leafOperators = this.compactOperators(this.leafOperators);
      Log.debug('handleNewOperator::afterCompact::leafOperators:size', this.leafOperators.length);

      this.handleAfterAddOperator(newOperator);
    }
  }

  /**
   * Remove sub leaf operator(is a child of other leaf operator)
   */
  private compactOperators(leafOperators: EtlOperator[]): EtlOperator[] {
    return leafOperators.filter((leafOperator: EtlOperator) => {
      const otherLeafOperators: EtlOperator[] = leafOperators.filter(operator => operator.destTableName !== leafOperator.destTableName);
      const isSubOperator: boolean = otherLeafOperators.some((otherLeafOperator: EtlOperator) =>
        otherLeafOperator.isExistOperatorName(leafOperator.destTableName)
      );
      return !isSubOperator;
    });
  }

  private handleAfterAddOperator(newOperator: EtlOperator) {
    if (newOperator.isGetData) {
      this.updateGetOperatorPosition(newOperator as GetDataOperator);
    } else {
      this.updateNotGetOperatorPosition(newOperator);
    }
    if (!newOperator.isSendToGroupEmail) {
      this.selectPreviewOperator(newOperator);
    }
  }

  private clearAll() {
    this.leafOperators = [];
    this.model = new ManageEtlModel();
    this.maxTop = MIN_TOP;
  }

  @Track(TrackEvents.ETLSave, {
    etl_id: (_: ManageEtlOperator) => _.value.id,
    etl_name: (_: ManageEtlOperator) => _.value?.displayName
  })
  private save() {
    const diagramRect = this.diagramPanel?.getInitPosition();
    if (diagramRect) {
      this.model.stagePosition.x = diagramRect.x;
      this.model.stagePosition.y = diagramRect.y;
    }
    const request = new EtlJobRequest(
      this.value.displayName,
      this.leafOperators,
      this.value.scheduleTime,
      new EtlExtraData(
        this.model.extraData,
        this.model.tablePosition,
        this.model.operatorPosition,
        this.model.savedTablePosition,
        this.model.savedEmailConfigPosition,
        this.model.savedThirdPartyPosition,
        this.model.stagePosition
      ),
      this.value.config
    );
    this.saveEtl.save(this.value.id, request);
  }

  private handleSaveEtl(data: EtlJobRequest) {
    this.value.displayName = data.displayName;
    this.value.scheduleTime = data.scheduleTime;
    this.$emit('change');
    RouterUtils.to(Routers.MyEtl);
  }

  @Ref()
  private selectSourcePopover!: SelectSourcePopover;

  @Track(TrackEvents.ETLAddSource)
  showSelectSourcePopover(e: MouseEvent) {
    if (this.selectSourcePopover && e) {
      Log.info(e);
      // @ts-ignore
      this.selectSourcePopover.show(e.target as HTMLElement);
    }
  }

  private onSelectSource(database: DatabaseSchema, table: TableSchema) {
    if (!this.model.mapTable[table.sqlAddress]) {
      const newOperator = this.createGetDataOperator(table, database);
      this.handleNewOperator(null, newOperator);
      this.$nextTick(() => {
        this.highlightTable(table);
      });
    } else {
      this.highlightTable(table);
    }
  }

  private highlightTable(table: TableSchema) {
    const tables = this.getRenderTableItems([table]);
    if (tables[0]) {
      window.$(tables[0]).addClass('etl-highlight');
      setTimeout(() => {
        window.$(tables[0]).removeClass('etl-highlight');
      }, 3000);
    }
  }

  private get previewEtlResponse() {
    if (this.previewEtl) {
      return this.getPreviewEtlResponse(this.previewEtl);
    }
    return null;
  }

  private handleSaveToDataWareHouse(operator: EtlOperator) {
    const tableSchema = this.getPreviewEtlResponse(operator)?.data?.tableSchema ?? null;
    if (tableSchema) {
      // @ts-ignore
      this.saveToDataWareHouse.save(operator, tableSchema, (persistConfiguration: PersistConfiguration) => {
        operator.isPersistent = true;
        operator.persistConfiguration = persistConfiguration;
        Log.info('handleSaveToDatabase', operator);
      });
    } else {
      this.showSaveToDatabaseError(operator);
    }
  }

  private handleSaveToDatabase(operator: EtlOperator, thirdPartyConfigIndex = -1) {
    Log.info('handleSaveToDatabase', operator, thirdPartyConfigIndex);
    const tableSchema = this.getPreviewEtlResponse(operator)?.data?.tableSchema ?? null;
    if (tableSchema) {
      this.saveToDatabase.save(
        operator,
        tableSchema,
        (thirdPartyConfig: ThirdPartyPersistConfiguration, index: number) => {
          operator.isPersistent = true;
          Log.debug('update::saveToDatabase::thirdPartyConfig::', thirdPartyConfig);
          if (index >= 0) {
            this.$set(operator.thirdPartyPersistConfigurations, index, thirdPartyConfig);
            Log.debug('update::saveToDatabase::operator::', operator);
          } else {
            operator.thirdPartyPersistConfigurations.push(thirdPartyConfig as never);
          }
        },
        thirdPartyConfigIndex
      );
    } else {
      this.showSaveToDatabaseError(operator);
    }
  }

  private handleNewSaveToEmail(operator: EtlOperator) {
    this.sendToEmail.showCreateModal([operator], (newOperator: SendToGroupEmailOperator) => {
      this.handleNewOperator(operator, newOperator);
    });
  }

  private handleEditSaveToEmail(operator: EtlOperator) {
    if (operator.isSendToGroupEmail) {
      this.sendToEmail.showEditModal(operator as SendToGroupEmailOperator, (newOperator: SendToGroupEmailOperator) => {
        this.processUpdateOperator<SendToGroupEmailOperator>(operator.destTableName, operator => {
          Object.assign(operator, newOperator);
        });
      });
    } else if (operator.emailConfiguration) {
      const groupEmailOperator: SendToGroupEmailOperator = this.toSendGroupEmailOperator(operator);
      this.sendToEmail.showEditModal(groupEmailOperator, (newOperator: SendToGroupEmailOperator) => {
        this.handleRemoveSendToEmail(operator);
        const position = this.getSavedEmailConfigPosition(operator);
        this.handleNewOperator(operator, newOperator);
        this.setSavedEmailConfigPosition(newOperator, position);
      });
    }
  }

  private removeSaveToDataWareHouse(operator: EtlOperator) {
    operator.isPersistent = false;
    operator.persistConfiguration = null;
  }

  private handleRemoveSendToEmail(operator: EtlOperator) {
    Log.info('removeSendToEmail::', operator.isSendToGroupEmail);
    if (operator.isSendToGroupEmail) {
      this.handleRemoveOperator(operator);
    } else {
      // old operator
      operator.isPersistent = false;
      operator.emailConfiguration = null;
    }
  }

  @Watch('operators', { deep: true })
  private onOperatorsChanged() {
    if (this.leafOperators.length <= 0) {
      this.model = new ManageEtlModel();
      this.maxTop = MIN_TOP;
    }
  }

  private removeThirdPartyPersistConfig(operator: EtlOperator, thirdPartyConfigIndex: number) {
    operator.isPersistent = false;
    operator.thirdPartyPersistConfigurations = ListUtils.removeAt(operator.thirdPartyPersistConfigurations!, thirdPartyConfigIndex);
  }
}
