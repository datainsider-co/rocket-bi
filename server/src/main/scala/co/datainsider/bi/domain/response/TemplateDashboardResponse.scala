//package co.datainsider.bi.domain.response
//
//import co.datainsider.bi.domain.TemplateDashboard
//
///**
//  * created 2023-10-04 2:35 PM
// *
//  * @author tvc12 - Thien Vi
//  */
//case class TemplateDashboardResponse(
//    id: Long,
//    name: String,
//    description: String,
//    thumbnail: String,
//    createdAt: Long = System.currentTimeMillis(),
//    updatedAt: Long = System.currentTimeMillis(),
//    createdBy: String = "",
//    updatedBy: String = "",
//)
//
//object TemplateDashboardResponse {
//  def from(templateDashboard: TemplateDashboard): TemplateDashboardResponse = {
//    TemplateDashboardResponse(
//      id = templateDashboard.id,
//      name = templateDashboard.name,
//      description = templateDashboard.description,
//      thumbnail = templateDashboard.thumbnail,
//      createdAt = templateDashboard.createdAt,
//      updatedAt = templateDashboard.updatedAt,
//      createdBy = templateDashboard.createdBy,
//      updatedBy = templateDashboard.updatedBy,
//    )
//  }
//}
