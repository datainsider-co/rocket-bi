import Vue from 'vue';
// LIBS
import { Component } from 'vue-property-decorator';
import { Container } from 'typescript-ioc';
import { BootstrapVue, IconsPlugin } from 'bootstrap-vue';
import responsive from 'vue-responsive';
import vClickOutside from 'v-click-outside';
import Vuelidate from 'vuelidate';
import VCalendar from 'v-calendar';
import vuescroll from 'vuescroll';
import vSelect from 'vue-select';
import VueDraggableResizable from 'vue-draggable-resizable';
import { Button, Popover, Table, Tabs, TimePicker } from 'ant-design-vue';
import Directives from '@/shared/directives';

// DATA INSIDER
import App from './App.vue';
// STORES
import store from './store';
import { AuthenticationModule } from '@/store/modules/authentication.store';
// ROUTERS
import router from './router/router';
// COMMON
import { ComponentUtils, DomUtils } from '@/utils';
import { DefaultScrollConfig } from '@/shared';
import { ChartBuilderModule } from '@/shared/module';
import VueVirtualScroller from 'vue-virtual-scroller';
// CSS
import '@/themes/app.scss';
import 'vue-virtual-scroller/dist/vue-virtual-scroller.css';
import { DevModule, DI, DIKeys, ProdModule } from '@core/modules';
import Highcharts from 'highcharts';
import Mustache from 'mustache';
import { UserManagementModule } from '@core/admin/UserManagementModule';
import { TrackingModule } from '@core/tracking/tracking.module';
import { ShareModule } from '@core/share/share.module';
import { SchemaModule } from '@core/schema/module/SchemaModule';
import { GenIdMethods } from '@/utils/id_generator';
import HighchartsCustomEvents from 'highcharts-custom-events';
import { LogLevel } from '@core/utils/Log';
import CommonComponentPlugin from '@/shared/components/Common/install';
import { DataIngestionModule } from '@core/DataIngestion/Module/DataIngestionModule';
import DiUploadDocumentPlugin from '@/screens/DataIngestion/components/DiUploadDocument';
import DiUploadGoogleSheetPlupin from '@/screens/DataIngestion/components/DiUploadGoogleSheet';
import DiIcons from '@/shared/components/Icon/install';
import { OrganizationModule } from '@core/Organization';
import { DataManager } from '@core/services';
import { CdpModule } from '@core/CDP';
import { DataCookModule } from '@core/DataCook';
import { LakeHouseModule } from '@core/LakeHouse/Module/LakeHouseModule';
import DiAnalytics from 'di-web-analytics';
import { ClickhouseConfigModule } from '@core/ClickhouseConfig/Module/ClickhouseConfigModule';
import { RelationshipModule } from '@core/DataRelationship';
import { HttpModule } from '@core/modules/http.modules';
import { HttpTestModule } from '@core/modules/http.test.modules';

HighchartsCustomEvents(Highcharts as any);

switch (process.env.NODE_ENV) {
  case 'production':
    DomUtils.bind('logLevel', LogLevel.Error);
    window.dumpLog = false;
    DI.init([
      new HttpModule(),
      new ProdModule(),
      new TrackingModule(),
      new ChartBuilderModule(),
      new UserManagementModule(),
      new ShareModule(),
      new SchemaModule(),
      new DataIngestionModule(),
      new OrganizationModule(),
      new CdpModule(),
      new DataCookModule(),
      new LakeHouseModule(),
      new RelationshipModule(),
      new ClickhouseConfigModule()
    ]);
    break;
  case 'test':
    DI.init([
      new HttpTestModule(),
      new ProdModule(),
      new TrackingModule(),
      new ChartBuilderModule(),
      new UserManagementModule(),
      new ShareModule(),
      new SchemaModule(),
      new DataIngestionModule(),
      new OrganizationModule(),
      new CdpModule(),
      new DataCookModule(),
      new LakeHouseModule(),
      new ClickhouseConfigModule(),
      new RelationshipModule()
    ]);
    DomUtils.bind('logLevel', LogLevel.All);
    window.dumpLog = true;
    break;
  default:
    DomUtils.bind('logLevel', LogLevel.All);
    window.dumpLog = true;
    DI.init([
      new HttpModule(),
      new DevModule(),
      new TrackingModule(),
      new ChartBuilderModule(),
      new UserManagementModule(),
      new ShareModule(),
      new SchemaModule(),
      new DataIngestionModule(),
      new OrganizationModule(),
      new CdpModule(),
      new DataCookModule(),
      new LakeHouseModule(),
      new ClickhouseConfigModule(),
      new RelationshipModule()
    ]);
}

// Attach profiler to Window.profiler
DomUtils.bind('profiler', Container.getValue(DIKeys.Profiler));
DomUtils.bind('highcharts', Highcharts);
DomUtils.bind('Mustache', Mustache);

Vue.use(responsive);
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
Vue.use(Popover);
Vue.use(TimePicker);
Vue.use(Button);
Vue.use(CommonComponentPlugin);
Vue.use(DiIcons);
Vue.use(Directives);

switch (process.env.NODE_ENV) {
  case 'production': {
    Vue.use(DiUploadDocumentPlugin, {
      api: '/api',
      headers: { 'DI-SERVICE-KEY': '12345678' },
      componentName: 'DiUploadComponent',
      chunkSize: 1000000 //1MB
    });
    Vue.use(DiUploadGoogleSheetPlupin, {
      api: '/api',
      headers: { 'DI-SERVICE-KEY': '12345678' },
      componentName: 'DiUploadGoogleSheetComponent',
      chunkSize: 1000000 //1MB
    });
    break;
  }
  default:
    Vue.use(DiUploadDocumentPlugin, {
      api: 'http://dev.datainsider.co/api',
      headers: {
        'DI-SERVICE-KEY': '12345678',
        // sửa lỗi không thể tạo mới database khi upload csv (chỉ bị trên mode debug
        Authorization: DI.get(DataManager).getSession()
      },
      componentName: 'DiUploadComponent',
      chunkSize: 1000000 //1MB
    });
    Vue.use(DiUploadGoogleSheetPlupin, {
      api: 'http://dev.datainsider.co/api',
      headers: {
        'DI-SERVICE-KEY': '12345678',
        // sửa lỗi không thể tạo mới database khi upload csv (chỉ bị trên mode debug
        Authorization: DI.get(DataManager).getSession()
      },
      componentName: 'DiUploadGoogleSheetComponent',
      chunkSize: 1000000 //1MB
    });
}

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
