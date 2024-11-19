//package co.datainsider.bi.domain
//
//import co.datainsider.jobscheduler.domain.Ids.JobId
//import co.datainsider.jobscheduler.domain.source.DataSourceType.DataSourceType
//import co.datainsider.jobscheduler.domain.source.DataSourceTypeRef
//import com.fasterxml.jackson.module.scala.JsonScalaEnumeration
//
///**
//  * created 2023-10-04 2:24 PM
//  *
//  * @author tvc12 - Thien Vi
//  */
//case class TemplateDashboard(
//    orgId: Long,
//    id: Long,
//    name: String,
//    description: String = "",
//    thumbnail: String = "",
//    dashboard: Dashboard,
//    setting: TemplateSetting,
//    createdAt: Long = System.currentTimeMillis(),
//    updatedAt: Long = System.currentTimeMillis(),
//    createdBy: String = "",
//    updatedBy: String = ""
//)
//
//case class TemplateSetting(
//    requiredDatasourceList: Array[RequiredDataSourceInfo] = Array.empty
//) {
//  def getInConnectedSource(): Array[RequiredDataSourceInfo] = {
//    requiredDatasourceList.filter(setting => !setting.setting.isConnected)
//  }
//
//}
//
//case class RequiredDataSourceInfo(
//    @JsonScalaEnumeration(classOf[DataSourceTypeRef])
//    `type`: DataSourceType,
//    originDatabaseName: String,
//    setting: RequiredDataSourceSetting
//) {
//  def ensureSetupCompleted(): Unit = {
//    if (!setting.isConnected) {
//      throw new IllegalStateException(s"Data source ${`type`} is not connected")
//    }
//
//    if (setting.sourceId.isEmpty) {
//      throw new IllegalStateException(s"Data source ${`type`} is not connected")
//    }
//
//    if (setting.destDatabaseName.isEmpty) {
//      throw new IllegalStateException(s"Data source ${`type`} is not connected")
//    }
//  }
//}
//
//case class RequiredDataSourceSetting(
//    isConnected: Boolean = false,
//    sourceId: Option[Long] = None,
//    jobIds: Seq[Long] = Seq.empty,
//    destDatabaseName: Option[String] = None
//)
//
//case class DataSourceConnectionStatus(
//    @JsonScalaEnumeration(classOf[DataSourceTypeRef])
//    `type`: DataSourceType,
//    isConnected: Boolean,
//    isDatabaseExist: Boolean,
//    isSourceExist: Boolean,
//    // key: job id, value: job status
//    jobStatusMap: Map[JobId, String]
//)
