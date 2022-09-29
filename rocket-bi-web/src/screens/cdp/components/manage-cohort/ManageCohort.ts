import { Component, Ref, Vue } from 'vue-property-decorator';
import DiModal from '@/screens/data-ingestion/components/di-upload-document/components/commons/Modal.vue';
import { CohortBasicInfo, CohortFilter, CohortService } from '@core/cdp';
import { Inject } from 'typescript-ioc';
import { Log } from '@core/utils';
import CohortFilterComponent from '@/screens/cdp/components/cohort-filter/CohortFilterComponent.vue';
import { DIException } from '@core/common/domain';
import { UICohortFilterUtils } from '@/screens/cdp/components/cohort-filter/Cohort2CohortFilter';
import { cloneDeep } from 'lodash';
import { TrackingUtils } from '@core/tracking/TrackingUtils';
import { TrackEvents } from '@core/tracking/enum/TrackEvents';

@Component({
  components: {
    DiModal,
    CohortFilterComponent
  }
})
export default class ManageCohort extends Vue {
  private model: CohortBasicInfo | null = null;
  private loading = false;
  private error = '';

  @Ref()
  private vueScroll: any;

  @Inject
  private cdpService!: CohortService;

  show(cohortFilter: CohortBasicInfo | undefined) {
    // @ts-ignore
    this.$refs.modal.show();
    this.model = this.initModel(cohortFilter);
  }

  private resetModel() {
    this.error = '';
    this.model = null;
    this.loading = false;
  }

  private initModel(cohort?: CohortBasicInfo | null): CohortBasicInfo {
    Log.debug('initModel::cohort', cohort);
    this.loading = false;
    if (cohort) {
      return cloneDeep(cohort);
    } else {
      return CohortBasicInfo.default();
    }
  }

  private get title() {
    return this.isUpdateMode ? 'Update Cohort' : 'Create New Cohort';
  }

  private get isUpdateMode() {
    return !!this.model?.id;
  }

  private saveCohort() {
    if (this.isUpdateMode) {
      this.updateCohort();
      TrackingUtils.track(TrackEvents.SubmitEditCohort, {
        cohort_id: this.model?.id,
        cohort_name: this.model?.name,
        cohort_filter: JSON.stringify(this.model?.cohortFilter)
      });
    } else {
      this.createCohort();
      TrackingUtils.track(TrackEvents.SubmitCreateCohort, {
        cohort_name: this.model?.name,
        cohort_filter: JSON.stringify(this.model?.cohortFilter)
      });
    }
  }

  private hide() {
    // @ts-ignore
    this.$refs.modal.hide();
  }

  private async createCohort() {
    if (this.model) {
      try {
        this.loading = true;
        this.error = '';
        Log.debug('createCohort:: model', this.model);
        const cohortFilter: CohortFilter | null = UICohortFilterUtils.toCohortFilter(this.model.extraData?.filterGroup ?? []);
        this.ensureCohort(this.model, cohortFilter);
        this.model.cohortFilter = cohortFilter!;
        const filter = await this.cdpService.createCohortFilter(this.model);
        this.loading = false;
        this.$emit('created', filter);
        this.hide();
      } catch (ex) {
        Log.trace(ex);
        this.error = ex.message;
        this.loading = false;
      }
    }
  }

  private async updateCohort() {
    if (this.model && this.model.id) {
      try {
        this.loading = true;
        this.error = '';
        const filter = await this.cdpService.updateCohortFilter(this.model.id, this.model);
        Log.info(filter);
        this.loading = false;
        this.$emit('updated', filter);
        this.hide();
      } catch (e) {
        this.error = e.message;
        this.loading = false;
      }
    }
  }

  private ensureCohort(model: CohortBasicInfo | null, filter: CohortFilter | null) {
    if (!model) {
      throw new DIException('Not found Cohort!');
    }
    if (!model.name) {
      throw new DIException('Cohort name is required');
    }
    if (!filter) {
      throw new DIException('Filter is required!');
    }
  }

  private onAddGroup() {
    this.$nextTick(() => {
      const filterGroup = this.model?.extraData?.filterGroup ?? [];
      this.vueScroll?.scrollIntoView(`#filter-group-${filterGroup.length - 1}`, 500);
    });
  }
}
