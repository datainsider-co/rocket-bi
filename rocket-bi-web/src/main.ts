import Vue from 'vue';
// LIBS
import { Component } from 'vue-property-decorator';
import { Container } from 'typescript-ioc';
import { BootstrapVue, IconsPlugin } from 'bootstrap-vue';
import vClickOutside from 'v-click-outside';
import Vuelidate from 'vuelidate';
import VCalendar from 'v-calendar';
import vuescroll from 'vuescroll';
import vSelect from 'vue-select';
import VueDraggableResizable from 'vue-draggable-resizable';
import { Button, Popover, Table, Tabs, TimePicker, Modal, InputNumber } from 'ant-design-vue';
import Directives from '@/shared/directives';

// DATA INSIDER
import App from './App.vue';
// STORES
import store from './store';
// ROUTERS
import router from './router/Router';
// COMMON
import { ComponentUtils, DomUtils } from '@/utils';
import { DefaultScrollConfig } from '@/shared';
import { ChartBuilderModule } from '@/shared/module';
import VueVirtualScroller from 'vue-virtual-scroller';
// CSS
import '@/themes/app.scss';
import 'vue-virtual-scroller/dist/vue-virtual-scroller.css';
import { DevModule, Di, DIKeys, ProductionModule } from '@core/common/modules';
import Highcharts from 'highcharts';
import { UserManagementModule } from '@core/admin/UserManagementModule';
import { TrackingModule } from '@core/tracking/TrackingModule';
import { ShareModule } from '@core/share/ShareModule';
import { SchemaModule } from '@core/schema/module/SchemaModule';
import { GenIdMethods } from '@/utils/IdGenerator';
import HighchartsCustomEvents from 'highcharts-custom-events';
import { LogLevel } from '@core/utils/Log';
import CommonComponentPlugin from '@/shared/components/common/install';
import DiUploadDocumentPlugin from '@/screens/data-ingestion/components/di-upload-document';
import DiUploadGoogleSheetPlupin from '@/screens/data-ingestion/components/di-upload-google-sheet';
import DiIcons from '@/shared/components/Icon/install';
import { OrganizationModule } from '@core/organization';
import { ClickhouseConfigModule } from '@core/clickhouse-config/module/ClickhouseConfigModule';
import { RelationshipModule } from '@core/data-relationship';
import { HttpModule } from '@core/common/modules/HttpModule';
import { HttpTestModule } from '@core/common/modules/TestHttpModule';
import DiAnalytics from 'di-web-analytics';
import { BillingModule } from '@core/billing';
import { DataIngestionModule } from '@core/data-ingestion';
import { DataCookModule } from '@core/data-cook';
import { DataManager } from '@core/common/services';
HighchartsCustomEvents(Highcharts as any);

switch (process.env.NODE_ENV) {
  case 'production':
    DomUtils.bind('logLevel', LogLevel.Error);
    window.dumpLog = false;
    Di.init([
      new HttpModule(),
      new ProductionModule(),
      new TrackingModule(),
      new ChartBuilderModule(),
      new UserManagementModule(),
      new ShareModule(),
      new SchemaModule(),
      new OrganizationModule(),
      new RelationshipModule(),
      new ClickhouseConfigModule(),
      new BillingModule(),
      new DataIngestionModule(),
      new DataCookModule()
    ]);
    break;
  case 'test':
    Di.init([
      new HttpTestModule(),
      new ProductionModule(),
      new TrackingModule(),
      new ChartBuilderModule(),
      new UserManagementModule(),
      new ShareModule(),
      new SchemaModule(),
      new OrganizationModule(),
      new ClickhouseConfigModule(),
      new RelationshipModule(),
      new BillingModule(),
      new DataIngestionModule(),
      new DataCookModule()
    ]);
    DomUtils.bind('logLevel', LogLevel.All);
    window.dumpLog = true;
    break;
  default:
    DomUtils.bind('logLevel', LogLevel.All);
    window.dumpLog = true;
    Di.init([
      new HttpModule(),
      new DevModule(),
      new TrackingModule(),
      new ChartBuilderModule(),
      new UserManagementModule(),
      new ShareModule(),
      new SchemaModule(),
      new OrganizationModule(),
      new ClickhouseConfigModule(),
      new RelationshipModule(),
      new BillingModule(),
      new DataIngestionModule(),
      new DataCookModule()
    ]);
}

switch (process.env.NODE_ENV) {
  case 'production': {
    Vue.use(DiUploadDocumentPlugin, {
      api: window.appConfig.VUE_APP_SCHEMA_API_URL,
      headers: { 'DI-SERVICE-KEY': '12345678' },
      componentName: 'DiUploadComponent',
      chunkSize: 1000000 //1MB
    });
    Vue.use(DiUploadGoogleSheetPlupin, {
      api: window.appConfig.VUE_APP_SCHEMA_API_URL,
      headers: { 'DI-SERVICE-KEY': '12345678' },
      componentName: 'DiUploadGoogleSheetComponent',
      chunkSize: 1000000 //1MB
    });
    break;
  }
  default:
    Vue.use(DiUploadDocumentPlugin, {
      api: window.appConfig.VUE_APP_SCHEMA_API_URL,
      headers: {
        // sửa lỗi không thể tạo mới database khi upload csv (chỉ bị trên mode debug
        Authorization: DataManager.getSession(),
        'DI-SERVICE-KEY': '12345678'
      },
      componentName: 'DiUploadComponent',
      chunkSize: 1000000 //1MB
    });
    Vue.use(DiUploadGoogleSheetPlupin, {
      api: window.appConfig.VUE_APP_SCHEMA_API_URL,
      headers: {
        // sửa lỗi không thể tạo mới database khi upload csv (chỉ bị trên mode debug
        Authorization: DataManager.getSession(),
        'DI-SERVICE-KEY': '12345678'
      },
      componentName: 'DiUploadGoogleSheetComponent',
      chunkSize: 1000000 //1MB
    });
}

// Attach profiler to Window.profiler
DomUtils.bind('profiler', Container.getValue(DIKeys.Profiler));

Vue.use(BootstrapVue);
Vue.use(IconsPlugin);
Vue.use(vClickOutside);
Vue.use(Vuelidate);
Vue.use(VCalendar);
Vue.component('v-select', vSelect);
Vue.use(vuescroll, {
  ops: DefaultScrollConfig,
  name: 'vuescroll'
});
Vue.use(VueVirtualScroller);
Vue.use(VueDraggableResizable);
Vue.use(Table);
Vue.use(Tabs);
Vue.use(Modal);
Vue.use(Popover);
Vue.use(TimePicker);
Vue.use(Button);
Vue.use(InputNumber);
Vue.use(CommonComponentPlugin);
Vue.use(DiIcons);
Vue.use(Directives);

Vue.mixin({ methods: GenIdMethods });

Vue.config.productionTip = false;
Vue.config.performance = true;

const requireComponents = require.context('@/shared/components', false);
ComponentUtils.registerComponentsAsGlobal(requireComponents);

const filterComponents = require.context('@/shared/components/filters', true);
ComponentUtils.registerComponentsAsGlobal(filterComponents);

// TODO: register global hook
Component.registerHooks(['beforeRouteEnter', 'beforeRouteLeave']);
DomUtils.bind('DiAnalytics', DiAnalytics);
new Vue({
  router,
  store,
  render: h => h(App),
  name: 'Data Insider'
}).$mount('#app');
