import { Vue } from 'vue-property-decorator';
import { BusEvents } from '@/event-bus/BusEvents';
import { UserProfile } from '@core/common/domain';
import { CopiedData } from '@/screens/dashboard-detail/intefaces/CopiedData';

export class EventBus {
  private static instance: Vue;

  private static getInstance() {
    if (!this.instance) {
      this.instance = new Vue();
    }
    return this.instance;
  }

  static onRLSViewAs(fn: Function) {
    this.getInstance().$on(BusEvents.RLSViewAs, fn);
  }

  static offRLSViewAs(fn: Function) {
    this.getInstance().$off(BusEvents.RLSViewAs, fn);
  }

  static rlsViewAs(userProfile: UserProfile) {
    this.getInstance().$emit(BusEvents.RLSViewAs, userProfile);
  }

  static onExitRLSViewAs(fn: Function) {
    this.getInstance().$on(BusEvents.ExitRLSViewAs, fn);
  }

  static offExitRLSViewAs(fn: Function) {
    this.getInstance().$off(BusEvents.ExitRLSViewAs, fn);
  }

  static exitRLSViewAs() {
    this.getInstance().$emit(BusEvents.ExitRLSViewAs);
  }

  static onDestDatabaseNameChange(fn: (name: string, isCreateNew: boolean) => void) {
    this.getInstance().$on(BusEvents.DestDatabaseNameChange, fn);
  }

  static offDestDatabaseNameChange(fn: (name: string, isCreateNew: boolean) => void) {
    this.getInstance().$off(BusEvents.DestDatabaseNameChange, fn);
  }

  static destDatabaseNameChange(name: string, isCreateNew: boolean) {
    this.getInstance().$emit(BusEvents.DestDatabaseNameChange, name, isCreateNew);
  }

  static onPasteData(fn: (data: CopiedData) => void) {
    this.getInstance().$on(BusEvents.PasteData, fn);
  }

  static offPasteData(fn: (data: CopiedData) => void) {
    this.getInstance().$off(BusEvents.PasteData, fn);
  }

  static pasteData(data: CopiedData) {
    this.getInstance().$emit(BusEvents.PasteData, data);
  }

  static onDashboardResize(fn: (isMobile: boolean) => void): void {
    this.getInstance().$on(BusEvents.DashboardResize, fn);
  }

  static offDashboardResize(fn: (isMobile: boolean) => void): void {
    this.getInstance().$off(BusEvents.DashboardResize, fn);
  }

  static resizeDashboard(isMobile: boolean): void {
    this.getInstance().$emit(BusEvents.DashboardResize, isMobile);
  }
}
