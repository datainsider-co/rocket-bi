import { Action, getModule, Module, Mutation, VuexModule } from 'vuex-module-decorators';
import { Inject } from 'typescript-ioc';
import store from '@/store';
import { DefaultPaging, Stores } from '@/shared';
import { EventsResponse } from '@core/domain/Response';
import { GetUserActivityByEventIdRequest, GetUserActivityRequest } from '@core/tracking/domain/request/event_tracking.request';
import { UpdateTrackingProfileRequest } from '@core/tracking/domain/request/update_tracking_profile_request';
import { TrackingProfileResponse } from '@core/tracking/domain/response/tracking_profile_response';
import { UserActivitiesResponse } from '@core/domain/Response/User/UserActivitiesResponse';
import { TrackingActivityService, TrackingProfileService } from '@core/tracking/service';

@Module({ namespaced: true, store: store, dynamic: true, name: Stores.profileActivityStore })
export class ProfileActivityStore extends VuexModule {
  profileDetailsId = '';
  events: EventsResponse | null = null;
  trackingProfile: TrackingProfileResponse | null = null;
  userActivities: UserActivitiesResponse | null = null;
  userActivitiesByEventId: Map<string, UserActivitiesResponse> = new Map<string, UserActivitiesResponse>();
  fromTime: number = new Date().getTime();
  toTime: number = new Date().getTime();
  includeEvents: string[] = [];
  from = 0;
  currentPage = 1;

  @Inject
  private trackingActivityService!: TrackingActivityService;
  @Inject
  private profileService!: TrackingProfileService;

  get eventsToFilters() {
    if (this.events) {
      return this.events.data.map(x => {
        return {
          code: x.name,
          label: x.displayName
        };
      });
    }
    return [];
  }

  @Action
  async getEvents(username: string): Promise<void> {
    const response = await this.trackingActivityService.getEvents(username);
    this.setEvents({ events: response });
    this.setProfileDetailsId({ profileDetailsId: username });
  }

  @Action
  async getTrackingProfile(): Promise<void> {
    if (this.profileDetailsId) {
      const response = await this.profileService.getTrackingProfile(this.profileDetailsId);
      this.setTrackingProfile({ trackingProfile: response });
    }
  }

  @Action
  async getUserActivities(): Promise<void> {
    if (this.profileDetailsId) {
      const request = new GetUserActivityRequest(
        this.profileDetailsId,
        this.fromTime,
        this.toTime,
        this.includeEvents,
        this.from,
        DefaultPaging.defaultForVirtualScroller
      );
      const response = await this.trackingActivityService.getUserActivities(request);
      this.setUserActivities({ userActivities: response });
    }
  }

  @Action
  async getUserActivitiesByEventId(request: GetUserActivityByEventIdRequest): Promise<void> {
    const response = await this.trackingActivityService.getUserActivitiesByEventId(request);
    this.setUserActivitiesByEventId({ eventId: request.eventId, userActivitiesByEventId: response });
  }

  @Action
  async updateProfile(request: UpdateTrackingProfileRequest): Promise<void> {
    const response = await this.profileService.updateProfile(request);
    if (response) {
      this.getTrackingProfile();
    }
  }

  @Mutation
  setEvents(payload: { events: EventsResponse }) {
    this.events = payload.events;
  }

  @Mutation
  setProfileDetailsId(payload: { profileDetailsId: string }) {
    this.profileDetailsId = payload.profileDetailsId;
  }

  @Mutation
  setTrackingProfile(payload: { trackingProfile: TrackingProfileResponse }) {
    this.trackingProfile = payload.trackingProfile;
  }

  @Mutation
  setUserActivities(payload: { userActivities: UserActivitiesResponse }) {
    this.userActivities = payload.userActivities;
  }

  @Mutation
  setFromTime(payload: { fromTime: number }) {
    this.fromTime = payload.fromTime;
  }

  @Mutation
  setToTime(payload: { toTime: number }) {
    this.toTime = payload.toTime;
  }

  @Mutation
  setIncludeEvents(payload: { includeEvents: string[] }) {
    this.includeEvents = payload.includeEvents;
  }

  @Mutation
  setFrom(payload: { from: number }) {
    this.from = payload.from;
  }

  @Mutation
  setCurrentPage(payload: { currentPage: number }) {
    this.currentPage = payload.currentPage;
  }

  @Mutation
  setUserActivitiesByEventId(payload: { eventId: string; userActivitiesByEventId: UserActivitiesResponse }) {
    this.userActivitiesByEventId.set(payload.eventId, payload.userActivitiesByEventId);
  }

  @Mutation
  clearUserActivitiesByEventId() {
    this.userActivitiesByEventId = new Map<string, UserActivitiesResponse>();
  }

  @Mutation
  resetUserActivitiesStates() {
    this.trackingProfile = null;
    this.userActivities = null;
    this.userActivitiesByEventId = new Map<string, UserActivitiesResponse>();
    this.fromTime = new Date().getTime();
    this.toTime = new Date().getTime();
    this.includeEvents = [];
    this.from = 0;
    this.currentPage = 1;
  }
}

export const ProfileActivityModule = getModule(ProfileActivityStore);
