<template>
  <DiCustomModal ref="diModal" :scrollable="false" :title="title" class="document-container" size="lg" @hidden="reset" @onCancel="hide" @onClickOk="reset">
    <template #modal-header="{ close }">
      <div class="custom-header d-inline-flex w-100">
        <h6 class="document-modal-title cursor-default">{{ title }}</h6>
        <div aria-label="Close" type="button" @click.prevent="close">
          <BIconX class=" button-x btn-icon-border" font-scale="1.5" />
        </div>
      </div>
    </template>
    <div class="modal-sub-title text-center">Get started with the {{ title }} SDK</div>
    <hr class="solid px-0" />
    <vuescroll>
      <div class="modal-content">
        <component v-if="toComponent" :is="toComponent" />
      </div>
    </vuescroll>
    <template #modal-footer>
      <div class="w-100 d-flex justify-content-center">
        <DiButton primary title="See document details" @click="handleShowDetails" />
      </div>
    </template>
  </DiCustomModal>
</template>

<script lang="ts">
import { Component, Ref, Vue } from 'vue-property-decorator';
import { DataSourceType } from '@core/DataIngestion';
import DiCustomModal from '@/shared/components/DiCustomModal.vue';
import DiButton from '@/shared/components/Common/DiButton.vue';
import DiIconTextButton from '@/shared/components/Common/DiIconTextButton.vue';

const JsDocument = () => import('@/screens/DataIngestion/components/AnalyticDocument/JsDocument.vue');
const AndroidDocument = () => import('@/screens/DataIngestion/components/AnalyticDocument/AndroidDocument.vue');
const IOSDocument = () => import('@/screens/DataIngestion/components/AnalyticDocument/IOSDocument.vue');
const ReactNativeDocument = () => import('@/screens/DataIngestion/components/AnalyticDocument/ReactNativeDocument.vue');
const FlutterDocument = () => import('@/screens/DataIngestion/components/AnalyticDocument/FlutterDocument.vue');
@Component({ components: { DiIconTextButton, DiCustomModal, JsDocument, DiButton } })
export default class DocumentModal extends Vue {
  static readonly components = new Map<string, Function>([
    [DataSourceType.JavaScript, JsDocument],
    [DataSourceType.Android, AndroidDocument],
    [DataSourceType.IOS, IOSDocument],
    [DataSourceType.ReactNative, ReactNativeDocument],
    [DataSourceType.ReactNative, ReactNativeDocument],
    [DataSourceType.Flutter, FlutterDocument]
  ]);
  private isShowSync = false;
  @Ref()
  private readonly diModal!: DiCustomModal;
  private type = DataSourceType.Unsupported;
  private get toComponent(): Function | undefined {
    return DocumentModal.components.get(this.type);
  }
  private get title() {
    switch (this.type) {
      case DataSourceType.JavaScript:
      case DataSourceType.IOS:
      case DataSourceType.Android:
      case DataSourceType.ReactNative:
      case DataSourceType.Flutter:
        return this.type.toString();
      default:
        return '';
    }
  }

  hide() {
    this.reset();
    this.diModal.hide();
  }

  show(type: DataSourceType) {
    this.type = type;
    this.isShowSync = true;
    this.diModal.show();
  }

  private reset() {
    this.type = DataSourceType.Unsupported;
    this.isShowSync = false;
  }

  private handleShowDetails() {
    this.diModal.hide();
  }
}
</script>

<style lang="scss" scoped>
.document-modal-title {
  display: flex !important;
  justify-content: center;
  align-items: center;
  align-content: center;
  margin: 0 auto;
  font-size: 1rem;
  font-weight: 500;
  font-stretch: normal;
  font-style: normal;
  line-height: 1.5;
  letter-spacing: 0.4px;
}

.modal-sub-title {
  font-size: 1rem;
  line-height: 1.5;
  letter-spacing: 0.4px;
  color: var(--secondary-text-color);
}

.modal-content {
  max-height: 60vh;
  font-size: 1rem;
}
</style>
