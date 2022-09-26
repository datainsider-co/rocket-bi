import EtlModal from '@/screens/DataCook/components/EtlModal/EtlModal.vue';
import { Component, Ref, Vue } from 'vue-property-decorator';
import { EtlOperator, PersistConfiguration, PERSISTENT_TYPE } from '@core/DataCook';
import cloneDeep from 'lodash/cloneDeep';
import SelectDatabaseAndTable from '../SelectDatabaseAndTable/SelectDatabaseAndTable.vue';
import { TableSchema } from '@core/domain';
import { TrackingUtils } from '@core/tracking/TrackingUtils';
import { TrackEvents } from '@core/tracking/enum/TrackEvents';
import { Track } from '@/shared/anotation';

type TPersistConfigurationCallback = (persistConfiguration: PersistConfiguration) => void;

@Component({
  components: {
    EtlModal,
    SelectDatabaseAndTable
  }
})
export default class SaveToDataWareHouse extends Vue {
  private model: PersistConfiguration | null = null;
  private tableSchema: TableSchema | null = null;
  private callback: TPersistConfigurationCallback | null = null;
  private isUpdate = false;
  private loading = false;

  @Ref()
  private readonly modal!: EtlModal;

  @Ref()
  private readonly selectDatabaseAndTable!: SelectDatabaseAndTable;

  private get actionName() {
    return this.isUpdate ? 'Update' : 'Add';
  }

  private get persistentTypes() {
    return [PERSISTENT_TYPE.Update, PERSISTENT_TYPE.Append];
  }

  save(operator: EtlOperator, tableSchema: TableSchema, callback: TPersistConfigurationCallback) {
    this.isUpdate = !!operator.persistConfiguration;
    this.tableSchema = tableSchema;
    this.model = this.isUpdate ? cloneDeep(operator.persistConfiguration) : new PersistConfiguration('', '', PERSISTENT_TYPE.Update);
    this.callback = callback;
    // @ts-ignore
    this.modal.show();
    this.trackSaveToDataWarehouse(this.isUpdate);
  }

  private trackSaveToDataWarehouse(isUpdate: boolean) {
    if (isUpdate) {
      TrackingUtils.track(TrackEvents.ETLEditSaveToDataWarehouse, {});
    } else {
      TrackingUtils.track(TrackEvents.ETLSaveToDataWarehouse, {});
    }
  }

  private resetModel() {
    this.model = null;
    this.callback = null;
    this.tableSchema = null;
    this.loading = false;
  }

  @Track(TrackEvents.ETLSubmitSaveToDataWarehouse)
  private async submit() {
    if (!this.selectDatabaseAndTable) return;
    this.loading = true;
    // @ts-ignore
    const data = await this.selectDatabaseAndTable.getData(this.tableSchema);
    this.loading = false;
    if (data && this.tableSchema && this.model && this.callback) {
      this.model.dbName = data.dbName;
      this.model.tblName = data.name;
      this.callback(this.model);
      // @ts-ignore
      this.modal.hide();
    }
  }
}
