package co.datainsider.common.authorization.domain

object PermissionProviders {
  def permissionBuilder = DefaultPermissionBuilder()

  def perm = PermPermissionProvider()
  def user = UserPermissionProvider()
  def directory = DirectoryPermissionProvider()
  def dashboard = DashboardPermissionProvider()
  def widget = WidgetPermissionProvider()
  def setting = SettingPermissionProvider()
  def database = DatabasePermissionProvider();
}
