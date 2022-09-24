import { UserProfile } from '@core/domain/Model';
import { LoginResponse, RegisterResponse } from '@core/domain/Response';
import DiAnalytics from 'di-web-analytics';
import { Properties } from 'di-web-analytics/dist/domain';
import { DashboardTrackingData, DirectoryTrackingData, WidgetTrackingData } from '@core/tracking/domain/tracking_data';
import { Log } from '@core/utils';

export abstract class TrackingService {
  static readonly EVENT_USER_REGISTER = 'Register';
  static readonly EVENT_USER_LOGIN = 'Login';
  static readonly EVENT_USER_LOGOUT = 'Logout';

  abstract registerStart(): void;

  abstract trackRegister(email: string, registerResponse?: RegisterResponse): void;

  abstract loginStart(): void;

  abstract trackLogin(id: string, loginSrc?: string, loginResponse?: LoginResponse): void;

  abstract trackLogout(): void;

  abstract trackUserProfile(userProfile: UserProfile): void;

  abstract trackDirectory(data: DirectoryTrackingData): void;

  abstract trackDashboard(data: DashboardTrackingData): void;

  abstract trackWidget(data: WidgetTrackingData): void;
  abstract track(event: string, properties: Properties): void;
}

export class TrackingServiceImpl extends TrackingService {
  trackUserProfile(userProfile: UserProfile) {
    const properties = {} as Properties;
    properties['di_customer_email'] = userProfile.email || '';
    if (userProfile.fullName) properties['di_customer_full_name'] = userProfile.fullName;
    if (userProfile.firstName) properties['di_customer_first_name'] = userProfile.firstName;
    if (userProfile.lastName) properties['di_customer_last_name'] = userProfile.lastName;

    if (userProfile.avatar) properties['di_customer_avatar_url'] = userProfile.avatar || '';

    DiAnalytics.setUserProfile(userProfile.username, properties).catch(error => {
      Log.debug('Analytics Tracking ::trackUserProfile', error);
    });
  }

  registerStart(): void {
    DiAnalytics.time(TrackingService.EVENT_USER_REGISTER);
  }

  trackRegister(email: string, registerResponse?: RegisterResponse) {
    if (registerResponse?.userProfile) {
      this.trackUserProfile(registerResponse.userProfile);
    }
    const properties = {} as Properties;

    properties['is_success'] = registerResponse ? true : false;
    properties['email'] = email || registerResponse?.userProfile?.email || '';
    properties['user_id'] = registerResponse?.userInfo?.username || '';
    DiAnalytics.track(TrackingService.EVENT_USER_REGISTER, properties).catch(error => {
      Log.debug('Analytics Tracking ::trackRegister', error);
    });
  }

  loginStart(): void {
    DiAnalytics.time(TrackingService.EVENT_USER_LOGIN);
  }

  trackLogin(id: string, loginSrc: string, loginResponse?: LoginResponse) {
    if (loginResponse?.userProfile) {
      this.trackUserProfile(loginResponse.userProfile);
    }
    const properties = {} as Properties;
    properties['login_source'] = loginSrc || 'email';
    properties['id'] = id;
    properties['is_success'] = loginResponse ? true : false;
    properties['user_id'] = loginResponse?.userInfo?.username;
    properties['email'] = loginResponse?.userProfile?.email || '';
    DiAnalytics.track(TrackingService.EVENT_USER_LOGIN, properties).catch(error => {
      Log.debug('Analytics Tracking ::trackLogin', error);
    });
  }

  trackLogout() {
    try {
      DiAnalytics.track(TrackingService.EVENT_USER_LOGOUT, {});
      DiAnalytics.reset();
    } catch (e) {
      Log.debug('Analytics Tracking ::trackLogout', e);
    }
  }

  trackDirectory(data: DirectoryTrackingData): void {
    const properties = (data.extraProperties ? { ...data.extraProperties } : {}) as Properties;
    properties['directory_id'] = data.directoryId;
    properties['parent_directory_id'] = data.parentDirectoryId || 0;
    properties['directory_name'] = data.directoryName || '';
    properties['is_error'] = data.isError ?? false;

    DiAnalytics.track(data.action, properties).catch(error => {
      Log.debug('Analytics Tracking ::trackDirectory', error);
    });
  }

  trackDashboard(data: DashboardTrackingData): void {
    const properties = (data.extraProperties ? { ...data.extraProperties } : {}) as Properties;
    properties['dashboard_id'] = data.dashboardId;
    properties['dashboard_name'] = data.dashboardName || 'Untitled';
    properties['is_error'] = data.isError ?? false;

    DiAnalytics.track(data.action, properties).catch(error => {
      Log.debug('Analytics Tracking ::trackDashboard', error);
    });
  }

  trackWidget(data: WidgetTrackingData): void {
    const properties = (data.extraProperties ? { ...data.extraProperties } : {}) as Properties;

    properties['action'] = data.action;
    properties['widget_type'] = data.widgetType || '';
    properties['chart_family_type'] = data.chartFamilyType || '';
    properties['chart_type'] = data.chartType || '';
    properties['widget_id'] = data.widgetId || 0;
    properties['widget_name'] = data.widgetName || '';
    properties['dashboard_id'] = data.dashboardId || 0;
    properties['dashboard_name'] = data.dashboardName || '';
    properties['is_error'] = data.isError ?? false;

    DiAnalytics.track(`${data.action}_${data.widgetType}`, properties).catch(error => {
      Log.debug('Analytics Tracking ::trackWidget', error);
    });
  }

  async track(event: string, properties: Properties): Promise<void> {
    try {
      await DiAnalytics.track(event, properties).catch(error => {
        Log.debug(`Analytics Tracking ::${event}`, error);
      });
      Log.debug(`track ::${event}`, properties);

      window.dataLayer.push({ event: event, properties: properties });
    } catch (e) {
      //
    }
  }
}
