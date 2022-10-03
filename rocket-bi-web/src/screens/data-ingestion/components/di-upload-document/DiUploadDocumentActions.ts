import Vue from 'vue';

const EventBus = new Vue();

enum EVENT_NAME {
  SHOW_UPLOAD_DOCUMENT = 'show_upload_document'
}

export default abstract class DiUploadDocumentActions {
  static onShowUploadDocument(fn: Function) {
    EventBus.$on(EVENT_NAME.SHOW_UPLOAD_DOCUMENT, fn);
  }

  static offShowUploadDocument(fn: Function) {
    EventBus.$off(EVENT_NAME.SHOW_UPLOAD_DOCUMENT, fn);
  }

  static showUploadDocument() {
    EventBus.$emit(EVENT_NAME.SHOW_UPLOAD_DOCUMENT);
  }
}
