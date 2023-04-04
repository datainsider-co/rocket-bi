package datainsider.data_cook.service

import com.twitter.util.Future
import datainsider.client.domain.Implicits.{FutureEnhanceLike, futurePool}
import datainsider.client.service.ProfileClientService
import datainsider.data_cook.domain.Ids.{EtlJobId, OrganizationId, UserId}
import datainsider.data_cook.domain.request.EtlRequest.ListEtlJobsRequest
import datainsider.data_cook.domain.response.EtlJobResponse
import datainsider.data_cook.domain.{EtlJob, MockData}
import datainsider.data_cook.repository.{EtlJobRepository, TrashEtlJobRepository}
import datainsider.ingestion.domain.PageResult

import javax.inject.Inject

/**
  * @author tvc12 - Thien Vi
  * */
trait TrashEtlJobService {

  /**
    * List deleted etl jobs with pagination and sorting
    */
  def listEtlJobs(organizationId: OrganizationId, request: ListEtlJobsRequest): Future[PageResult[EtlJobResponse]]

  /**
    * Delete etl jobs forever
    * @throws NotFound if job not existed
    */
  def hardDelete(organizationId: OrganizationId, id: EtlJobId): Future[EtlJobResponse]

  /**
    * Move etl job to my etl
    * @throws NotFound if job not existed
    */
  def restore(organizationId: OrganizationId, id: EtlJobId): Future[EtlJobResponse]

  /**
   * Migrate data operators to operator info
   */
  def migrateData(): Future[Unit]

  def add(organizationId: OrganizationId, etlJob: EtlJob): Future[Boolean]

  def transferOwner(organizationId: EtlJobId, fromUsername: UserId, fromUsername1: UserId): Future[Boolean]

  def deleteByOwnerId(organizationId: OrganizationId, userId: UserId): Future[Boolean]
}

class TrashEtlJobServiceImpl @Inject() (
    etlJobRepository: EtlJobRepository,
    profileClientService: ProfileClientService,
    trashEtlJobRepository: TrashEtlJobRepository
) extends TrashEtlJobService {

  /**
    * List deleted etl jobs with pagination and sorting
    */
  override def listEtlJobs(
      organizationId: OrganizationId,
      request: ListEtlJobsRequest
  ): Future[PageResult[EtlJobResponse]] = {
    for {
      etlJobs <- trashEtlJobRepository.list(organizationId, request)
      jobResponses <- toJobResponses(organizationId, etlJobs._2)
    } yield PageResult(etlJobs._1, jobResponses)
  }

  private def toJobResponse(organizationId: OrganizationId, etlJob: EtlJob): Future[EtlJobResponse] = {
    profileClientService
      .getUserProfile(organizationId = organizationId, username = etlJob.ownerId)
      .map(userProfile =>
        EtlJobResponse(
          id = etlJob.id,
          displayName = etlJob.displayName,
          ownerId = etlJob.ownerId,
          scheduleTime = etlJob.scheduleTime,
          createdTime = etlJob.createdTime,
          updatedTime = etlJob.updatedTime,
          owner = userProfile,
          operators = etlJob.operators,
          extraData = etlJob.extraData,
          status = Option(etlJob.status),
          nextExecuteTime = Option(etlJob.nextExecuteTime),
          lastExecuteTime = etlJob.lastExecuteTime,
          config = etlJob.config
        )
      )
  }

  private def toJobResponses(organizationId: OrganizationId, etlJobs: Seq[EtlJob]): Future[Seq[EtlJobResponse]] = {
    val ownerIds: Seq[String] = etlJobs.map(_.ownerId).distinct
    profileClientService
      .getUserProfiles(organizationId, ownerIds)
      .map(userProfiles =>
        etlJobs.map(etlJob => {
          EtlJobResponse(
            id = etlJob.id,
            displayName = etlJob.displayName,
            ownerId = etlJob.ownerId,
            scheduleTime = etlJob.scheduleTime,
            createdTime = etlJob.createdTime,
            updatedTime = etlJob.updatedTime,
            owner = userProfiles.get(etlJob.ownerId),
            extraData = etlJob.extraData,
            status = Option(etlJob.status),
            nextExecuteTime = Option(etlJob.nextExecuteTime),
            lastExecuteTime = etlJob.lastExecuteTime,
            config = etlJob.config
          )
        })
      )
  }

  /**
    * Delete etl jobs forever
    *
    * @throws NotFound if job not existed
    */
  // todo: remove share
  override def hardDelete(organizationId: OrganizationId, id: EtlJobId): Future[EtlJobResponse] = {
    for {
      job <- trashEtlJobRepository.get(organizationId, id)
      _ <- trashEtlJobRepository.delete(organizationId, job.id)
      jobResponses <- toJobResponse(organizationId, job)
    } yield jobResponses
  }

  /**
    * Move etl job to my etl
    *
    * @throws NotFound if job not existed
    */
  override def restore(organizationId: OrganizationId, id: EtlJobId): Future[EtlJobResponse] = {
    for {
      etlJob <- trashEtlJobRepository.get(organizationId, id)
      isOk <- etlJobRepository.restore(organizationId, etlJob)
      _ <-
        if (isOk) trashEtlJobRepository.delete(organizationId, id)
        else throw new InternalError("error when restore job")
      jobResponses <- toJobResponse(organizationId, etlJob)
    } yield jobResponses
  }


  override def migrateData(): Future[Unit] = futurePool {
    var from = 0
    val size = 100
    var isRunning = true

    while (isRunning) {
      val jobs: Seq[EtlJob] = trashEtlJobRepository.list(from, size).syncGet()
      if (jobs.isEmpty) {
        isRunning = false
      } else {
        from += jobs.size
        trashEtlJobRepository.migrateData(jobs).syncGet()
      }
    }
  }

  override def add(organizationId: OrganizationId, etlJob: EtlJob): Future[Boolean] = {
    trashEtlJobRepository.insert(organizationId, etlJob)
  }

  override def transferOwner(organizationId: EtlJobId, fromUsername: String, toUsername: String): Future[Boolean] = {
    trashEtlJobRepository.transferOwner(organizationId, fromUsername, toUsername)
  }

  override def deleteByOwnerId(organizationId: OrganizationId, userId: String): Future[Boolean] = {
    // todo: remove share
    trashEtlJobRepository.deleteByOwnerId(organizationId, userId)
  }
}

class MockTrashEtlJobService extends TrashEtlJobService {

  /**
    * List deleted etl jobs with pagination and sorting
    */
  override def listEtlJobs(
      organizationId: OrganizationId,
      request: ListEtlJobsRequest
  ): Future[PageResult[EtlJobResponse]] = Future.value(MockData.mockMyEtlJobs)

  /**
    * Delete etl jobs forever
    *
    * @throws NotFound if job not existed
    */
  override def hardDelete(organizationId: OrganizationId, id: EtlJobId): Future[EtlJobResponse] =
    Future.value(MockData.mockEtlJob)

  /**
    * Move etl job to my etl
    *
    * @throws NotFound if job not existed
    */
  override def restore(organizationId: OrganizationId, id: EtlJobId): Future[EtlJobResponse] =
    Future.value(MockData.mockEtlJob)

  override def migrateData(): Future[Unit] = Future.Done

  override def add(organizationId: OrganizationId, etlJob: EtlJob): Future[Boolean] = Future.True

  override def transferOwner(organizationId: EtlJobId, fromUsername: UserId, fromUsername1: UserId): Future[Boolean] = Future.True

  override def deleteByOwnerId(organizationId: OrganizationId, userId: UserId): Future[Boolean] = Future.True
}
