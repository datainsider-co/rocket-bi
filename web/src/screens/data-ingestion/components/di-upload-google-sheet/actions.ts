import Vue from 'vue';

const EventBus = new Vue();

enum EVENT_NAME {
  SHOW_UPLOAD_DOCUMENT = 'show_upload_google_sheet',
  HIDE_UPLOAD_DOCUMENT = 'hide_upload_google_sheet',
  SET_GOOGLE_TOKEN = 'set_google_token',
  SET_AUTHORIZATION_CODE = 'set_authorization_code',
  SET_ACCESS_TOKEN = 'set_access_token'
}

export default abstract class DiUploadGoogleSheetActions {
  static onShowUploadGoogleSheet(fn: Function) {
    EventBus.$on(EVENT_NAME.SHOW_UPLOAD_DOCUMENT, fn);
  }

  static offShowUploadGoogleSheet(fn: Function) {
    EventBus.$off(EVENT_NAME.SHOW_UPLOAD_DOCUMENT, fn);
  }

  static showUploadGoogleSheet() {
    EventBus.$emit(EVENT_NAME.SHOW_UPLOAD_DOCUMENT);
  }

  static onHideUploadGoogleSheet(fn: Function) {
    EventBus.$on(EVENT_NAME.HIDE_UPLOAD_DOCUMENT, fn);
  }

  static offHideUploadGoogleSheet(fn: Function) {
    EventBus.$off(EVENT_NAME.HIDE_UPLOAD_DOCUMENT, fn);
  }

  static hideUploadGoogleSheet() {
    EventBus.$emit(EVENT_NAME.HIDE_UPLOAD_DOCUMENT);
  }

  static onSetToken(fn: Function) {
    EventBus.$on(EVENT_NAME.SET_GOOGLE_TOKEN, fn);
  }

  static offSetToken(fn: Function) {
    EventBus.$off(EVENT_NAME.SET_GOOGLE_TOKEN, fn);
  }

  static setToken(accessToken: string, refreshToken: string) {
    EventBus.$emit(EVENT_NAME.SET_GOOGLE_TOKEN, accessToken, refreshToken);
  }

  static onSetAuthorizationCode(fn: Function) {
    EventBus.$on(EVENT_NAME.SET_AUTHORIZATION_CODE, fn);
  }

  static setAuthorizationCode(authCode: string) {
    EventBus.$emit(EVENT_NAME.SET_AUTHORIZATION_CODE, authCode);
  }

  static offSetAuthorizationCode(fn: Function) {
    EventBus.$off(EVENT_NAME.SET_AUTHORIZATION_CODE, fn);
  }

  static onSetAccessToken(fn: Function) {
    EventBus.$on(EVENT_NAME.SET_ACCESS_TOKEN, fn);
  }

  static setAccessToken(accessToken: string) {
    EventBus.$emit(EVENT_NAME.SET_ACCESS_TOKEN, accessToken);
  }

  static offSetAccessToken(fn: Function) {
    EventBus.$off(EVENT_NAME.SET_ACCESS_TOKEN, fn);
  }
}
