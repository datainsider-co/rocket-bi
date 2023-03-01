export enum Routers {
  Dashboard = 'DashboardDetail',
  ChartBuilder = 'ChartBuilder',
  DataBuilder = 'DataBuilder',
  NotFound = 'NotFound',

  Login = 'Login',
  Signup = 'Signup',
  ForgotPassword = 'ForgotPassword',
  PasswordRecovery = 'PasswordRecovery',
  ResendEmail = 'ResendEmail',
  DirectVerify = 'DirectVerify',

  AllData = 'MyData',
  SharedWithMe = 'Shared',
  Recent = 'Recent',
  Starred = 'Starred',
  Trash = 'Trash',
  TrackingProfile = 'UserProfile',
  TrackingProfileDetail = 'UserProfileDetails',
  baseRoute = '',

  DataManagement = 'DataManagement',
  Database = 'Database',
  AllDatabase = 'AllDatabase',
  TrashDatabase = 'TrashDatabase',
  DataSchema = 'DataSchema',
  QueryEditor = 'QueryEditor',
  DataRelationship = 'DataRelationship',

  DataIngestion = 'DataIngestion',
  DataSource = 'DataSource',
  Job = 'Job',
  Streaming = 'Streaming',
  JobHistory = 'JobHistory',

  OrganizationSettings = 'OrganizationSettings',
  OrganizationOverview = 'OrganizationOverview',
  PlanAndBilling = 'PlanAndBilling',
  PlanDetail = 'PlanDetail',
  UserManagement = 'UserManagement',
  UserDetail = 'UserDetail',
  UserActivity = 'UserActivity',
  ClickhouseConfig = 'ClickhouseConfig',
  APIKeyManagement = 'APIKeyManagement',
  PremiumFeatures = 'PremiumFeatures',

  UserSettings = 'UserSettings',
  UserProfile = 'UserProfile/me',

  CDP = 'CDP',
  PathExplorer = 'PathExplorer',
  EventAnalysis = 'EventAnalysis',
  CohortManagement = 'CohortManagement',
  RetentionAnalysis = 'RetentionAnalysis',
  Customer360 = 'Customer360',
  Customer360Detail = 'Customer360Detail',
  FunnelAnalysis = 'FunnelAnalysis',

  GoogleAuthentication = 'GoogleAuthentication',
  FacebookAuthentication = 'FacebookAuthentication',

  DataCook = 'DataCook',
  MyEtl = 'MyEtl',
  SharedEtl = 'SharedEtl',
  EtlHistory = 'EtlHistory',
  ArchivedEtl = 'ArchivedEtl',
  CreateEtl = 'CreateEtl',
  UpdateEtl = 'UpdateEtl',

  LakeHouse = 'LakeHouse',
  LakeExplorer = 'LakeExplorer',
  LakeExplorerTrash = 'LakeExplorerTrash',

  LakeQueryBuilder = 'LakeQueryBuilder',
  LakeQueryEditor = 'LakeQueryEditor',
  LakeSqlQueryEditor = 'LakeSqlQueryEditor',
  LakePythonQueryEditor = 'LakePythonQueryEditor',
  LakeJar = 'LakeJar',

  LakeHouseSchema = 'LakeHouseSchema',
  LakeJob = 'LakeJob',
  LakeAllJob = 'LakeAllJob',
  LakeJobHistory = 'LakeJobHistory',
  LakeJobQuery = 'LakeJobQuery',

  FileDownload = 'FileDownload',

  EmbeddedDashboard = 'EmbeddedDashboard',

  CurrentRoute = '',
  ShopifyIntegrationStep1 = 'ShopifyIntegrationStep1',
  ShopifyIntegrationStep2 = 'ShopifyIntegrationStep2'
}
