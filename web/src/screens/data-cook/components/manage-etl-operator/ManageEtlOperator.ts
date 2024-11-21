import { Component, Prop, Provide, Ref, Vue, Watch } from 'vue-property-decorator';
import {
  CheckProgressResponse,
  DataCookService,
  EmailConfiguration,
  EtlDatabaseNameResponse,
  EtlExtraData,
  EtlJobInfo,
  EtlJobRequest,
  EtlOperator,
  ETLOperatorType,
  GetDataOperator,
  JoinOperator,
  ManageFieldOperator,
  PersistConfiguration,
  PivotTableOperator,
  Position,
  PositionValue,
  PreviewEtlResponse,
  QueryOperator,
  SendToGroupEmailOperator,
  TableConfiguration,
  TransformOperator
} from '@core/data-cook';
import { Log } from '@core/utils';
import JoinTable from '../manage-operator-modal/join-table/JoinTable.vue';
import SelectSource from '../select-source/SelectSource.vue';
import OperatorContextMenu from '../operator-context-menu/OperatorContextMenu.vue';
import TableContextMenu from '../table-context-menu/TableContextMenu.vue';
import { DatabaseInfo, DIException, TableSchema, WidgetExtraData } from '@core/common/domain';
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
import { ErrorPreviewETLData, EtlJobData } from '@core/data-cook/domain/etl/EtlJobData';
import camelCase from 'lodash/camelCase';
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
import { RouterUtils } from '@/utils/RouterUtils';
import { Routers } from '@/shared';
import { Track } from '@/shared/anotation';
import { TrackEvents } from '@core/tracking/enum/TrackEvents';
import { OperatorHandler } from '@/screens/data-cook/components/manage-etl-operator/OperatorHandler';

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

  private maxTop = MIN_TOP;

  private selectedOperator: EtlOperator | null = null;
  // for show border
  private currentEmailConfigOverlap: SavedEmailConfig | null = null;

  @Prop({ type: Object, default: () => null })
  private value!: EtlJobInfo;

  @Ref()
  private readonly diagramPanel?: DiagramPanel;

  @Ref()
  private readonly operatorType?: OperatorType;

  @Ref()
  private readonly saveEtl!: SaveEtl;

  @Ref()
  private readonly joinTable!: JoinTable;

  @Ref()
  private readonly queryTable!: QueryTable;

  @Ref()
  private readonly pivotTable!: PivotTable;

  @Ref()
  private readonly transformTable!: TransformTable;

  @Ref()
  private readonly operatorContextMenu!: OperatorContextMenu;

  @Ref()
  private readonly tableContextMenu!: TableContextMenu;

  @Ref()
  private readonly savedTableContextMenu!: SavedTableContextMenu;

  @Ref()
  private readonly savedEmailConfigContextMenu!: SavedEmailConfigContextMenu;

  @Ref()
  private readonly savedPartyConfigContextMenu!: SavedPartyConfigContextMenu;

  @Ref()
  private readonly manageFields!: ManageFields;

  @Ref()
  private readonly saveToDataWareHouse!: SaveToDataWareHouse;

  @Ref()
  private readonly saveToDatabase!: SaveToDatabase;

  @Ref()
  private readonly sendToEmail!: SendToEmail;

  @Ref()
  private readonly renameModal!: DiRenameModal;

  @Ref()
  private readonly savedEmailConfigs!: SavedEmailConfig[];

  @Ref()
  private readonly sourceTableItems!: TableItem[];

  private operatorHandler: OperatorHandler;

  constructor() {
    super();
    this.operatorHandler = new OperatorHandler(this.value);
  }

  private getPreviewTableLabel(operator: EtlOperator): string {
    if (operator.isGetData) {
      return operator.destDatabaseDisplayName + '.' + operator.destTableDisplayName;
    } else {
      return operator.destTableDisplayName;
    }
  }

  mounted() {
    this.initModel();
  }

  private async initModel() {
    try {
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

      Log.info('initModel::operators', this.operatorHandler.leavesOperators.length);
      await this.loadEtlDatabase();
      // Init All Get / NotGet Operators
      this.operatorHandler.leavesOperators.forEach(operator => {
        operator.getAllGetOperators().forEach(getDataOpe => {
          this.updateGetOperatorPosition(getDataOpe);
        });
        operator.getAllNotGetOperators().forEach(ope => {
          this.updateNonGetOperatorPosition(ope);
        });
      });
      this.multiPreviewOperators(this.operatorHandler.leavesOperators, true);
      if (ListUtils.isNotEmpty(this.operatorHandler.allOperators)) {
        this.selectOperator(ListUtils.getHead(this.operatorHandler.allOperators)!, false);
      }
    } catch (ex) {
      Log.error('initModel::', ex);
    } finally {
      this.loading = false;
    }
  }

  @Provide('etlDbDisplayName')
  private etlDbDisplayName = 'ETL Database';

  @Provide('getEtlDbName')
  private getEtlDbName(): string {
    return this.model.dbName ?? '';
  }

  @Provide('makeDestTableConfig')
  private makeDestTableConfig(leftOperators: EtlOperator[] | TableSchema, newOperatorType: ETLOperatorType): TableConfiguration {
    let tableName = '';
    if (leftOperators instanceof TableSchema) {
      const tableSchema = leftOperators as TableSchema;
      tableName = tableSchema.name;
    } else {
      Log.debug('makeDestTableConfig::leftOps::', leftOperators);
      let leftOps = leftOperators;
      let ope = ListUtils.isNotEmpty(leftOperators) ? leftOperators[0] : null;
      while (true) {
        if (ope && ListUtils.isNotEmpty(ope.getParentOperators()) && leftOps.length < 2) {
          tableName = ope.destTableName;
          leftOps = ope.getParentOperators();
          ope = leftOps[0];
          Log.debug('makeDestTableConfig::loop::leftOps::', leftOps);
        } else {
          Log.debug('makeDestTableConfig::Failcase::', ope?.getParentOperators());
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
    return this.operatorHandler.notGetDataItems;
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
        this.handleAddOperator(ListUtils.getHead(newOperator.operators) || null, newOperator);
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
      this.makeDestTableConfig(parentOperators, ETLOperatorType.SendToGroupEmailOperator),
      ListUtils.unique([...sourceOperator.receivers, ...destOperator.receivers]),
      ListUtils.unique([...sourceOperator.cc, ...destOperator.cc]),
      ListUtils.unique([...sourceOperator.bcc, ...destOperator.bcc]),
      sourceOperator.subject || destOperator.subject,
      ListUtils.unique([...sourceOperator.fileNames, ...destOperator.fileNames]),
      sourceOperator.content || destOperator.content,
      sourceOperator.displayName || destOperator.displayName,
      sourceOperator.isZip || destOperator.isZip,
      sourceOperator.fileType || destOperator.fileType
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
      const tableConfiguration: TableConfiguration = this.makeDestTableConfig([operator], ETLOperatorType.SendToGroupEmailOperator);
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

  private async loadEtlDatabase(): Promise<void> {
    const response: EtlDatabaseNameResponse = await this.dataCookService.getDatabaseName(this.value.id);
    this.model.dbName = response.databaseName;
  }

  private retryPreviewOperator(operator: EtlOperator) {
    this.$delete(this.model.mapPreviewData, operator.destTableName);
    return this.previewOperator(operator, true);
  }

  private selectOperator(operator: EtlOperator, isForceMode: boolean): void {
    const prevSelectedOperator: EtlOperator | null = this.selectedOperator;
    this.selectedOperator = operator;
    if (prevSelectedOperator?.destTableName !== operator.destTableName) {
      this.previewOperator(operator, isForceMode);
    }
  }

  private renderLoading(operators: EtlOperator[], isLoading: boolean) {
    operators.forEach(operator => {
      Log.info('renderLoading::', operator.destTableName, 'isLoading', isLoading);
      if (isLoading) {
        this.$set(this.model.mapLoading, operator.destTableName, true);
      } else {
        this.$delete(this.model.mapLoading, operator.destTableName);
      }
    });
  }

  /**
   * multi preview operators, if isClearServerCache is true, clear server cache
   */
  private async multiPreviewOperators(operators: EtlOperator[], isForceMode: boolean): Promise<void> {
    if (ListUtils.isNotEmpty(operators)) {
      const uniqueOperators: EtlOperator[] = uniqBy(operators.map(operator => operator.getAllOperators()).flat(), operator => operator.destTableName);
      try {
        this.renderLoading(uniqueOperators, true);
        const previewData: PreviewEtlResponse = await this.dataCookService.multiPreview(this.value.id, operators, isForceMode);
        this.renderData(previewData);
        this.renderError(previewData);
      } catch (ex) {
        Log.error('multiPreview::error', ex);
        this.renderErrorByOperators(uniqueOperators, ex.message);
      } finally {
        this.renderLoading(uniqueOperators, false);
      }
    }
  }

  private renderData(previewData: PreviewEtlResponse): void {
    if (previewData.data) {
      previewData.data.allTableSchemas.forEach(tableSchema => {
        this.$set(this.model.mapPreviewData, tableSchema.name, CheckProgressResponse.success(new EtlJobData(tableSchema)));
      });
    }
  }

  /**
   * render error from this operator
   * @param previewData
   * @private
   */
  private renderError(previewData: PreviewEtlResponse): void {
    previewData.errors.forEach(errorData => {
      this.$set(this.model.mapPreviewData, errorData.errorTblName, CheckProgressResponse.error(errorData));
      const tableNameError: string = errorData.errorTblName;
      Log.info('renderError::', tableNameError);
      const rootOperatorError: EtlOperator | undefined = this.operatorHandler.allOperators.find(operator => operator.destTableName === tableNameError);
      const relativeOperatorErrors: EtlOperator[] = this.operatorHandler.leavesOperators.flatMap(operator => {
        return operator.getAllOperators().filter((operator: EtlOperator) => {
          return operator.destTableName !== tableNameError && operator.isIncludeOperator(tableNameError);
        });
      });
      if (rootOperatorError) {
        this.renderErrorByOperators(
          relativeOperatorErrors,
          `[Cannot Preview] There is errors at previous operations: <strong>${rootOperatorError.getReadableOperatorClassName()}</strong> of <strong>${tableNameError}</strong>`
        );
      } else {
        this.renderErrorByOperators(relativeOperatorErrors, `[Cannot Preview] There is errors at previous operations: <strong>${tableNameError}</strong>`);
      }
    });
  }

  private renderErrorByOperators(operators: EtlOperator[], message: string): void {
    operators.forEach(operator => {
      this.$set(
        this.model.mapPreviewData,
        operator.destTableName,
        new CheckProgressResponse(0, JobStatus.Error, null, new ErrorPreviewETLData(message, operator.destTableName))
      );
    });
  }

  /**
   * preview a operator
   */
  private async previewOperator(operator: EtlOperator, isForceMode: boolean): Promise<void> {
    const isEmptyData = !this.model.mapPreviewData[operator.destTableName];
    const isPreviewing = this.model.mapLoading[operator.destTableName];
    if (isForceMode) {
      await this.multiPreviewOperators(this.operatorHandler.leavesOperators, true);
    } else if (isEmptyData && !isPreviewing) {
      let operators: EtlOperator[] = this.operatorHandler.leavesOperators.filter(leafOperator => leafOperator.isIncludeOperator(operator.destTableName));
      if (ListUtils.isEmpty(operators)) {
        operators = [operator];
      }
      await this.multiPreviewOperators(operators, false);
    }
  }

  private getOperatorId(operator: EtlOperator, subfix?: string): string {
    return ['operator', operator.destTableName, subfix || ''].join('_');
  }

  private isError(operator: EtlOperator) {
    const isError: boolean = this.getPreviewEtlResponse(operator)?.isError ?? false;
    if (isError) {
      return true;
    } else {
      const isParentError: boolean = operator.getAllOperators().some(parentOperator => {
        const response: CheckProgressResponse | null = this.getPreviewEtlResponse(parentOperator);
        return response && response.isError;
      });
      return isParentError;
    }
  }

  private calculateMousePosition(e: MouseEvent): { top: number; left: number } {
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

  private showGetOperatorMenu(operator: EtlOperator, e: MouseEvent) {
    // Log.info('showOperatorMenu', e);
    // this.previewOperator(operator);
    const pos = this.calculateMousePosition(e);
    this.tableContextMenu.showPopover(operator, pos.top, pos.left);
  }

  private showSavedTableContextMenu(operator: EtlOperator, e: MouseEvent) {
    const pos = this.calculateMousePosition(e);
    this.savedTableContextMenu.showPopover(operator, pos.top, pos.left);
  }

  private showSavedEmailConfigContextMenu(operator: EtlOperator, e: MouseEvent) {
    const pos = this.calculateMousePosition(e);
    this.savedEmailConfigContextMenu.showPopover(operator, pos.top, pos.left);
  }

  private showSavedThirdPartyConfigContextMenu(operator: EtlOperator, thirdPartyConfig: ThirdPartyPersistConfiguration, index: number, e: MouseEvent) {
    Log.debug('showSavedThirdPartyConfigContextMenu::', thirdPartyConfig, index);
    const pos = this.calculateMousePosition(e);
    this.savedPartyConfigContextMenu.showPopover(operator, thirdPartyConfig, index, pos.top, pos.left);
  }

  private showNotGetOperatorMenu(operator: EtlOperator, e: MouseEvent) {
    const pos = this.calculateMousePosition(e);
    this.operatorContextMenu.showPopover(operator, pos.top, pos.left);
  }

  private handleEditOperator(operator: EtlOperator) {
    switch (operator.className) {
      case ETLOperatorType.JoinOperator:
        this.editJoinOperator(operator as JoinOperator);
        break;
      case ETLOperatorType.SQLQueryOperator:
      case ETLOperatorType.PythonOperator:
        this.editQueryOperator(operator as QueryOperator);
        break;
      case ETLOperatorType.PivotTableOperator:
        this.editPivotTableOperator(operator as PivotTableOperator);
        break;
      case ETLOperatorType.TransformOperator:
        this.editTransformTableOperator(operator as TransformOperator);
        break;
      case ETLOperatorType.ManageFieldOperator:
        this.editManageFieldOperator(operator as ManageFieldOperator);
        break;
      default:
        Swal.fire({
          icon: 'error',
          title: 'Can not edit operator',
          html: `Unsupported edit the operator <strong>${operator.destTableName}</strong>`
        });
    }
  }

  private handleTableContextMenu(operator: EtlOperator, operatorType: ETLOperatorType, payload: TTableContextMenuPayload) {
    switch (operatorType) {
      case ETLOperatorType.JoinOperator:
        if (payload.operator) {
          this.startJoinOperatorFromOperator(operator, payload.operator);
        } else if (payload.database && payload.table) {
          this.startJoinOperatorFromTable(operator, payload.database, payload.table);
        }
        break;
      case ETLOperatorType.SQLQueryOperator:
        this.startSQLQueryOperator(operator);
        break;
      case ETLOperatorType.PythonOperator:
        this.startPythonQueryOperator(operator);
        break;
      case ETLOperatorType.PivotTableOperator:
        this.startPivotTableOperator(operator);
        break;
      case ETLOperatorType.TransformOperator:
        this.startTransformTableOperator(operator);
        break;
      case ETLOperatorType.ManageFieldOperator:
        this.startManageFieldOperator(operator);
        break;
      default:
        Swal.fire({
          icon: 'error',
          title: 'Can not add operator',
          html: `Unsupported add the operator <strong>${operator.destTableName}</strong>`
        });
    }
  }

  @Track(TrackEvents.ETLAddSQLQuery)
  private startSQLQueryOperator(operator: EtlOperator): void {
    const tableSchema = this.getTableSchema(operator);
    if (this.queryTable && tableSchema) {
      Log.debug('startQueryOperator', this.value.id);
      // @ts-ignore
      this.queryTable.addSQLQuery(this.value.id, operator, tableSchema, newOperator => {
        this.handleAddOperator(operator, newOperator, true);
        Log.debug('startQueryOperator::', newOperator);
      });
    } else {
      this.showAddOperatorError([operator]);
    }
  }

  @Track(TrackEvents.ETLAddPythonQuery)
  private startPythonQueryOperator(operator: EtlOperator): void {
    const tableSchema = this.getTableSchema(operator);
    if (this.queryTable && tableSchema) {
      Log.debug('startQueryOperator', this.value.id);
      // @ts-ignore
      this.queryTable.addPythonQuery(this.value.id, operator, tableSchema, newOperator => {
        this.handleAddOperator(operator, newOperator, true);
        Log.debug('startQueryOperator::', newOperator);
      });
    } else {
      this.showAddOperatorError([operator]);
    }
  }

  @Track(TrackEvents.ETLEditSQLQuery)
  private editQueryOperator(operator: QueryOperator): void {
    const tableSchema: TableSchema | null = this.getTableSchema(operator.operator);
    this.queryTable.edit(this.value.id, operator, tableSchema, (newOperator: QueryOperator) => {
      if (operator.query !== newOperator.query) {
        this.handleUpdateOperator<QueryOperator>(newOperator.destTableName, ope => {
          ope.query = newOperator.query;
        });
        this.previewOperator(operator, true);
      }
    });
  }

  private showAddOperatorError(operators: EtlOperator[]) {
    const tblDisplayNames = operators.map(o => o.destTableDisplayName).join(', ');
    Swal.fire({
      icon: 'error',
      title: 'Can not add operator',
      html: `Preview table <strong>${tblDisplayNames}</strong> has error`
    });
  }

  private startPivotTableOperator(operator: EtlOperator): void {
    const tableSchema = this.getTableSchema(operator);
    if (this.pivotTable && tableSchema) {
      // @ts-ignore
      this.pivotTable.add(operator, tableSchema, (newOperator: PivotTableOperator, extraData: WidgetExtraData | undefined) => {
        this.handleAddOperator(operator, newOperator);
        this.$set(this.model.extraData, camelCase(newOperator.destTableName), extraData ?? {});
      });
    } else {
      this.showAddOperatorError([operator]);
    }
  }

  private editPivotTableOperator(operator: PivotTableOperator): void {
    const tableSchema = this.getTableSchema(operator.operator);
    this.pivotTable.edit(
      operator,
      tableSchema,
      this.model.extraData[camelCase(operator.destTableName)],
      (updatedOperator: PivotTableOperator, extraData: WidgetExtraData | undefined) => {
        this.handleUpdateOperator<PivotTableOperator>(updatedOperator.destTableName, ope => {
          ope.query = updatedOperator.query;
        });
        this.$set(this.model.extraData, camelCase(updatedOperator.destTableName), extraData ?? {});
        this.previewOperator(operator, true);
      }
    );
  }

  private getTableSchema(operator: EtlOperator | null | undefined): TableSchema | null {
    if (operator) {
      return this.getPreviewEtlResponse(operator)?.data?.tableSchema ?? null;
    } else {
      return null;
    }
  }

  private startTransformTableOperator(operator: EtlOperator): void {
    const tableSchema = this.getTableSchema(operator);
    if (this.transformTable && tableSchema) {
      // @ts-ignore
      this.transformTable.add(operator, tableSchema, (newOperator: TransformOperator, extraData: WidgetExtraData | undefined) => {
        this.handleAddOperator(operator, newOperator);
        this.$set(this.model.extraData, camelCase(newOperator.destTableName), extraData ?? {});
        Log.info(newOperator);
      });
    } else {
      this.showAddOperatorError([operator]);
    }
  }

  private editTransformTableOperator(operator: TransformOperator): void {
    const tableSchema: TableSchema | null = this.getTableSchema(operator.operator);
    this.transformTable.edit(
      operator,
      tableSchema,
      this.model.extraData[camelCase(operator.destTableName)],
      (updatedOperator: TransformOperator, extraData: WidgetExtraData | undefined) => {
        this.handleUpdateOperator<TransformOperator>(updatedOperator.destTableName, ope => {
          ope.query = updatedOperator.query;
        });
        this.model.extraData[camelCase(updatedOperator.destTableName)] = extraData ?? {};
        this.previewOperator(operator, true);
      }
    );
  }

  private startManageFieldOperator(operator: EtlOperator): void {
    const tableSchema = this.getTableSchema(operator);
    if (this.manageFields && tableSchema) {
      // @ts-ignore
      this.manageFields.add(this.value.id, operator, tableSchema, newOperator => {
        this.handleAddOperator(operator, newOperator, true);
      });
    } else {
      this.showAddOperatorError([operator]);
    }
  }

  private editManageFieldOperator(operator: ManageFieldOperator) {
    const parentSchema: TableSchema | null = this.getTableSchema(operator.operator);
    Log.debug('submit::operator::::pre', cloneDeep(operator.fields));
    this.manageFields.edit(this.value.id, operator, parentSchema, (updatedOperator: ManageFieldOperator) => {
      this.handleUpdateOperator<ManageFieldOperator>(updatedOperator.destTableName, operator => {
        operator.fields = updatedOperator.fields;
        operator.extraFields = updatedOperator.extraFields;
        Log.info('submit::operator::', operator.destTableName, 'updated::', cloneDeep(operator.fields));
      });
      this.previewOperator(operator, true);
    });
  }

  private clearOperatorData(operator: EtlOperator): void {
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
      this.$delete(this.model.mapTable, (operator as GetDataOperator).tableSchema.tableIdAddress);
    }
  }

  @Track(TrackEvents.ETLRemoveOperator)
  private handleRemoveOperator(deletedOperator: EtlOperator) {
    try {
      this.operatorHandler.remove(deletedOperator, removedOperator => {
        this.clearOperatorData(removedOperator);
      });
      const isExist = this.operatorHandler.allOperators.find(operator => operator.destTableName === this.selectedOperator?.destTableName);
      if (!isExist && ListUtils.isNotEmpty(this.operatorHandler.allOperators)) {
        this.selectOperator(ListUtils.getHead(this.operatorHandler.allOperators)!, false);
      }
    } catch (ex) {
      Log.error('handleRemoveOperator', ex);
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
  }

  private parsePixel(pixelValue: string | undefined) {
    return parseFloat((pixelValue || '0').replace('px', ''));
  }

  private getSuggestedTop(operator: EtlOperator) {
    const position = this.getTablePosition(operator);
    let top = this.parsePixel(position?.top) || MIN_TOP;
    const left = (this.parsePixel(position?.left) || MIN_TOP) + Distance.TableToOperator;

    this.operatorHandler.notGetDataItems.forEach(sameLevelOpe => {
      if (sameLevelOpe.getParentOperators().find(ope => ope.destTableName === operator.destTableName)) {
        const sameLevelPosition = this.getTablePosition(sameLevelOpe);
        top = Math.max(top, this.parsePixel(sameLevelPosition?.top) + Distance.TableToTable);
        // left = Math.max(left, this.parsePixel(sameLevelPosition?.left) + Distance.TableToOperator);
      }
    });
    return { top, left };
  }

  private updateNonGetOperatorPosition(operator: EtlOperator) {
    if (!operator.isGetData && !this.model.map[operator.destTableName]) {
      // Prepare Position Before add Item to model
      let operatorPosition = this.getOperatorPosition(operator);
      let tablePosition = this.getTablePosition(operator);
      operator.getParentOperators().forEach(ope => {
        if (!this.mapColumn[ope.destTableName]) {
          throw Error('Not init column yet');
        } else {
          this.mapColumn[operator.destTableName] = this.mapColumn[ope.destTableName] + 1;
        }
      });
      if (!operatorPosition || !tablePosition) {
        let top = MIN_TOP;
        let left = MIN_TOP;
        operator.getParentOperators().forEach(leftOperator => {
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

      this.model.map[operator.destTableName] = operator;
      this.model.mapTable[operator.tableSchema.tableIdAddress] = operator;

      this.mapColumn[operator.destTableName] = 1;
    }
  }

  private createGetDataOperator(tableSchema: TableSchema, database: DatabaseInfo, addToModel = true): GetDataOperator {
    if (!this.model.mapTable[tableSchema.tableIdAddress]) {
      const destTableConf = this.makeDestTableConfig(tableSchema, ETLOperatorType.GetDataOperator);
      destTableConf.dbDisplayName = database.displayName || database.name;
      const newOperator = new GetDataOperator(tableSchema, destTableConf);
      if (addToModel) {
        this.updateGetOperatorPosition(newOperator);
      }
      return newOperator;
    }
    return this.model.mapTable[tableSchema.tableIdAddress] as GetDataOperator;
  }

  private handleUpdateOperator<T extends EtlOperator>(destTableName: string, processUpdate: (operator: T) => void) {
    this.operatorHandler.leavesOperators.forEach(rootOperator => {
      rootOperator.getAllNotGetOperators().forEach(operator => {
        if (operator.destTableName === destTableName) {
          processUpdate(operator as T);
        }
      });
    });
  }

  private startJoinOperatorFromTable(operator: EtlOperator, database: DatabaseInfo, table: TableSchema): void {
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
        this.handleAddOperator(operator, newOperator);
      });
    } else {
      this.showAddOperatorError([operator]);
    }
  }

  private startJoinOperatorFromOperator(operator: EtlOperator, joinWith: EtlOperator): void {
    Log.info('startJoinOperatorFromOperator::showLoading');
    const rightOperator = joinWith;
    const leftSchema = this.getTableSchema(operator);
    const rightSchema = this.getTableSchema(joinWith);
    if (this.joinTable && leftSchema && rightSchema) {
      Log.info('startJoinOperatorFromOperator::joinTable.loading');
      // @ts-ignore
      this.joinTable?.add(operator, rightOperator, leftSchema, rightSchema, (newOperator: JoinOperator) => {
        this.handleAddOperator(operator, newOperator);
      });
    } else {
      this.showAddOperatorError([operator]);
    }
  }

  private editJoinOperator(operator: JoinOperator): void {
    const leftOperator: EtlOperator | undefined = operator.joinConfigs[0]?.leftOperator;
    const rightOperator: EtlOperator | undefined = operator.joinConfigs[0]?.rightOperator;
    const leftSchema = this.getTableSchema(leftOperator);
    const rightSchema = this.getTableSchema(rightOperator);
    this.joinTable.edit(operator, leftSchema, rightSchema, (updatedOperator: JoinOperator) => {
      this.handleUpdateOperator<JoinOperator>(updatedOperator.destTableName, ope => {
        ope.joinConfigs[0].conditions = updatedOperator.joinConfigs[0].conditions;
        ope.joinConfigs[0].joinType = updatedOperator.joinConfigs[0].joinType;
      });
      this.previewOperator(operator, true);
    });
  }

  /**
   * append new operator to original operator like. operator -> newOperator
   * @param parentOperator - original operator
   * @param newOperator - new operator
   * @param isForceMode - if true, will force reload data from server
   */
  private handleAddOperator(parentOperator: EtlOperator | null, newOperator: EtlOperator | null, isForceMode = false) {
    if (newOperator) {
      const parentName: string | undefined = parentOperator?.destTableName || '';
      this.operatorHandler.addNewOperator(newOperator, parentName);
      this.completeAddOperator(newOperator);
      if (newOperator.isNeedReloadData) {
        this.selectOperator(newOperator, isForceMode);
      }
    }
  }

  private completeAddOperator(newOperator: EtlOperator) {
    if (newOperator.isGetData) {
      this.updateGetOperatorPosition(newOperator as GetDataOperator);
    } else {
      this.updateNonGetOperatorPosition(newOperator);
    }
  }

  private clearAll() {
    this.operatorHandler.clearAll();
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
      this.operatorHandler.leavesOperators,
      this.value.scheduleTime,
      this.getETLExtraData(),
      this.value.config
    );
    this.saveEtl.save(this.value.id, request);
  }

  public getETLExtraData(): EtlExtraData {
    return new EtlExtraData(
      this.model.extraData,
      this.model.tablePosition,
      this.model.operatorPosition,
      this.model.savedTablePosition,
      this.model.savedEmailConfigPosition,
      this.model.savedThirdPartyPosition,
      this.model.stagePosition
    );
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

  private onSelectSource(database: DatabaseInfo, table: TableSchema) {
    if (!this.model.mapTable[table.tableIdAddress]) {
      const newOperator = this.createGetDataOperator(table, database);
      this.handleAddOperator(null, newOperator);
    }
  }

  private get previewEtlResponse(): CheckProgressResponse | null {
    if (this.selectedOperator) {
      return this.getPreviewEtlResponse(this.selectedOperator);
    }
    return null;
  }

  private handleSaveToDataWareHouse(operator: EtlOperator) {
    this.saveToDataWareHouse.save(operator, (persistConfiguration: PersistConfiguration) => {
      operator.isPersistent = true;
      operator.persistConfiguration = persistConfiguration;
    });
  }

  private handleSaveToDatabase(operator: EtlOperator, thirdPartyConfigIndex = -1) {
    Log.info('handleSaveToDatabase', operator, thirdPartyConfigIndex);
    this.saveToDatabase.save(
      operator,
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
  }

  private handleNewSaveToEmail(operator: EtlOperator) {
    this.sendToEmail.showCreateModal([operator], (newOperator: SendToGroupEmailOperator) => {
      this.handleAddOperator(operator, newOperator);
    });
  }

  private handleEditSaveToEmail(operator: EtlOperator) {
    if (operator.isSendToGroupEmail) {
      this.sendToEmail.showEditModal(operator as SendToGroupEmailOperator, (newOperator: SendToGroupEmailOperator) => {
        this.handleUpdateOperator<SendToGroupEmailOperator>(operator.destTableName, operator => {
          Object.assign(operator, newOperator);
        });
      });
    } else if (operator.emailConfiguration) {
      const groupEmailOperator: SendToGroupEmailOperator = this.toSendGroupEmailOperator(operator);
      this.sendToEmail.showEditModal(groupEmailOperator, (newOperator: SendToGroupEmailOperator) => {
        this.handleRemoveSendToEmail(operator);
        const position = this.getSavedEmailConfigPosition(operator);
        this.handleAddOperator(operator, newOperator);
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
    if (this.operatorHandler.leavesOperators.length <= 0) {
      this.model = new ManageEtlModel();
      this.maxTop = MIN_TOP;
    }
  }

  private removeThirdPartyPersistConfig(operator: EtlOperator, thirdPartyConfigIndex: number) {
    operator.isPersistent = false;
    operator.thirdPartyPersistConfigurations = ListUtils.removeAt(operator.thirdPartyPersistConfigurations!, thirdPartyConfigIndex);
  }
}
