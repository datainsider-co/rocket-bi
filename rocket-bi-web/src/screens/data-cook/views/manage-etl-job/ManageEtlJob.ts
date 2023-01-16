import { Component, Prop, Ref, Vue, Watch } from 'vue-property-decorator';
import { Inject } from 'typescript-ioc';
import { DataCookService, EtlJobInfo, EtlJobRequest } from '@core/data-cook';
import { Log } from '@core/utils';
import ManageEtlOperator from '@/screens/data-cook/components/manage-etl-operator/ManageEtlOperator.vue';
import { Routers } from '@/shared';
import DiRenameModal from '@/shared/components/DiRenameModal.vue';
import { ETL_JOB_NAME_INVALID_REGEX } from '@/screens/data-cook/components/manage-etl-operator/Constance';
import { Route } from 'vue-router';
import { NavigationGuardNext } from 'vue-router/types/router';
import cloneDeep from 'lodash/cloneDeep';
import isEqual from 'lodash/isEqual';
import Swal from 'sweetalert2';
import { NoneScheduler } from '@/screens/data-ingestion/components/job-scheduler-form/scheduler-time/NoneScheduler';
import { LayoutContent, LayoutHeader, LayoutNoData } from '@/shared/components/layout-wrapper';
import ParamInfo, { RouterUtils } from '@/utils/RouterUtils';
import { TimeScheduler } from '@/screens/data-ingestion/components/job-scheduler-form/scheduler-time/TimeScheduler';

@Component({
  components: {
    ManageEtlOperator,
    DiRenameModal,
    LayoutContent,
    LayoutHeader,
    LayoutNoData
  }
})
export default class ManageEtlJob extends Vue {
  @Inject
  private dataCookService!: DataCookService;

  @Ref()
  private manageEtlOperator!: ManageEtlOperator;

  @Ref()
  private renameModal!: DiRenameModal;

  private get id(): string {
    return this.paramInfo.id;
  }

  private get paramInfo(): ParamInfo {
    return RouterUtils.parseToParamInfo(this.$route.params.name);
  }

  private listEtlJobRoute = { name: Routers.MyEtl };
  private loading = false;
  private errorMsg = '';
  private model: EtlJobInfo | null = null;
  private cachedModel: EtlJobInfo | null = null;

  private mounted() {
    this.initData();
    window.addEventListener('beforeunload', this.handleBeforeUnloadRoute);
  }

  private destroyed() {
    window.removeEventListener('beforeunload', this.handleBeforeUnloadRoute);
  }

  private async initData() {
    if (this.paramInfo.isIdNumber()) {
      await this.handleLoadEtl(this.paramInfo.idAsNumber());
    } else if (!this.paramInfo.id) {
      await this.handleCreateEtl();
    } else {
      this.loading = true;
      this.model = null;
      this.errorMsg = 'not found etl job';
      this.loading = false;
      this.handleModelChanged();
    }
  }

  private async handleLoadEtl(id: number) {
    try {
      this.loading = true;
      this.model = await this.dataCookService.getEtl(id);
      this.loading = false;
      this.handleModelChanged();
      this.updateRouter(this.model!.id, this.model.displayName);
    } catch (ex) {
      this.errorMsg = ex.message;
      this.model = null;
      this.loading = false;
      this.handleModelChanged();
    }
  }

  private async handleCreateEtl(displayName = 'Untitled ETL'): Promise<void> {
    try {
      this.loading = true;
      const etlJob = new EtlJobRequest(displayName, [], new NoneScheduler());
      this.model = await this.dataCookService.createEtl(etlJob);
      this.handleModelChanged();
      this.loading = false;
      this.updateRouter(this.model.id, this.model.displayName);
    } catch (ex) {
      Log.error(ex);
      this.errorMsg = ex.message;
      this.model = null;
      this.loading = false;
      this.handleModelChanged();
    }
  }

  private showSelectSourcePopover(e: MouseEvent) {
    if (this.manageEtlOperator) {
      // @ts-ignore
      this.manageEtlOperator.showSelectSourcePopover(e);
    }
  }

  private rename() {
    this.renameModal.show(this.model?.displayName || '', (newName: string) => this.handleSubmitRename(newName));
  }

  private handleSubmitRename(newName: string) {
    Log.info('handleSubmitRename', newName);
    if (!newName) return;
    if (ETL_JOB_NAME_INVALID_REGEX.test(newName)) {
      this.renameModal.setError("Field can't contain special characters");
      return;
    }
    this.renameModal.setLoading(true);
    const temp = new EtlJobRequest(
      newName,
      this.model?.operators ?? [],
      this.model?.scheduleTime ? TimeScheduler.toSchedulerV2(this.model.scheduleTime) : new NoneScheduler()
    );
    this.dataCookService
      .updateEtl(this.model?.id ?? 0, temp)
      .then(() => {
        this.model ? (this.model.displayName = newName) : null;
        this.renameModal.hide();
        this.handleModelChanged();
        this.updateRouter(this.model!.id, newName);
      })
      .catch(e => {
        this.renameModal.setError(e.message);
        this.renameModal.setLoading(false);
      });
  }

  private isModelChanged(): boolean {
    return !isEqual(this.model, this.cachedModel);
  }

  private handleBeforeUnloadRoute(e: BeforeUnloadEvent) {
    if (this.isModelChanged()) {
      const confirmationMessage = 'It looks like you have been editing something. If you leave before saving, your changes will be lost.';

      (e || window.event).returnValue = confirmationMessage; //Gecko + IE
      return confirmationMessage;
    }
  }

  async beforeRouteLeave(to: Route, from: Route, next: NavigationGuardNext<any>) {
    if (this.isModelChanged()) {
      const { isConfirmed } = await Swal.fire({
        icon: 'warning',
        title: 'It looks like you have been editing something',
        html: 'If you leave before saving, your changes will be lost.',
        showConfirmButton: true,
        showCancelButton: true,
        cancelButtonText: 'Cancel',
        confirmButtonText: 'Leave'
      });
      next(isConfirmed ? undefined : false);
    } else {
      next();
    }
  }

  private handleModelChanged() {
    Log.info('ManageEtlJob::handleModelChanged');
    this.cachedModel = cloneDeep(this.model);
  }

  private updateRouter(id: number, newName: string) {
    if (this.paramInfo.idAsNumber() !== id || this.paramInfo.name !== newName) {
      this.$router.replace({
        name: Routers.UpdateEtl,
        params: {
          name: RouterUtils.buildParamPath(id, newName)
        },
        query: this.$route.query
      });
    }
  }

  @Watch('id')
  private onIdChanged(id: string) {
    this.initData();
  }
}
