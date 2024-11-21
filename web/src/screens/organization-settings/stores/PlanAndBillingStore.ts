import { Action, getModule, Module, Mutation, VuexModule } from 'vuex-module-decorators';
import store from '@/store';
import { Stores } from '@/shared';
import { BillingService, PaymentStatus, ProductInfo, ProductSubscriptionInfo } from '@core/billing';
import { PlanType } from '@core/organization/domain/Plan/PlanType';
import { Inject } from 'typescript-ioc';
import { OrganizationService } from '@core/organization';
import { OrganizationStoreModule } from '@/store/modules/OrganizationStore';

@Module({ namespaced: true, store: store, dynamic: true, name: Stores.PlanAndBillingStore })
class PlanAndBillingStore extends VuexModule {
  listPlan: ProductInfo[] = [];
  planDetail: ProductSubscriptionInfo | null = null;

  private isInited = false;
  isInitLoading = false;
  initError = '';

  @Inject
  private billingService!: BillingService;

  @Inject
  private orgService!: OrganizationService;

  get licenceKey(): string {
    return OrganizationStoreModule.organization.licenceKey ?? '';
  }

  get planFeatures(): Record<PlanType, string[]> {
    const allPlanFeature = {
      [PlanType.Startup]: ['All features', `Maximum of ${this.getPlanByType(PlanType.Startup)?.editorSeats ?? 0} editors allowed`],
      [PlanType.Business]: ['All features', `Maximum of ${this.getPlanByType(PlanType.Business)?.editorSeats ?? 0} editors allowed`],
      [PlanType.Cooperate]: ['All features', `Maximum of ${this.getPlanByType(PlanType.Cooperate)?.editorSeats ?? 0} editors allowed`],
      [PlanType.OnPremise]: ['All features', `Unlimited editor seats`, 'Request a new feature'],
      [PlanType.NoPlan]: [],
      [PlanType.Trial]: []
    };
    return allPlanFeature;
  }

  get getPlanByType() {
    return (planType: PlanType) => this.listPlan.find(item => item.name === planType);
  }

  get paymentStatus() {
    return this.planDetail?.payment?.status ?? PaymentStatus.Unknown;
  }

  @Action
  async init(): Promise<void> {
    try {
      if (!this.isInited && !this.isInitLoading) {
        this.setIsInitLoading(true);
        await this.handleReloadPlanning();
        this.setIsInited(true);
        this.setInitError('');
      }
    } catch (e) {
      this.setInitError(e.message);
    } finally {
      this.setIsInitLoading(false);
    }
  }

  @Action
  reset() {
    this.setIsInitLoading(false);
    this.setIsInited(false);
    this.setListPlan([]);
    this.setPlan(null);
    this.setInitError('');
  }

  @Action
  async handleReloadPlanning(): Promise<void> {
    const planDetail = await this.billingService.getSubscriptionInfo(this.licenceKey);
    await this.orgService.refreshLicense();
    this.setPlan(planDetail);
  }

  @Action
  async getListPlan() {
    const listPlan = await this.billingService.getProducts();
    this.setListPlan(listPlan);
  }

  @Action
  async cancelPlan() {
    const planDetail = await this.billingService.cancelSubscription(this.licenceKey);
    this.setPlan(planDetail);
  }

  @Action
  async buyPlan(planType: PlanType) {
    const planDetail = await this.billingService.subscribeProduct(this.licenceKey, planType);
    this.setPlan(planDetail);
  }

  @Action
  async redeem(newCode: string): Promise<void> {
    await this.billingService.redeemCode(this.licenceKey, newCode);
  }

  @Mutation
  setPlan(plan: ProductSubscriptionInfo | null) {
    this.planDetail = plan;
  }

  @Mutation
  setListPlan(listPlan: ProductInfo[]) {
    this.listPlan = listPlan;
  }

  @Mutation
  setIsInitLoading(value: boolean) {
    this.isInitLoading = value;
  }

  @Mutation
  setIsInited(value: boolean) {
    this.isInited = value;
  }

  @Mutation
  setInitError(message: string) {
    this.initError = message;
  }
}

export const PlanAndBillingModule: PlanAndBillingStore = getModule(PlanAndBillingStore);
