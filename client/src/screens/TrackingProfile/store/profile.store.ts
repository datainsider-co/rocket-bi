import { Action, getModule, Module, Mutation, VuexModule } from 'vuex-module-decorators';
import { Inject } from 'typescript-ioc';
import store from '@/store';
import { QueryProfileBuilder } from '@core/services';
import { DefaultPaging, Stores } from '@/shared';
import { AbstractTableQuerySetting, Column, FieldDetailInfo, FilterWidget, TableQueryChartSetting, TableSchema } from '@core/domain/Model';
import { AbstractTableResponse, FilterRequest, TrackingProfileSearchRequest } from '@core/domain';
import { ChartUtils } from '@/utils';
import { ProfileCsvExporter } from '@/screens/TrackingProfile/store/profile_exporter';
import { TrackingProfileService } from '@core/tracking/service';

@Module({ namespaced: true, store: store, dynamic: true, name: Stores.profileStore })
export class ProfileStore extends VuexModule {
  profileSettingInfo: TableSchema | null = null;
  userProfileData: AbstractTableResponse | null = null;
  configColumns: FieldDetailInfo[] = [];
  currentFrom = 0;
  private query: AbstractTableQuerySetting | null = null;
  private filterRequests: FilterRequest[] = [];
  private currentSize: number = DefaultPaging.DefaultPageSize;
  @Inject
  private queryProfileBuilder!: QueryProfileBuilder;

  @Inject
  private profileService!: TrackingProfileService;

  get profileColumnInfo(): Column[] | undefined {
    return this.profileSettingInfo?.columns;
  }

  @Action
  async listProperties(): Promise<void> {
    const response = await this.profileService.listProperties();
    this.setProfileSettingInfo({ profileSettingInfo: response });
  }

  @Action
  async queryUserProfileData(): Promise<void> {
    if (this.query) {
      const trackingProfileSearchRequest = new TrackingProfileSearchRequest(this.query, this.filterRequests, this.currentFrom, this.currentSize);
      const response = await this.profileService.search(trackingProfileSearchRequest);
      this.setUserProfileData({ userProfileData: response });
    }
  }

  @Action
  async exportProfileAsCSV(): Promise<void> {
    if (this.query && this.filterRequests) {
      const exporter = new ProfileCsvExporter(this.query, this.filterRequests);
      //const exporter = new MockProfileCsvExporter(this.query, this.chartSetting, this.filterRequests);
      await exporter.run();
    }
  }

  @Action
  async editConfigColumns(payload: { fields: FieldDetailInfo[] }) {
    const { fields } = payload;
    this.setConfigColumns({ configColumns: fields });
    this.setCurrentFrom({ currentFrom: 0 });
    await this.buildQuery(fields);
  }

  @Action
  async buildQuery(fields: FieldDetailInfo[]) {
    const tableQueryChartSetting = this.queryProfileBuilder.buildTableQuerySetting(fields);
    this.setQuery({ query: tableQueryChartSetting });
  }

  @Mutation
  setProfileSettingInfo(payload: { profileSettingInfo: TableSchema }) {
    this.profileSettingInfo = payload.profileSettingInfo;
  }

  @Mutation
  setUserProfileData(payload: { userProfileData: AbstractTableResponse }) {
    this.userProfileData = payload.userProfileData;
  }

  @Mutation
  setConfigColumns(payload: { configColumns: FieldDetailInfo[] }) {
    this.configColumns = payload.configColumns;
  }

  @Mutation
  setQuery(payload: { query: TableQueryChartSetting }) {
    this.query = payload.query;
  }

  @Mutation
  setCurrentFrom(payload: { currentFrom: number }) {
    this.currentFrom = payload.currentFrom;
  }

  @Mutation
  setCurrentSize(payload: { currentSize: number }) {
    this.currentSize = payload.currentSize;
  }

  @Mutation
  configFilterRequests(filters: FilterWidget[]) {
    this.filterRequests = ChartUtils.toFilterRequests(filters);
  }
}

export const ProfileModule = getModule(ProfileStore);
