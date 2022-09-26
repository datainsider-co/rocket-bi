import Vue from 'vue';
import VueRouter, { RouteConfig } from 'vue-router';
import { AuthenticationModule } from '@/store/modules/authentication.store';
import { Routers } from '@/shared/enums/Routers';
import { RouterUtils } from '@/utils/RouterUtils';
import { Log, UrlUtils } from '@core/utils';
import { SharedDirectoryListingHandler } from '@/screens/Directory/views/MyData/DirectoryListingHandler/SharedDirectoryListingHandler';
import { MyDataDirectoryListingHandler } from '@/screens/Directory/views/MyData/DirectoryListingHandler/MyDataDirectoryListingHandler';
import { StarredDirectoryListingHandler } from '@/screens/Directory/views/MyData/DirectoryListingHandler/StarredDirectoryListingHandler';
import { TrashDirectoryListingHandler } from '@/screens/Directory/views/MyData/DirectoryListingHandler/TrashDirectoryListingHandler';
import { RecentDirectoryListingHandler } from '@/screens/Directory/views/MyData/DirectoryListingHandler/RecentDirectoryListingHandler';
import { LIST_ETL_JOB_TYPE } from '@/screens/DataCook/views/ListEtlJob/ListEtlTypes';
import { LakeExplorerTrashPath } from '@/screens/LakeHouse/LakeHouseConstant';
import DiAnalytics from 'di-web-analytics';

Vue.use(VueRouter);

// TODO: Please! don't delete comment in import
const DirectoryListing = () => import(/* webpackChunkName: "directory" */ '@/screens/Directory/views/DirectoryListing.vue');
const MyData = () => import(/* webpackChunkName: "directory" */ '@/screens/Directory/views/MyData/MyData.vue');
const ShareWithMe = () => import(/* webpackChunkName: "directory" */ '@/screens/Directory/views/MyData/MyData.vue');
const Recent = () => import(/* webpackChunkName: "directory" */ '@/screens/Directory/views/MyData/MyData.vue');
const Star = () => import(/* webpackChunkName: "directory" */ '@/screens/Directory/views/MyData/MyData.vue');
const Trash = () => import(/* webpackChunkName: "directory" */ '@/screens/Directory/views/MyData/MyData.vue');
const DashboardDetail = () => import(/* webpackChunkName: "directory" */ '@/screens/DashboardDetail/views/DashboardDetail.vue');
const EmbeddedDashboard = () => import(/* webpackChunkName: "embedded-dashboard" */ '@/screens/DashboardDetail/views/EmbeddedDashboard.vue');

// const TrackingProfile = () => import(/* webpackChunkName: "tracking-profile" */ '@/screens/TrackingProfile/views/TrackingProfile.vue');
// const TrackingProfileDetail = () => import(/* webpackChunkName: "tracking-profile" */ '@/screens/TrackingProfile/views/TrackingProfileDetail.vue');

const UserSettings = () => import(/* webpackChunkName: "user-profile" */ '@/screens/CurrentUser/views/UserSettings.vue');
const UserProfile = () => import(/* webpackChunkName: "user-profile" */ '@/screens/CurrentUser/components/UserProfileComponent.vue');

const DataManagement = () => import(/* webpackChunkName: "data-management" */ '@/screens/DataManagement/views/DataManagement.vue');
const DatabaseManagement = () =>
  import(/* webpackChunkName: "database-management" */ '@/screens/DataManagement/views/DatabaseManagement/DatabaseManagement.vue');
const DatabaseListing = () => import(/* webpackChunkName: "data-management" */ '@/screens/DataManagement/views/DatabaseManagement/DatabaseListing.vue');
const DataSchema = () => import(/* webpackChunkName: "data-management" */ '@/screens/DataManagement/views/DataSchema/DataSchema.vue');
const QueryEditor = () => import(/* webpackChunkName: "data-management" */ '@/screens/DataManagement/views/QueryEditor/QueryEditor.vue');
const DataRelationship = () => import(/* webpackChunkName: "data-management" */ '@/screens/DataManagement/views/DataRelationship/DataRelationship.vue');

const DataIngestion = () => import(/* webpackChunkName: "data-ingestion" */ '@/screens/DataIngestion/views/DataIngestion.vue');
const DataSource = () => import(/* webpackChunkName: "data-ingestion" */ '@/screens/DataIngestion/components/DataSourceScreen.vue');
const ShopifyIntegrationStep1 = () => import(/* webpackChunkName: "data-ingestion" */ '@/screens/DataIngestion/components/Shopify/ShopifyIntegrationStep1.vue');
const ShopifyIntegrationStep2 = () => import(/* webpackChunkName: "data-ingestion" */ '@/screens/DataIngestion/components/Shopify/ShopifyIntegrationStep2.vue');
const Jobs = () => import(/* webpackChunkName: "data-ingestion" */ '@/screens/DataIngestion/components/JobScreen.vue');
const Streaming = () => import(/* webpackChunkName: "data-ingestion" */ '@/screens/DataIngestion/components/Streaming/Streaming.vue');
const JobHistories = () => import(/* webpackChunkName: "data-ingestion" */ '@/screens/DataIngestion/components/JobHistoryScreen.vue');

const GoogleAuthentication = () => import(/* webpackChunkName: "data-ingestion" */ '@/shared/components/GoogleAuthen/GoogleAuthen.vue');

const OrganizationSettings = () => import(/* webpackChunkName: "organization-settings" */ '@/screens/OrganizationSettings/views/OrganizationSettings.vue');
const OrganizationOverview = () =>
  import(/* webpackChunkName: "organization-settings" */ '@/screens/OrganizationSettings/views/Overview/OrganizationOverview.vue');
const UserActivity = () => import(/* webpackChunkName: "organization-settings" */ '@/screens/OrganizationSettings/views/UserActivityLog/UserActivityLog.vue');
const ClickhouseConfig = () =>
  import(/* webpackChunkName: "organization-settings" */ '@/screens/OrganizationSettings/views/ClickhouseConfig/ClickhouseConfig.vue');
const PlanAndBilling = () => import(/* webpackChunkName: "organization-settings" */ '@/screens/OrganizationSettings/views/PlanAndBilling/PlanAndBilling.vue');
const APIKeyManagement = () =>
  import(/* webpackChunkName: "organization-settings" */ '@/screens/OrganizationSettings/views/TokenManagement/APIKeyManagement.vue');
const PlanDetail = () => import(/* webpackChunkName: "organization-settings" */ '@/screens/OrganizationSettings/views/PlanDetail/PlanDetail.vue');
const UserManagement = () => import(/* webpackChunkName: "organization-settings" */ '@/screens/UserManagement/views/UserManagement/UserManagement.vue');
const UserDetail = () => import(/* webpackChunkName: "organization-settings" */ '@/screens/UserManagement/views/UserDetail/UserDetail.vue');

const CDP = () => import(/* webpackChunkName: "cdp" */ '@/screens/CDP/views/CDP.vue');
const PathExplorer = () => import(/* webpackChunkName: "cdp" */ '@/screens/CDP/views/PathExplorer/PathExplorer.vue');
const EventAnalysis = () => import(/* webpackChunkName: "cdp" */ '@/screens/CDP/views/EventAnalysis/EventAnalysis.vue');
const CohortManagement = () => import(/* webpackChunkName: "cdp" */ '@/screens/CDP/views/CohortManagement/CohortManagement.vue');
const RetentionAnalysis = () => import(/* webpackChunkName: "cdp" */ '@/screens/CDP/views/RetentionAnalysis/RetentionAnalysis.vue');
const Customer360View = () => import(/* webpackChunkName: "cdp" */ '@/screens/CDP/views/Customer360View/Customer360View.vue');
const Customer360ViewDetail = () => import(/* webpackChunkName: "cdp" */ '@/screens/CDP/views/Customer360ViewDetail/Customer360ViewDetail.vue');
const FunnelAnalysis = () => import(/* webpackChunkName: "cdp-funnel-analysis" */ '@/screens/CDP/views/FunnelAnalysis/FunnelAnalysis.vue');

const DataCook = () => import(/* webpackChunkName: "data-cook" */ '@/screens/DataCook/views/DataCook.vue');
const ListEtlJob = () => import(/* webpackChunkName: "data-cook" */ '@/screens/DataCook/views/ListEtlJob/ListEtlJob.vue');
const EtlHistory = () => import(/* webpackChunkName: "data-cook" */ '@/screens/DataCook/views/EtlHistory/EtlHistory.vue');
const ManageEtlJob = () => import(/* webpackChunkName: "data-cook" */ '@/screens/DataCook/views/ManageEtlJob/ManageEtlJob.vue');

const LakeHouse = () => import(/* webpackChunkName: "lake-explorer" */ '@/screens/LakeHouse/views/LakeHouse/LakeHouse.vue');
const LakeExplorer = () => import(/* webpackChunkName: "lake-explorer" */ '@/screens/LakeHouse/views/LakeExplorer/LakeExplorer.vue');
const QueryBuilder = () => import(/* webpackChunkName: "lake-explorer" */ '@/screens/LakeHouse/views/QueryBuilder/QueryBuilder.vue');
const LakeQueryEditor = () => import(/* webpackChunkName: "lake-explorer" */ '@/screens/LakeHouse/views/QueryBuilder/QueryEditor.vue');
const LakeQueryComponent = () => import(/* webpackChunkName: "lake-explorer" */ '@/screens/LakeHouse/Components/QueryBuilder/LakeSQLQueryComponent.vue');
const GitRunnerComponent = () => import(/* webpackChunkName: "lake-explorer" */ '@/screens/LakeHouse/Components/QueryBuilder/GitRunnerComponent.vue');

const LakeSchema = () => import(/* webpackChunkName: "lake-explorer" */ '@/screens/LakeHouse/views/LakeHouseSchema/LakeSchema.vue');

///Lake Job
const LakeJobManagement = () => import(/* webpackChunkName: "lake-explorer" */ '@/screens/LakeHouse/views/Job/LakeJobManagement.vue');
const LakeJob = () => import(/* webpackChunkName: "lake-explorer" */ '@/screens/LakeHouse/views/Job/LakeJobListing.vue');
const LakeJobHistory = () => import(/* webpackChunkName: "lake-explorer" */ '@/screens/LakeHouse/views/Job/LakeJobHistoryListing.vue');
///
const Login = () => import(/* webpackChunkName: "welcome" */ '@/screens/BasicLogin/Login.vue');
const SignIn = () => import(/* webpackChunkName: "welcome" */ '@/screens/BasicLogin/components/SignIn/SignIn.vue');
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
    component: DataIngestion,
    redirect: '/data-ingestion/data-source',
    props: true,
    children: [
      {
        path: '/data-ingestion/data-source',
        name: Routers.DataSource,
        component: DataSource,
        props: true
      },
      {
        path: '/data-ingestion/job',
        name: Routers.Job,
        component: Jobs,
        props: true
      },
      {
        path: '/data-ingestion/streaming',
        name: Routers.Streaming,
        component: Streaming,
        props: true
      },
      {
        path: '/data-ingestion/job-history',
        name: Routers.JobHistory,
        component: JobHistories,
        props: true
      }
    ]
  },
  {
    path: '/shopify',
    name: Routers.ShopifyIntegrationStep1,
    component: ShopifyIntegrationStep1,
    props: true
  },
  {
    path: '/shopify/redirect',
    name: Routers.ShopifyIntegrationStep2,
    component: ShopifyIntegrationStep2,
    props: true
  },
  {
    path: '/gauthen/:config_type',
    name: Routers.GoogleAuthentication,
    component: GoogleAuthentication,
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
    path: '/cdp',
    name: Routers.CDP,
    component: CDP,
    redirect: {
      name: Routers.PathExplorer
    },
    children: [
      {
        path: 'path-explorer',
        name: Routers.PathExplorer,
        component: PathExplorer
      },
      {
        path: 'event-analysis',
        name: Routers.EventAnalysis,
        component: EventAnalysis
      },
      {
        path: 'cohort-management',
        name: Routers.CohortManagement,
        component: CohortManagement
      },
      {
        path: 'retention-analysis',
        name: Routers.RetentionAnalysis,
        component: RetentionAnalysis
      },
      {
        path: 'customer',
        name: Routers.Customer360,
        component: Customer360View
      },
      {
        path: 'customer/:id',
        name: Routers.Customer360Detail,
        component: Customer360ViewDetail
      },
      {
        path: 'funnel-analysis',
        name: Routers.FunnelAnalysis,
        component: FunnelAnalysis
      }
    ]
  },
  {
    path: '/data-warehouse/data-cook',
    name: Routers.DataCook,
    component: DataCook,
    redirect: {
      name: Routers.MyEtl
    },
    children: [
      {
        path: 'my-etl',
        name: Routers.MyEtl,
        component: ListEtlJob,
        props: {
          type: LIST_ETL_JOB_TYPE.MyEtl
        }
      },
      {
        path: 'shared',
        name: Routers.SharedEtl,
        component: ListEtlJob,
        props: {
          type: LIST_ETL_JOB_TYPE.SharedEtl
        }
      },
      {
        path: 'history',
        name: Routers.EtlHistory,
        component: EtlHistory
      },
      {
        path: 'trash',
        name: Routers.ArchivedEtl,
        component: ListEtlJob,
        props: {
          type: LIST_ETL_JOB_TYPE.ArchivedEtl
        }
      },
      {
        path: 'my-etl/create',
        name: Routers.CreateEtl,
        component: ManageEtlJob,
        props: true
      },
      {
        path: 'my-etl/:name',
        name: Routers.UpdateEtl,
        component: ManageEtlJob,
        props: true
      }
    ]
  },
  {
    path: '/lake-house',
    name: Routers.LakeHouse,
    component: LakeHouse,
    redirect: {
      name: Routers.LakeExplorer,
      query: {
        path: '/'
      }
    },
    children: [
      {
        path: 'explorer',
        name: Routers.LakeExplorer,
        component: LakeExplorer,
        props: route => ({
          router: Routers.LakeExplorer,
          root: '/'
        })
      },
      {
        path: 'trash',
        name: Routers.LakeExplorerTrash,
        component: LakeExplorer,
        props: route => ({
          router: Routers.LakeExplorerTrash,
          root: LakeExplorerTrashPath
        })
      }
    ]
  },
  {
    path: '/lake-house/query-builder',
    name: Routers.LakeQueryBuilder,
    component: QueryBuilder,
    redirect: {
      name: Routers.LakeQueryEditor
    },
    children: [
      {
        path: '',
        name: Routers.LakeQueryEditor,
        component: LakeQueryEditor,
        redirect: '/lake-house/query-builder/sql',
        children: [
          {
            path: '/lake-house/query-builder/sql',
            name: Routers.LakeSqlQueryEditor,
            component: LakeQueryComponent
          },
          {
            path: '/lake-house/query-builder/python',
            name: Routers.LakePythonQueryEditor,
            component: LakeQueryComponent
          },
          {
            path: '/lake-house/query-builder/java',
            name: Routers.LakeJar,
            component: GitRunnerComponent
          }
        ]
      }
    ]
  },
  {
    path: '/lake-house/job',
    name: Routers.LakeJob,
    redirect: '/lake-house/job/all',
    component: LakeJobManagement,
    children: [
      {
        path: 'all',
        name: Routers.LakeAllJob,
        component: LakeJob,
        props: true
      },
      {
        path: 'history',
        name: Routers.LakeJobHistory,
        component: LakeJobHistory,
        props: true
      }
    ]
  },

  {
    path: '/lake-house/schema',
    name: Routers.LakeHouseSchema,
    component: LakeSchema
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
  Log.debug('From::', from.path, 'to::', to.path);
  next();
  Log.debug(`Router::beforeEach:: open ${to.name} from ${from.name}  at ${Date.now()}`);

  await DiAnalytics.enterScreenStart(to.name || '');

  if (RouterUtils.isRoot(to.name) || RouterUtils.isNotNeedSession(to.name!)) {
    const hasSession = await AuthenticationModule.checkSession();
    if (hasSession) {
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
