package datainsider.jobscheduler.domain.request

import com.twitter.finagle.http.Request
import com.twitter.finatra.http.annotations.RouteParam
import datainsider.client.filter.LoggedInRequest
import datainsider.jobscheduler.domain.Ids.JobId
import datainsider.jobscheduler.domain.job.Job

import javax.inject.Inject

case class GetNextJobRequest(@Inject request: Request)

case class ListRequest(from: Int, size: Int)

/*@JsonTypeInfo(
  use = JsonTypeInfo.Id.NAME,
  include = JsonTypeInfo.As.PROPERTY,
  property = "class_name"
)
@JsonSubTypes(
  Array(
    new Type(value = classOf[CreateJdbcJobRequest], name = "create_jdbc_job_request")
  )
)
abstract class CreateJobRequest() {
  val dataSourceId: Long
  val syncIntervalInMn: Int
  val baseReq: Request
}

case class CreateJdbcJobRequest(
    dataSourceId: Long,
    @NotEmpty databaseName: String,
    @NotEmpty tableName: String,
    incrementalColumn: Option[String] = None,
    beginValue: String = "0",
    maxFetchSize: Int = 1000,
    syncIntervalInMn: Int = 10,
    @Inject baseReq: Request = null
) extends CreateJobRequest*/

case class UpdateJobRequest(
    @RouteParam id: JobId,
    job: Job,
    @Inject request: Request
) extends LoggedInRequest

case class CreateJobRequest(job: Job, @Inject request: Request) extends LoggedInRequest

case class DeleteJobRequest(@RouteParam id: Long, @Inject request: Request) extends LoggedInRequest

case class CreateMultiJobRequest(
    baseJob: Job,
    tableNames: Seq[String],
    @Inject request: Request
) extends LoggedInRequest

/*
@JsonTypeInfo(
  use = JsonTypeInfo.Id.NAME,
  include = JsonTypeInfo.As.PROPERTY,
  property = "class_name"
)
@JsonSubTypes(
  Array(
    new Type(value = classOf[CreateJdbcSourceRequest], name = "create_jdbc_source_request")
  )
)
abstract class CreateDataSourceRequest {
  val name: String
}

case class CreateJdbcSourceRequest(
    @NotEmpty name: String,
    @JsonScalaEnumeration(classOf[DatabaseTypeRef]) databaseType: DatabaseType,
    @NotEmpty host: String,
    @NotEmpty port: String,
    @NotEmpty username: String,
    @NotEmpty password: String
) extends CreateDataSourceRequest
 */
