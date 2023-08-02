package co.datainsider.jobscheduler.domain.source

import co.datainsider.jobscheduler.domain.Ids.SourceId
import co.datainsider.jobscheduler.domain.source.DataSourceType.DataSourceType

case class AmazonS3Source(
    orgId: Long = -1,
    id: SourceId,
    displayName: String,
    creatorId: String = "",
    lastModify: Long = System.currentTimeMillis(),
    awsAccessKeyId: String,
    awsSecretAccessKey: String,
    region: String
) extends DataSource {
  override def getId: SourceId = id

  override def getCreatorId: String = creatorId

  override def getLastModify: SourceId = lastModify

  override def getName: String = displayName

  override def getType: DataSourceType = DataSourceType.AmazonS3

  override def getConfig: Map[String, Any] = {
    Map("aws_access_key_id" -> awsAccessKeyId, "aws_secret_access_key" -> awsSecretAccessKey, "region" -> region)
  }
}
