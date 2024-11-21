import EtlModal from '@/screens/data-cook/components/etl-modal/EtlModal.vue';
import { Component, Ref, Vue } from 'vue-property-decorator';
import { EtlOperator, PersistConfiguration, PERSISTENT_TYPE } from '@core/data-cook';
import cloneDeep from 'lodash/cloneDeep';
import SelectDatabaseAndTable from '../select-database-and-table/SelectDatabaseAndTable.vue';
import { TableSchema } from '@core/common/domain';
import { TrackingUtils } from '@core/tracking/TrackingUtils';
import { TrackEvents } from '@core/tracking/enum/TrackEvents';
import { Track } from '@/shared/anotation';
import { Log } from '@core/utils';

@Component({
  components: {
    EtlModal,
    SelectDatabaseAndTable
  }
})
export default class SaveToDataWareHouse extends Vue {
  private model: PersistConfiguration | null = null;
  private callback: ((persistConfiguration: PersistConfiguration) => void) | null = null;
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

  save(operator: EtlOperator, callback: (persistConfiguration: PersistConfiguration) => void) {
    this.isUpdate = !!operator.persistConfiguration;
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
    this.loading = false;
  }

  @Track(TrackEvents.ETLSubmitSaveToDataWarehouse)
  private async submit() {
    if (!this.selectDatabaseAndTable) return;
    try {
      this.loading = true;
      const newTableSchema: TableSchema | null = await this.selectDatabaseAndTable.getData();
      if (newTableSchema && this.model && this.callback) {
        this.model.dbName = newTableSchema.dbName;
        this.model.tblName = newTableSchema.name;
        this.callback(this.model);
        this.modal.hide();
      }
    } catch (ex) {
      Log.error('SaveToDataWareHouse.submit::error', ex);
    } finally {
      this.loading = false;
    }
  }
}
