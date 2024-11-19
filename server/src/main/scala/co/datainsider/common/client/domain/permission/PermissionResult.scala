package co.datainsider.common.client.domain.permission

/**
  * @author tvc12 - Thien Vi
  * @created 03/26/2021 - 2:15 PM
  */
/**
 * Class Trả về kết quả có quyền hay không
 */
abstract class PermissionResult(val isPermitted: Boolean)

case class Permitted() extends PermissionResult(true)

case class UnPermitted(errorMsg: String)
  extends PermissionResult(false)
