export enum TrackEvents {
  SelectDatabase = 'select_database',
  SelectDestDatabase = 'select_dest_database',
  SelectTable = 'select_table',
  SelectDestTable = 'select_dest_table',
  SelectFolderPath = 'select_folder_path',
  SelectFilePath = 'select_file_path',

  /**Mydata Event*/
  MyDataDirectoryRename = 'mydata_rename',
  MyDataCreate = 'mydata_create',
  MyDataSelectDirectory = 'mydata_select_directory',

  /**Directory Event*/
  CreateFolderOk = 'create_folder_ok',
  CreateFolderFail = 'create_folder_fail',

  CreateDashboardOk = 'create_dashboard_ok',
  CreateDashboardFail = 'create_dashboard_fail',

  CreateQueryOk = 'create_ad_hoc_query_ok',
  CreateQueryFail = 'create_ad_hoc_query_fail',

  RenameFolderOk = 'rename_folder_ok',
  RenameFolderFail = 'rename_folder_fail',

  RenameDashboardOk = 'rename_dashboard_ok',
  RenameDashboardFail = 'rename_dashboard_fail',

  DirectoryStar = 'directory_star',
  DirectoryStarOk = 'directory_star_ok',
  DirectoryStarFail = 'directory_star_fail',

  DirectoryRemoveStar = 'directory_remove_star',
  DirectoryRemoveStarOk = 'directory_remove_star_ok',
  DirectoryRemoveStarFail = 'directory_remove_star_fail',

  DirectoryMoveToTrash = 'directory_move_to_trash',
  DirectoryMoveToTrashOk = 'directory_move_to_trash_ok',
  DirectoryMoveToTrashFail = 'directory_move_to_trash_fail',

  DirectoryRestore = 'directory_restore',
  DirectoryRestoreOk = 'directory_restore_ok',
  DirectoryRestoreFail = 'directory_restore_fail',

  DirectoryHardRemove = 'directory_hard_remove',
  DirectoryHardRemoveOk = 'directory_hard_remove_ok',
  DirectoryHardRemoveFail = 'directory_hard_remove_fail',

  DirectoryRename = 'directory_rename',
  DirectoryRenameOk = 'directory_rename_ok',
  DirectoryRenameFail = 'directory_name_fail',

  DirectoryMove = 'directory_move',
  DirectoryMoveOk = 'directory_move_ok',
  DirectoryMoveFail = 'directory_move_fail',

  DirectoryCopy = 'directory_copy',
  DirectoryCopyOk = 'directory_copy_ok',
  DirectoryCopyFail = 'directory_copy_fail',

  DirectoryViewProperties = 'directory_view_properties',

  /**File Event*/
  FileDownload = 'file_download',

  /**Share Event*/
  ShowShareModal = 'show_share_modal',

  SelectShareUser = 'select_share_user',
  SelectUserPermission = 'select_user_permission',

  SelectShareAnyonePermission = 'select_share_anyone_permission',
  CopyShareWithAnyone = 'copy_link_share_anyone',
  CopyEmbeddedCode = 'copy_embedded_code',

  SubmitShare = 'submit_share',
  SubmitShareOk = 'submit_share_ok',
  SubmitShareFail = 'submit_share_fail',

  /**Database Management Event*/
  DatabaseManagementSelectDatabase = 'database_management_select_database',
  DatabaseManagementRename = 'database_management_rename',
  DatabaseManagementShareDatabase = 'database_management_share',
  DatabaseManagementMoveToTrash = 'database_management_move_to_trash',
  DatabaseManagementRefresh = 'database_management_refresh',
  DatabaseManagementRestore = 'database_management_restore',
  DatabaseManagementHardRemove = 'database_management_hard_remove',
  //todo: add
  DatabaseManagementCreate = 'database_management_create',

  /**Database Event*/
  DatabaseSubmitRename = 'database_submit_rename',
  DatabaseSubmitMoveToTrash = 'database_submit_move_to_trash',
  DatabaseSubmitHardRemove = 'database_submit_hard_remove',
  DatabaseSubmitRestore = 'database_submit_restore',
  //todo: add
  DatabaseSubmitCreate = 'database_submit_create',

  /**Table Event*/
  TableSubmitRename = 'table_submit_rename',
  TableViewSubmitCreate = 'table_view_submit_create',
  TableSubmitCreate = 'table_view_submit_create',
  TableSubmitSchema = 'table_submit_schema',
  TableSubmitUpdateSchemaByQuery = 'table_submit_update_schema_by_query', //database_name table_name query
  //todo: add
  TableSubmitRemove = 'table_submit_remove',

  /**Column Event*/
  ColumnChangeType = 'column_change_type',
  ColumnChangeDefaultValue = 'column_change_default_value',
  ColumnEnableEncryption = 'column_enable_encryption',
  ColumnDisableEncryption = 'column_disable_encryption',
  ColumnRestore = 'column_restore',
  ColumnDelete = 'column_delete',
  ColumnEdit = 'column_edit',
  ColumnEditExpression = 'column_edit_expression',
  ColumnCreateExpression = 'column_create_expression',
  ColumnSubmit = 'column_submit',

  /**Database TreeView Event*/
  DatabaseTreeViewRefresh = 'database_tree_view_refresh',
  //todo: add
  DatabaseTreeViewCreateDatabase = 'database_tree_view_create_database',
  DatabaseTreeViewRemoveTable = 'database_tree_view_remove_table',

  /**Calculated Event*/
  //todo: add
  CalculatedFieldCreate = 'calculated_field_create',
  CalculatedFieldUpdate = 'calculated_field_update',
  CalculatedFieldSubmitCreate = 'calculated_field_submit_create',
  CalculatedFieldSubmitUpdate = 'calculated_field_submit_update',

  /**Data Schema Event*/
  DataSchemaCancel = 'data_schema_cancel_action',
  DataSchemaSubmitCancel = 'data_schema_submit_cancel',
  DataSchemaSelectTable = 'data_schema_select_table',

  DataSchemaEditSchema = 'data_schema_edit_schema',
  DataSchemaCreateSchema = 'data_schema_create_schema',
  DataSchemaViewSchema = 'data_schema_view_schema',
  DataSchemaViewData = 'data_schema_view_data',
  DataSchemaViewDatabase = 'data_schema_view_database',

  DataSchemaRenameDatabase = 'data_schema_rename_database',
  DataSchemaRenameTable = 'data_schema_rename_table',
  DataSchemaShareDatabase = 'data_schema_share_database',
  DataSchemaHardRemoveDatabase = 'data_schema_hard_remove_database',
  DataSchemaSubmitHardRemoveDatabase = 'data_schema_submit_hard_remove_database',
  DataSchemaHardRemoveTable = 'data_schema_hard_remove_table',
  DataSchemaSubmitHardRemoveTable = 'data_schema_submit_hard_remove_table',
  DataSchemaCreateTable = 'data_schema_create_table',
  DataSchemaQueryTable = 'data_schema_query_table',
  //todo: add or remove
  DataSchemaAddCalculatedField = 'data_schema_add_calculated_field',
  DataSchemaAddColumn = 'data_schema_add_column',
  DataSchemaUpdateSchemaByQuery = 'data_schema_update_schema_by_query',

  /**Adhoc Event*/
  ExecuteQuery = 'execute_query', //query
  AdhocAddChart = 'adhoc_add_chart',
  AdhocCreateMode = 'adhoc_create_mode',
  AdhocEditMode = 'adhoc_edit_mode', //adhoc_id
  AdhocSubmitAddChart = 'adhoc_submit_add_chart', //chart type chart title
  AdhocSelectChart = 'adhoc_select_chart',
  AdhocSaveAnalysis = 'adhoc_add_save_analysis',
  AdhocCreateTableFromQuery = 'adhoc_create_table_from_query',
  AdhocUpdateTableByQuery = 'adhoc_update_table_from_query',
  AdhocConfigChart = 'adhoc_config_chart',
  AdhocSubmitConfigChart = 'adhoc_submit_config_chart',
  AdhocDeleteChart = 'adhoc_delete_chart',
  SaveQueryToCurrentChart = 'save_query_to_current_chart',

  /**Data Relationship*/
  RelationshipAddTable = 'relationship_add_table',
  RelationshipRemoveTable = 'relationship_remove_table',
  RelationshipRemoveRelation = 'relationship_remove_relation',
  RelationshipSetRelation = 'relationship_set_relation',
  RelationshipSave = 'relationship_save',

  /**Data Cook*/
  MyETLView = 'my_etl_view',
  SharedETLView = 'shared_etl_view',
  TrashETLView = 'trash_etl_view',
  ETLCreate = 'etl_create',
  ETLAddSource = 'etl_add_source',
  ETLShare = 'etl_share',
  ETLDelete = 'etl_delete',
  ETLRestore = 'etl_restore',
  ETLForceRun = 'etl_force_run',
  ETLSubmitForceRun = 'etl_submit_force_run',
  ETLCancel = 'etl_cancel',
  ETLRefresh = 'etl_refresh',
  ETLViewDetail = 'etl_view_detail',
  ETLSave = 'etl_save',
  ETLSubmitSave = 'etl_save',

  ETLJoinTable = 'etl_join_table',

  ETLAddSQLQuery = 'etl_add_sql_query',
  ETLEditSQLQuery = 'etl_edit_sql_query',
  ETLSubmitSQLQuery = 'etl_submit_sql_query',

  ETLAddPivotTable = 'etl_add_pivot_table',
  ETLSubmitPivotTable = 'etl_submit_pivot_table',
  ETLEditPivotTable = 'etl_edit_pivot_table',

  ETLAddTransformTable = 'etl_add_transform_table',
  ETLSubmitTransformTable = 'etl_submit_transform_table',
  ETLEditTransformTable = 'etl_edit_transform_table',

  ETLSaveToDatabase = 'etl_save_to_database',
  ETLEditSaveToDatabase = 'etl_edit_save_to_database',
  ETLSubmitSaveToDatabase = 'etl_submit_save_to_database',

  ETLSaveToDataWarehouse = 'etl_save_to_data_warehouse',
  ETLEditSaveToDataWarehouse = 'etl_edit_save_to_data_warehouse',
  ETLSubmitSaveToDataWarehouse = 'etl_submit_save_to_data_warehouse',

  ETLSaveToEmail = 'etl_save_to_email',
  ETLEditSaveToEmail = 'etl_edit_save_to_email',
  ETLSubmitSaveToEmail = 'etl_submit_save_to_email',

  ETLRemoveOperator = 'etl_remove_operator',
  ETLRenameOperator = 'etl_rename_operator',

  /**Join Table*/
  JoinTableShowCreateModal = 'join_table_show_create_modal',
  JoinTableShowEditModal = 'join_table_show_edit_modal',
  JoinTableAddJoinClause = 'join_table_add_join_clause',
  JoinTableRemoveJoinClause = 'join_table_remove_join_clause',
  JoinTableSelectLeftJoinClause = 'join_table_select_left_join_clause',
  JoinTableSelectRightJoinClause = 'join_table_select_right_join_clause',
  JoinTableSubmit = 'join_table_submit',

  /**Manage Field*/
  ManageFieldSubmit = 'manage_field_submit',
  ManageFieldAddColumn = 'manage_field_add_column',
  ManageFieldShowCreateModal = 'manage_field_show_create_modal',
  ManageFieldShowEditModal = 'manage_field_show_edit_modal',

  /**Dashboard Detail*/
  AddChart = 'add_chart',
  AddText = 'add_text',

  SelectChartType = 'select_chart_type',
  SubmitAddChart = 'submit_add_chart',
  SubmitConfigChart = 'submit_config_chart',

  ChartAddInnerFilter = 'chart_add_inner_filter',
  ChartUpdateInnerFilter = 'chart_update_inner_filter',
  ChartDeleteInnerFilter = 'chart_delete_inner_filter',

  DashboardRename = 'dashboard_rename',
  DashboardSubmitRename = 'dashboard_submit_rename',
  DashboardAddFilter = 'dashboard_add_filter',
  DashboardRemoveFilter = 'dashboard_remove_filter',
  ShareDashboard = 'share_dashboard',
  SubmitMainDateFilter = 'submit_main_date_filter',
  RemoveMainDateFilter = 'remove_main_date_filter',
  DashboardResetFilter = 'dashboard_reset_filter',

  RenameChart = 'rename_chart',
  SubmitRenameChart = 'submit_rename_chart',
  DuplicateChart = 'duplicate_chart',
  DeleteChart = 'delete_chart',
  ConfigChart = 'config_chart',

  /**Lake Explorer*/
  LakeExplorerRefresh = 'lake_explorer_refresh',
  LakeDirectoryMove = 'lake_directory_move',
  LakeDirectoryMoveToTrash = 'lake_directory_move_to_trash',
  LakeDirectorySubmitMoveToTrash = 'lake_directory_submit_move_to_trash',
  LakeDirectoryRename = 'lake_directory_rename',
  LakeDirectoryCopy = 'lake_directory_copy',
  LakeDirectoryCreate = 'lake_directory_create',
  LakeSelectDirectory = 'lake_select_directory',

  /**Data Source*/
  DataSourceCreate = 'data_source_create',
  DataSourceView = 'data_source_view',
  DataSourceSubmitCreate = 'data_source_submit_create',
  DataSourceSelectType = 'data_source_select_type',
  DataSourceRefresh = 'data_source_refresh',
  DataSourceDelete = 'data_source_delete',
  DataSourceSubmitDelete = 'data_source_submit_delete',
  DataSourceEdit = 'data_source_edit',
  DataSourceSubmitEdit = 'data_source_submit_edit',
  DataSourceTestConnection = 'data_source_test_connection',
  DataSourceSelect = 'data_source_select',

  /**Job Ingestion*/
  JobIngestionView = 'job_ingestion_view',
  JobIngestionRefresh = 'job_ingestion_refresh',
  JobCreate = 'job_create',
  JobSubmitCreate = 'job_submit_create',
  JobEdit = 'job_edit',
  JobSubmitEdit = 'job_submit_edit',
  JobDelete = 'job_delete',
  JobSubmitDelete = 'job_submit_delete',
  JobForceSync = 'job_force_sync',
  JobSubmitForceSync = 'job_submit_force_sync',
  JobCancel = 'job_cancel',
  CreateGoogleSheetJob = 'create_google_sheet_job',
  CreateGoogleAnalyticJob = 'create_google_analytic_job',
  CSVSubmitSync = 'csv_submit_sync',

  BigQueryLocationSelect = 'big_query_location_select',
  /**CSV Ingestion*/
  SelectGoogleSheetFile = 'select_google_sheet_file',
  SelectSheet = 'select_sheet',

  /**Sheet Ingestion*/
  SelectEncoding = 'select_encoding',
  SelectSelectDelimiter = 'select_delimiter',
  // SelectEncoding = 'select_encoding',

  /**Google Analytic Ingestion*/
  SelectGAProperty = 'select_ga_property',
  SelectGAView = 'select_ga_view',
  SelectStartDate = 'select_start_date',
  SelectEndDate = 'select_end_date',
  GADimensionChange = 'ga_dimension_change',
  GAMetricsChange = 'ga_metrics_change',

  /**Job History*/
  JobHistoryIngestionView = 'job_history_ingestion_view',
  JobHistoryIngestionRefresh = 'job_history_ingestion_refresh',

  /**Lake Schema*/
  ShowCreateTableModal = 'show_create_table_modal', // table_name table_id
  ShowEditTableModal = 'show_edit_table_modal', // table_name table_id table_sources

  LakeSchemaDeleteTable = 'lake_schema_delete_table', //table_id
  LakeSchemaSubmitDeleteTable = 'lake_schema_submit_delete_table', //table_id
  LakeSchemaSelectSourcePath = 'lake_schema_select_source_path', //path
  LakeSchemaCreateTable = 'lake_schema_create_table', //
  LakeSchemaSubmitCreateTable = 'lake_schema_submit_create_table', //table_id table_name table_sources

  LakeSchemaEditTable = 'lake_schema_edit_table', //table_id table_name table_sources
  LakeSchemaSubmitEditTable = 'lake_schema_submit_edit_table', //table_id table_name table_sources

  LakeSchemaRefreshTable = 'lake_schema_refresh_table', //
  LakeSchemaClickQuery = 'lake_schema_click_query', //table_id
  LakeSchemaSelectSources = 'lake_schema_select_sources', //sources //select sources to create table
  LakeSchemaRemoveSource = 'lake_schema_select_sources', //sources //remove sources to create table
  LakeSchemaPreviewTable = 'lake_schema_preview_table', //table_name sources //preview table

  LakeJobSQLExecuteQuery = 'lake_job_sql_execute_query', //query
  LakeJobSQLTestQuery = 'lake_job_sql_test_query', //query
  LakeSqlJobBuilderView = 'lake_sql_job_builder_view',
  LakeJavaJobBuilderView = 'lake_java_job_builder_view',
  LakeCreateSQLJob = 'lake_create_sql_job', //
  LakeSubmitCreateSQLJob = 'lake_submit_create_sql_job', //query job_name

  LakeEditSQLJob = 'lake_edit_sql_job', //query job_name job_id
  LakeSubmitEditSQLJob = 'lake_submit_edit_sql_job', //query job_name job_id

  LakeCreateJavaJob = 'lake_create_java_job', //
  LakeSubmitCreateJavaJob = 'lake_submit_create_java_job',

  LakeEditJavaJob = 'lake_edit_java_job', //job_name job_id
  LakeSubmitEditJavaJob = 'lake_submit_edit_java_job',
  LakeSchemaViewTable = 'lake_schema_view_table', //table_name

  WarehouseSelectSaveMode = 'warehouse_select_save_mode', //mode
  LakeHouseSelectSaveMode = 'lake_house_select_save_mode', //mode

  SelectGitCloneHTTPS = 'select_git_clone_https',
  SelectGitCloneSSH = 'select_git_clone_ssh',
  SelectBuildTool = 'select_build_tool', //type
  /**Lake job management*/
  LakeJobManagementView = 'lake_job_management_view', //
  LakeJobManagementRefresh = 'lake_job_management_refresh', //
  LakeAddJob = 'lake_add_job', //
  LakeJobForceRun = 'lake_job_force_run', //job_id job_nam job_type
  LakeJobSubmitForceRun = 'lake_job_submit_force_run', //job_id job_nam job_type date
  LakeJobCancelForceRun = 'lake_job_cancel_force_run', //job_id job_nam job_type

  LakeJobEdit = 'lake_job_edit', //job_id job_nam job_type
  LakeJobDelete = 'lake_job_delete', //job_id job_nam job_type
  LakeJobSubmitDelete = 'lake_job_submit_delete',
  /**Lake job history*/
  LakeJobHistoryView = 'lake_job_history_view',
  LakeJobHistoryRefresh = 'lake_job_history_view',
  LakeJobHistoryViewLogPath = 'lake_job_history_view_log_path', //path

  /**CDP*/
  PathExplorerSelectStartStep = 'path_explorer_select_start_step', //name type
  PathExplorerRemoveStartStep = 'path_explorer_remove_start_step', //name type
  PathExplorerUpdateFilter = 'path_explorer_update_filter', //old_name old_type new_name new_type
  PathExplorerRemoveFilter = 'path_explorer_remove_filter', //name type
  PathExplorerAddEventFilter = 'path_explorer_add_event_filter', //name
  PathExplorerAddCohortFilter = 'path_explorer_add_cohort_filter', //name
  PathExplorerSelectDateFilter = 'path_explorer_select_date_filer', //start_date end_date

  /**event analysis*/
  EventAnalysisUpdateEvents = 'event_analysis_update_events', //events types
  EventAnalysisSelectDateFilter = 'event_analysis_select_date_filter', //start_date end_date
  EventAnalysisSelectTimeMetric = 'event_analysis_select_time_metric', //type
  EventAnalysisSelectDisplayType = 'event_analysis_select_display_type',

  /**funnel analysis*/
  FunnelAnalysisUpdateEvents = 'funnel_analysis_update_events', //events
  FunnelAnalysisSelectDateFilter = 'funnel_analysis_select_date_filter',

  /**cohorts management*/
  CreateCohort = 'create_cohort', //cohort_name
  SubmitCreateCohort = 'submit_create_cohort', //cohort_name cohort_id
  EditCohort = 'edit_cohort', //cohort_id cohort_name
  DuplicateCohort = 'duplicate_cohort', //cohort_id cohort_name
  SubmitEditCohort = 'submit_edit_cohort', //cohort_id cohort_name cohort_filter
  DeleteCohorts = 'delete_cohorts', //cohort_ids cohort_names
  SubmitDeleteCohorts = 'submit_delete_cohorts', //cohort_ids cohort_names
  CohortManagementRefresh = 'cohort_management_refresh',

  /**Retention analysis*/
  RetentionAnalysisSelectStartEvent = 'retention_analysis_select_start_event', //name
  RetentionAnalysisSelectEndEvent = 'retention_analysis_select_end_event', //name
  RetentionAnalysisSelectDateFilter = 'retention_analysis_select_date_filter', //start_date end_date
  RetentionAnalysisSelectTimeMetric = 'retention_analysis_select_time_metric', //type
  RetentionAnalysisChangeFilter = 'retention_analysis_change_filter', //filters

  /**cdp customers*/

  Customer360FilterChange = 'customer_360_filter_change', //filters
  SelectCustomer = 'select_customer', //name id email
  CustomerDetailSelectDateFilter = 'customer_detail_select_filter', //start_date end_date
  CustomerDetailChangeFilter = 'customer_detail_change_filter', //event_names

  /**User management*/
  CreateUser = 'create_user',
  SubmitCreateUser = 'submit_create_user', //user_first_name user_last_name user_email
  UserManagementRefresh = 'user_management_refresh',
  UserManagementSelectUser = 'user_management_select_user', //user_id user_email user_full_name
  UserManagementSettingLogin = 'user_management_setting_login',
  SubmitSettingLoginMethod = 'submit_setting_login_method',
  ChangeMailWhiteList = 'change_mail_white_list', //mail_domains
  EnableGoogleLogin = 'enable_google_login',
  DisableGoogleLogin = 'disable_google_login',

  AddExtraUserInfo = 'add_extra_user_info', //user_id user_email user_full_name
  SubmitAddExtraUserInfo = 'submit_add_extra_user_info', //user_id user_email user_full_name field_name value
  SuspendUser = 'suspend_user', //user_id user_email user_full_name
  ActiveUser = 'active_user', //user_id user_email user_full_name
  DeleteUser = 'delete_user', //user_id user_email user_full_name
  SubmitDeleteUser = 'submit_delete_user', //user_id user_email user_full_name
  SubmitSaveUserPrivilege = 'submit_save_user_privilege', //permissions user_id user_email user_full_name
  UpdateUserInfo = 'update_user_info', //field_name value user_id user_email

  /**User*/
  EditMyProfile = 'edit_my_profile',
  SubmitEditMyProfile = 'submit_edit_my_profile', //user_id user_email updated_profile

  /**QueryChart*/
  QueryChartOk = 'query_chart_ok', //query
  QueryChartFail = 'query_chart_fail', //query error
  QueryCsvFail = 'query_csv_fail',
  QueryCsvOk = 'query_csv_ok'
}
