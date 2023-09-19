import Vue from 'vue';
import VueRouter, { RouteConfig } from 'vue-router';
import { AuthenticationModule } from '@/store/modules/AuthenticationStore';
import { Routers } from '@/shared/enums/Routers';
import { RouterUtils } from '@/utils/RouterUtils';
import { Log, UrlUtils } from '@core/utils';
import { SharedDirectoryListingHandler } from '@/screens/directory/views/mydata/directory-listing-handler/SharedDirectoryListingHandler';
import { MyDataDirectoryListingHandler } from '@/screens/directory/views/mydata/directory-listing-handler/MyDataDirectoryListingHandler';
import { StarredDirectoryListingHandler } from '@/screens/directory/views/mydata/directory-listing-handler/StarredDirectoryListingHandler';
import { TrashDirectoryListingHandler } from '@/screens/directory/views/mydata/directory-listing-handler/TrashDirectoryListingHandler';
import { RecentDirectoryListingHandler } from '@/screens/directory/views/mydata/directory-listing-handler/RecentDirectoryListingHandler';
import { LIST_ETL_JOB_TYPE } from '@/screens/data-cook/views/list-etl-job/ListEtlTypes';
import DiAnalytics from 'di-web-analytics';
import EnvUtils from '@/utils/EnvUtils';
import { AllJobListingHandler } from '@/screens/data-ingestion/interfaces/job-listing-handler/AllJobListingHandler';
import { QueuedJobListingHandler } from '@/screens/data-ingestion/interfaces/job-listing-handler/QueuedJobListingHandler';

Vue.use(VueRouter);

// TODO: Please! don't delete comment in import
const DirectoryListing = () => import(/* webpackChunkName: "directory" */ '@/screens/directory/views/DirectoryListing.vue');
const MyData = () => import(/* webpackChunkName: "directory-my-data" */ '@/screens/directory/views/mydata/MyData.vue');
const ShareWithMe = () => import(/* webpackChunkName: "directory-share-with-me" */ '@/screens/directory/views/mydata/MyData.vue');
const Recent = () => import(/* webpackChunkName: "directory-recent" */ '@/screens/directory/views/mydata/MyData.vue');
const Star = () => import(/* webpackChunkName: "directory-star" */ '@/screens/directory/views/mydata/MyData.vue');
const Trash = () => import(/* webpackChunkName: "directory-trash" */ '@/screens/directory/views/mydata/MyData.vue');
const DashboardDetail = () => import(/* webpackChunkName: "dashboard" */ '@/screens/dashboard-detail/views/DashboardDetail.vue');
const EmbeddedDashboard = () => import(/* webpackChunkName: "embedded-dashboard" */ '@/screens/dashboard-detail/views/EmbeddedDashboard.vue');

const UserSettings = () => import(/* webpackChunkName: "user-setting" */ '@/screens/current-user/views/UserSettings.vue');
const UserProfile = () => import(/* webpackChunkName: "user-profile" */ '@/screens/current-user/components/UserProfileComponent.vue');

const DataManagement = () => import(/* webpackChunkName: "data-management" */ '@/screens/data-management/views/DataManagement.vue');
const DatabaseManagement = () => import(/* webpackChunkName: "data-management" */ '@/screens/data-management/views/database-management/DatabaseManagement.vue');
const DatabaseListing = () => import(/* webpackChunkName: "data-management" */ '@/screens/data-management/views/database-management/DatabaseListing.vue');
const DataSchema = () => import(/* webpackChunkName: "data-management-schema" */ '@/screens/data-management/views/data-schema/DataSchema.vue');
const QueryEditor = () => import(/* webpackChunkName: "data-management-query-editor" */ '@/screens/data-management/views/query-editor/QueryEditor.vue');
const DataRelationship = () =>
  import(/* webpackChunkName: "data-management-relationship" */ '@/screens/data-management/views/data-relationship/DataRelationship.vue');

const OrganizationSettings = () => import(/* webpackChunkName: "organization-settings" */ '@/screens/organization-settings/views/OrganizationSettings.vue');
const OrganizationOverview = () =>
  import(/* webpackChunkName: "organization-overview" */ '@/screens/organization-settings/views/overview/OrganizationOverview.vue');
const UserActivity = () =>
  import(/* webpackChunkName: "organization-activity" */ '@/screens/organization-settings/views/user-activity-log/UserActivityLog.vue');
const ClickhouseConfig = () =>
  import(/* webpackChunkName: "organization-clickhouse-config" */ '@/screens/organization-settings/views/connector-config/ConnectorConfig.vue');
const PlanAndBilling = () => import(/* webpackChunkName: "organization-billing" */ '@/screens/organization-settings/views/plan-and-billing/PlanAndBilling.vue');
const APIKeyManagement = () =>
  import(/* webpackChunkName: "organization-api-key" */ '@/screens/organization-settings/views/token-management/APIKeyManagement.vue');
const PlanDetail = () => import(/* webpackChunkName: "organization-plan-detail" */ '@/screens/organization-settings/views/plan-detail/PlanDetail.vue');
const UserManagement = () =>
  import(/* webpackChunkName: "organization-user-management" */ '@/screens/user-management/views/user-management/UserManagement.vue');
const UserDetail = () => import(/* webpackChunkName: "organization-user-detail" */ '@/screens/user-management/views/user-detail/UserDetail.vue');

const Login = () => import(/* webpackChunkName: "login" */ '@/screens/login-v2/Login.vue');
const Register = () => import(/* webpackChunkName: "login" */ '@/screens/login-v2/Register.vue');
const SignIn = () => import(/* webpackChunkName: "login" */ '@/screens/basic-login/components/signin/SignIn.vue');
///

// const FileDownload = () => import(/* webpackChunkName: "blank-component" */ '@/screens/LakeHouse/views/LakeExplorer/FileDownload.vue');
const NotFound = () => import(/* webpackChunkName: "not-found" */ '@/screens/NotFound.vue');

const routes: Array<RouteConfig> = [
  {
    path: '/',
    redirect: '/mydata',
    name: 'Directory',
    component: DirectoryListing,
    props: true,
    children: [
      {
        path: '/mydata/:name?',
        name: Routers.AllData,
        component: MyData,
        props: route => ({
          handler: new MyDataDirectoryListingHandler()
        })
      },
      {
        path: '/shared/:name?',
        name: Routers.SharedWithMe,
        component: ShareWithMe,
        props: route => ({
          // FIXME: move to DI. Bug hide create button
          handler: new SharedDirectoryListingHandler()
        })
      },
      {
        path: '/recent/:name?',
        name: Routers.Recent,
        component: Recent,
        props: route => ({
          // FIXME: move to DI
          handler: new RecentDirectoryListingHandler()
        })
      },
      {
        path: '/starred/:name?',
        name: Routers.Starred,
        component: Star,
        props: route => ({
          // FIXME: move to DI
          handler: new StarredDirectoryListingHandler()
        })
      },
      {
        path: '/trash',
        name: Routers.Trash,
        component: Trash,
        props: route => ({
          // FIXME: move to DI
          handler: new TrashDirectoryListingHandler()
        })
      }
    ]
  },
  {
    path: '/',
    name: 'WelcomePage',
    component: Login,
    children: [{ path: 'login', component: SignIn, name: Routers.Login }]
  },
  {
    path: '/register',
    name: Routers.Signup,
    component: Register
  },
  {
    path: '/dashboard/:name',
    name: Routers.Dashboard,
    component: DashboardDetail,
    props: true
  },
  {
    path: '/settings/user-profile/',
    name: Routers.UserSettings,
    component: UserSettings,
    redirect: {
      name: Routers.UserProfile
    },
    children: [
      {
        path: '/settings/user-profile/me',
        name: Routers.UserProfile,
        component: UserProfile
      }
    ]
  },
  {
    // redirect old path /data-management to new /data-warehouse
    path: '/data-management/*',
    redirect: '/data-warehouse'
  },
  {
    path: '/data-warehouse',
    name: Routers.DataManagement,
    component: DataManagement,
    redirect: '/data-warehouse/databases',
    props: true,
    children: [
      {
        path: '/data-warehouse/databases',
        name: Routers.Database,
        redirect: '/data-warehouse/databases/all',
        component: DatabaseManagement,
        children: [
          {
            path: '/data-warehouse/databases/all',
            name: Routers.AllDatabase,
            component: DatabaseListing,
            props: route => ({
              label: 'database'
            })
          },
          {
            path: '/data-warehouse/databases/trash',
            name: Routers.TrashDatabase,
            component: DatabaseListing,
            props: route => ({
              label: 'trash'
            })
          }
        ]
      },
      {
        path: '/data-warehouse/schema',
        name: Routers.DataSchema,
        component: DataSchema,
        props: true
      },
      {
        path: '/data-warehouse/query-editor',
        name: Routers.QueryEditor,
        component: QueryEditor,
        props: true
      },
      {
        path: '/data-warehouse/relationship',
        name: Routers.DataRelationship,
        component: DataRelationship,
        props: true
      }
    ]
  },
  {
    path: '/data-ingestion',
    name: Routers.DataIngestion,
    component: () => import(/* webpackChunkName: "ingestion" */ '@/screens/data-ingestion/views/DataIngestion.vue'),
    redirect: '/data-ingestion/data-source',
    props: true,
    children: [
      {
        path: '/data-ingestion/data-source',
        name: Routers.DataSource,
        component: () => import(/* webpackChunkName: "ingestion-source" */ '@/screens/data-ingestion/components/DataSourceScreen.vue'),
        props: true
      },
      {
        path: '/data-ingestion/job',
        name: Routers.Job,
        component: () => import(/* webpackChunkName: "ingestion-job" */ '@/screens/data-ingestion/components/JobScreen.vue'),
        props: route => ({
          handler: new AllJobListingHandler(true)
        })
      },
      {
        path: '/data-ingestion/queued-job',
        name: Routers.QueuedJob,
        component: () => import(/* webpackChunkName: "ingestion-job" */ '@/screens/data-ingestion/components/JobScreen.vue'),
        props: route => ({
          handler: new QueuedJobListingHandler(true)
        })
      },
      {
        path: '/data-ingestion/streaming',
        name: Routers.Streaming,
        component: () => import(/* webpackChunkName: "ingestion-streaming" */ '@/screens/data-ingestion/components/streaming/Streaming.vue'),
        props: true
      },
      {
        path: '/data-ingestion/job-history',
        name: Routers.JobHistory,
        component: () => import(/* webpackChunkName: "ingestion-job-history" */ '@/screens/data-ingestion/components/JobHistoryScreen.vue'),
        props: true
      }
    ]
  },
  {
    path: '/shopify',
    name: Routers.ShopifyIntegrationStep1,
    component: () => import(/* webpackChunkName: "ingestion-shopify" */ '@/screens/data-ingestion/components/shopify/ShopifyIntegrationStep1.vue'),
    props: true
  },
  {
    path: '/shopify/redirect',
    name: Routers.ShopifyIntegrationStep2,
    component: () => import(/* webpackChunkName: "ingestion-shopify-2" */ '@/screens/data-ingestion/components/shopify/ShopifyIntegrationStep2.vue'),
    props: true
  },
  {
    path: '/third-party-auth/:config_type',
    name: Routers.ThirdPartyAuthentication,
    component: () => import(/* webpackChunkName: "gg-oauth" */ '@/shared/components/third-party-authentication/ThirdPartyAuthentication.vue'),
    props: true
  },
  {
    path: '/gauthen/:config_type',
    name: Routers.GoogleAuthentication,
    component: () => import(/* webpackChunkName: "gg-oauth" */ '@/shared/components/third-party-authentication/google/GoogleAuth.vue'),
    props: true
  },
  {
    path: '/settings/organization',
    name: Routers.OrganizationSettings,
    component: OrganizationSettings,
    redirect: {
      name: Routers.OrganizationOverview
    },
    children: [
      {
        path: 'overview',
        name: Routers.OrganizationOverview,
        component: OrganizationOverview
      },
      {
        path: 'user-management',
        name: Routers.UserManagement,
        component: UserManagement,
        props: true
      },
      {
        path: 'user-management/:username',
        name: Routers.UserDetail,
        component: UserDetail,
        props: true
      },
      {
        path: 'token-management',
        name: Routers.APIKeyManagement,
        component: APIKeyManagement,
        props: true
      },
      {
        path: 'user-activity',
        name: Routers.UserActivity,
        component: UserActivity,
        props: true
      },
      {
        path: 'clickhouse-config',
        name: Routers.ClickhouseConfig,
        component: ClickhouseConfig,
        props: true
      },
      {
        path: 'plan-and-billing',
        name: Routers.PlanAndBilling,
        component: PlanAndBilling,
        props: true
      },
      {
        path: 'plan-and-billing/detail',
        name: Routers.PlanDetail,
        component: PlanDetail,
        props: true
      }
    ]
  },
  {
    path: '/data-warehouse/data-cook',
    name: Routers.DataCook,
    component: () => import(/* webpackChunkName: "data-cook" */ '@/screens/data-cook/views/DataCook.vue'),
    redirect: {
      name: Routers.MyEtl
    },
    children: [
      {
        path: 'my-etl',
        name: Routers.MyEtl,
        component: () => import(/* webpackChunkName: "data-cook-job" */ '@/screens/data-cook/views/list-etl-job/ListEtlJob.vue'),
        props: {
          type: LIST_ETL_JOB_TYPE.MyEtl
        }
      },
      {
        path: 'shared',
        name: Routers.SharedEtl,
        component: () => import(/* webpackChunkName: "data-cook-job" */ '@/screens/data-cook/views/list-etl-job/ListEtlJob.vue'),
        props: {
          type: LIST_ETL_JOB_TYPE.SharedEtl
        }
      },
      {
        path: 'history',
        name: Routers.EtlHistory,
        component: () => import(/* webpackChunkName: "data-cook-history" */ '@/screens/data-cook/views/etl-history/EtlHistory.vue')
      },
      {
        path: 'trash',
        name: Routers.ArchivedEtl,
        component: () => import(/* webpackChunkName: "data-cook-job" */ '@/screens/data-cook/views/list-etl-job/ListEtlJob.vue'),
        props: {
          type: LIST_ETL_JOB_TYPE.ArchivedEtl
        }
      },
      {
        path: 'my-etl/create',
        name: Routers.CreateEtl,
        component: () => import(/* webpackChunkName: "data-cook-management" */ '@/screens/data-cook/views/manage-etl-job/ManageEtlJob.vue'),
        props: true
      },
      {
        path: 'my-etl/:name',
        name: Routers.UpdateEtl,
        component: () => import(/* webpackChunkName: "data-cook-management" */ '@/screens/data-cook/views/manage-etl-job/ManageEtlJob.vue'),
        props: true
      }
    ]
  },
  {
    path: '/embedded/dashboard/:name',
    name: Routers.EmbeddedDashboard,
    component: EmbeddedDashboard,
    props: true
  },
  {
    path: '/api/lake/file/download',
    name: Routers.FileDownload,
    beforeEnter: to => {
      window.location.href = UrlUtils.getDownloadURL(to.query.path as string);
    }
  },
  {
    path: '/notfound',
    name: Routers.NotFound,
    component: NotFound,
    props: true
  },
  {
    path: '*',
    redirect: { name: Routers.NotFound, params: { resource: 'page' } }
  }
];

/**
 * Xoa bo cac router tong tai trong param router names. co the remove router nested
 */
const removeRouters = (routers: RouteConfig[], routerNames: Routers[]): RouteConfig[] => {
  const routerNameAsSet = new Set(routerNames);
  const currentRouters = routers.filter(router => routerNameAsSet.has(router.name as Routers));
  return currentRouters.map(router => {
    if (router.children) {
      router.children = removeRouters(router.children, routerNames);
    }
    return router;
  });
};

// fixme: refactor to resolver and handler pattern
if (EnvUtils.isDisableLakeHouse()) {
  removeRouters(routes, [Routers.LakeHouse, Routers.LakeQueryBuilder, Routers.LakeJob]);
}

if (EnvUtils.isDisableCDP()) {
  removeRouters(routes, [Routers.CDP]);
}

if (EnvUtils.isDisableIngestion()) {
  removeRouters(routes, [Routers.DataIngestion]);
}

if (EnvUtils.isDisableStreaming()) {
  removeRouters(routes, [Routers.Streaming]);
}

if (EnvUtils.isDisableUserActivities()) {
  removeRouters(routes, [Routers.UserActivity]);
}

const router = new VueRouter({
  mode: 'history',
  base: process.env.BASE_URL,
  routes,
  // reset page when navigate to other page
  scrollBehavior: (to, from, savedPosition) => {
    return { x: 0, y: 0 };
  }
});

router.beforeEach(async (to, from, next) => {
  next();

  await DiAnalytics.enterScreenStart(to.name || '');

  if (RouterUtils.isRoot(to.name) || RouterUtils.isNotNeedSession(to.name!)) {
    if (AuthenticationModule.isLoggedIn) {
      next({ name: Routers.AllData });
    }
  }
});

router.afterEach(async (to, from) => {
  Log.debug(`Router::afterEach:: opened ${to.name} from ${from.name}  at ${Date.now()}`);
  if (from.name) {
    await DiAnalytics.exitScreen(from.name || '');
  } else {
    await DiAnalytics.exitScreen(to.name || '');
  }

  await DiAnalytics.enterScreen(to.name || '');
});
export default router;
