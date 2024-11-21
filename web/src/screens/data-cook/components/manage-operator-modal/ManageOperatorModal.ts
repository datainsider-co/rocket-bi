import EtlModal from '../etl-modal/EtlModal.vue';
import { Inject, Ref, Vue } from 'vue-property-decorator';
import { ETLOperatorType, ETL_OPERATOR_TYPE_NAME, EtlOperator, TableConfiguration } from '@core/data-cook';

enum VIEW_MODE {
  Add = 'Add',
  Edit = 'Edit'
}

export default abstract class ManageOperatorModal extends Vue {
  protected abstract readonly operatorType: ETLOperatorType;
  protected viewMode: VIEW_MODE = VIEW_MODE.Add;
  protected abstract resetModel(): void;

  @Ref()
  protected modal!: EtlModal;

  @Inject('etlDbDisplayName')
  protected readonly etlDbDisplayName!: string;

  @Inject('getEtlDbName')
  protected readonly getEtlDbName!: () => string;

  @Inject('makeDestTableConfig')
  private readonly makeDestTableConfigInjector!: (leftOperators: EtlOperator[], newOperatorType: ETLOperatorType) => TableConfiguration;

  protected makeDestTableConfig(leftOperators: EtlOperator[]): TableConfiguration {
    return this.makeDestTableConfigInjector(leftOperators, this.operatorType);
  }

  protected get title() {
    return ETL_OPERATOR_TYPE_NAME[this.operatorType];
  }

  protected get actionName() {
    if (this.viewMode === VIEW_MODE.Add) return 'Add';
    return 'Update';
  }

  protected startCreate() {
    this.viewMode = VIEW_MODE.Add;
  }

  protected startEdit() {
    this.viewMode = VIEW_MODE.Edit;
  }

  protected show() {
    // @ts-ignore
    this.modal.show();
  }

  protected hide() {
    // @ts-ignore
    this.modal.hide();
  }
}
