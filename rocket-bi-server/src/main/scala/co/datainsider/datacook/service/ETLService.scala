package co.datainsider.datacook.service

import co.datainsider.caas.user_profile.client.{OrgAuthorizationClientService, ProfileClientService}
import co.datainsider.datacook.domain.EtlJob.ImplicitEtlOperator2Operator
import co.datainsider.datacook.domain.Ids.{EtlJobId, OrganizationId, UserId}
import co.datainsider.datacook.domain.MockData.{mockEtlJob, mockMyEtlJobs}
import co.datainsider.datacook.domain.request.etl.{CreateEtlJobRequest, ListEtlJobsRequest, UpdateEtlJobRequest}
import co.datainsider.datacook.domain.response.EtlJobResponse
import co.datainsider.datacook.domain.{EtlConfig, EtlJob, ETLStatus, OperatorInfo}
import co.datainsider.datacook.repository.ETLRepository
import co.datainsider.schema.domain.PageResult
import co.datainsider.schema.domain.requests.PermResourceType
import com.twitter.util.Future
import datainsider.authorization.domain.PermissionProviders
import datainsider.client.domain.Implicits.{FutureEnhanceLike, futurePool}
import datainsider.client.domain.scheduler.NoneSchedule
import datainsider.client.util.TimeUtils

import javax.inject.Inject

/**
  * CRUD for ETL Job
  * @author tvc12 - Thien Vi
  */
trait ETLService {

  /**
    * List my etl jobs include share with me with pagination and sorting
    */
  def listEtlJobs(organizationId: OrganizationId, request: ListEtlJobsRequest): Future[PageResult[EtlJobResponse]]

  def listSharedEtlJobs(organizationId: OrganizationId, request: ListEtlJobsRequest): Future[PageResult[EtlJobResponse]]

  /**
    * Create ETL job from CreateEtlJobRequest
    * @return EtlJob
    * @throws InternalError if create failed
    */
  def create(organizationId: OrganizationId, request: CreateEtlJobRequest): Future[EtlJobResponse]

  /**
    * Create job from job data with job id
    */
  def create(etlJob: EtlJob): Future[EtlJob]

  /**
    * Edit ETL Job
    * @return EtlJob
    * @throws InternalError if update failed
    */
  def update(organizationId: OrganizationId, request: UpdateEtlJobRequest): Future[EtlJobResponse]

  /**
    * Update etl job
    */
  def update(job: EtlJob): Future[EtlJob]

  /**
    * Soft delete job by EtlJobId, move EtlJob to trash
    * @return EtlJobId
    * @throws Exception if id not existed
    */
  def softDelete(organizationId: OrganizationId, id: EtlJobId): Future[EtlJobResponse]

  /**
    * get job by EtlJobId
    * @return EtlJobId
    * @throws Exception if id not existed
    */
  def get(organizationId: OrganizationId, id: EtlJobId): Future[EtlJobResponse]

  /**
    * Multi get etl
    */
  @deprecated("unused method")
  def multiGet(organizationId: OrganizationId, ids: Seq[EtlJobId]): Future[Map[EtlJobId, EtlJobResponse]]

  def getJob(organizationId: OrganizationId, id: EtlJobId): Future[EtlJob]

  /** *
    * get next job to be process by JobWorker
    * ** there are two type of job: full sync and incremental sync, if <sync_interval> <= 0 full sync else incremental sync
    * ** full sync only schedule 1 time
    * ** incremental sync scheduler every <sync_interval>
    * @return first job with time ascending order with [(last_successful_sync + sync_interval_in_mn) <= current_timestamp]
    *         and [current_sync_status != Queued && current_sync_status != Syncing]
    */
  def getNextJob: Future[Option[EtlJob]]

  /**
    * Migrate data operators to operator info
    */
  def migrateData(): Future[Unit]

  /**
    * transfer owner of etl job
    */
  def transfer(organizationId: EtlJobId, fromUsername: UserId, toUsername: UserId): Future[Boolean]

  def deleteUserData(organizationId: OrganizationId, userId: UserId): Future[Boolean]
}

class ETLServiceImpl @Inject()(
    etlRepository: ETLRepository,
    profileClientService: ProfileClientService,
    trashETLService: TrashETLService,
    orgClientService: OrgAuthorizationClientService
) extends ETLService {

  /**
    * List my etl jobs include share with me with pagination and sorting
    */
  override def listEtlJobs(
      organizationId: OrganizationId,
      request: ListEtlJobsRequest
  ): Future[PageResult[EtlJobResponse]] = {
    for {
      etlJobs <- etlRepository.list(organizationId, request)
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
    * Create ETL job from CreateEtlJobRequest
    *
    * @return EtlJob
    * @throws InternalError if create failed
    */
  override def create(organizationId: OrganizationId, request: CreateEtlJobRequest): Future[EtlJobResponse] = {
    for {
      jobId <- etlRepository.insert(organizationId, request)
      etlJob <- etlRepository.get(organizationId, jobId)
      _ <- orgClientService.addPermissions(
        organizationId,
        request.currentUsername,
        Seq(
          PermissionProviders.permissionBuilder
            .perm(organizationId, PermResourceType.ETL.toString, "*", etlJob.id.toString)
        )
      )
      jobResponse <- toJobResponse(organizationId, etlJob)
    } yield jobResponse
  }

  /**
    * Edit ETL Job
    *
    * @return EtlJob
    * @throws InternalError if update failed
    */
  override def update(organizationId: OrganizationId, request: UpdateEtlJobRequest): Future[EtlJobResponse] = {
    for {
      oldEtl <- etlRepository.get(organizationId, request.id)
      newETL = oldEtl.copy(
        displayName = request.displayName.getOrElse(oldEtl.displayName),
        operators = request.operators.getOrElse(oldEtl.operators),
        scheduleTime = request.scheduleTime.getOrElse(oldEtl.scheduleTime),
        nextExecuteTime = TimeUtils.calculateNextRunTime(request.scheduleTime.getOrElse(oldEtl.scheduleTime), None),
        extraData = request.extraData,
        // fixme: preview here
        operatorInfo = request.operators.getOrElse(oldEtl.operators).toOperatorInfo(),
        config = request.config.getOrElse(oldEtl.config)
      )
      isSuccess <- etlRepository.update(newETL)
      updatedEtl <- etlRepository.get(organizationId, oldEtl.id)
      jobResponse <- toJobResponse(organizationId, updatedEtl)
    } yield jobResponse
  }

  /**
    * Update etl job
    */
  override def update(job: EtlJob): Future[EtlJob] = {
    etlRepository.update(job).map(_ => job)
  }

  /**
    * Soft delete job by EtlJobId, move EtlJob to trash
    *
    * @return EtlJobId
    * @throws Exception if id not existed
    */
  override def softDelete(organizationId: OrganizationId, id: EtlJobId): Future[EtlJobResponse] = {
    for {
      etlJob <- etlRepository.get(organizationId, id)
      isOk <- trashETLService.add(organizationId, etlJob)
      _ <-
        if (isOk) etlRepository.delete(organizationId, id)
        else throw new InternalError("error when delete job")
      jobResponse <- toJobResponse(organizationId, etlJob)
    } yield jobResponse
  }

  /**
    * get job by EtlJobId
    *
    * @return EtlJobId
    * @throws Exception if id not existed
    */
  override def get(organizationId: OrganizationId, id: EtlJobId): Future[EtlJobResponse] = {
    for {
      etlJob <- getJob(organizationId, id)
      jobResponse <- toJobResponse(organizationId, etlJob)
    } yield jobResponse
  }

  override def getJob(organizationId: OrganizationId, id: EtlJobId): Future[EtlJob] = {
    etlRepository.get(organizationId, id)
  }

  /** *
    * get next job to be process by JobWorker
    * ** there are two type of job: full sync and incremental sync, if <sync_interval> <= 0 full sync else incremental sync
    * ** full sync only schedule 1 time
    * ** incremental sync scheduler every <sync_interval>
    *
    * @return first job with time ascending order with [(last_successful_sync + sync_interval_in_mn) <= current_timestamp]
    *         and [current_sync_status != Queued && current_sync_status != Syncing]
    */
  override def getNextJob: Future[Option[EtlJob]] = {
    etlRepository.getNextJob
  }

  override def create(etlJob: EtlJob): Future[EtlJob] = {
    etlRepository.insert(etlJob).map(id => etlJob.copy(id = id))
  }

  /**
    * Multi get etl
    */
  override def multiGet(organizationId: OrganizationId, ids: Seq[EtlJobId]): Future[Map[EtlJobId, EtlJobResponse]] = {
    if (ids.isEmpty) {
      Future.value(Map.empty)
    } else {
      for {
        jobs: Seq[EtlJob] <- etlRepository.multiGet(organizationId, ids)
        jobResponses <- toJobResponses(organizationId, jobs)
      } yield jobResponses.map(jobResponse => jobResponse.id -> jobResponse).toMap
    }
  }

  /**
    * Migrate data operators to operator info
    */
  override def migrateData(): Future[Unit] =
    futurePool {
      var from = 0
      val size = 100
      var isRunning = true
      while (isRunning) {
        val jobs: Seq[EtlJob] = etlRepository.list(from, size).syncGet()
        if (jobs.isEmpty) {
          isRunning = false
        } else {
          from += jobs.size
          etlRepository.migrateData(jobs).syncGet()
        }
      }
    }

  /**
    * transfer owner of etl job
    */
  override def transfer(organizationId: EtlJobId, fromUsername: UserId, toUsername: UserId): Future[Boolean] = {
    for {
      _ <- etlRepository.transferOwner(organizationId, fromUsername, toUsername)
      _ <- trashETLService.transferOwner(organizationId, fromUsername, toUsername)
    } yield true
  }

  override def deleteUserData(organizationId: OrganizationId, userId: UserId): Future[Boolean] = {
    for {
      _ <- etlRepository.deleteByOwnerId(organizationId, userId)
      _ <- trashETLService.deleteByOwnerId(organizationId, userId)
    } yield true
  }

  override def listSharedEtlJobs(
      organizationId: OrganizationId,
      request: ListEtlJobsRequest
  ): Future[PageResult[EtlJobResponse]] = {
    for {
      etlJobs <- etlRepository.listSharedJobs(organizationId, request)
      jobResponses <- toJobResponses(organizationId, etlJobs._2)
    } yield PageResult(etlJobs._1, jobResponses)
  }
}
