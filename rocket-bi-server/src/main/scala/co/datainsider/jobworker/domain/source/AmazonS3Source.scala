package co.datainsider.jobworker.domain.source

import co.datainsider.jobworker.domain.{DataSource, DataSourceType}
import co.datainsider.jobworker.domain.DataSourceType.DataSourceType
import co.datainsider.jobworker.domain.Ids.SourceId

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

  override def getName: String = displayName

  override def getType: DataSourceType = DataSourceType.AmazonS3

  override def getConfig: Map[String, Any] = {
    Map("aws_access_key_id" -> awsAccessKeyId, "aws_secret_access_key" -> awsSecretAccessKey)
  }
}
