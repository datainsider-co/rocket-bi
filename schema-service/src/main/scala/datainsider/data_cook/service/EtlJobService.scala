package datainsider.data_cook.service

import com.twitter.util.Future
import datainsider.authorization.domain.PermissionProviders
import datainsider.client.domain.Implicits.{FutureEnhanceLike, futurePool}
import datainsider.client.domain.scheduler.NoneSchedule
import datainsider.client.service.{OrgAuthorizationClientService, ProfileClientService}
import datainsider.client.util.TimeUtils
import datainsider.data_cook.domain.EtlJob.ImplicitEtlOperator2Operator
import datainsider.data_cook.domain.Ids.{EtlJobId, OrganizationId, UserId}
import datainsider.data_cook.domain.MockData.{mockEtlJob, mockMyEtlJobs}
import datainsider.data_cook.domain.request.EtlRequest.{CreateEtlJobRequest, ListEtlJobsRequest, UpdateEtlJobRequest}
import datainsider.data_cook.domain.response.EtlJobResponse
import datainsider.data_cook.domain.{EtlConfig, EtlJob, EtlJobStatus, OperatorInfo}
import datainsider.data_cook.repository.{EtlJobRepository, TrashEtlJobRepository}
import datainsider.ingestion.controller.http.requests.PermResourceType
import datainsider.ingestion.domain.PageResult

import javax.inject.Inject

/**
  * CRUD for ETL Job
  * @author tvc12 - Thien Vi
  * */
trait EtlJobService {

  /**
    * List my etl jobs include share with me with pagination and sorting
    */
  def listEtlJobs(organizationId: OrganizationId, request: ListEtlJobsRequest): Future[PageResult[EtlJobResponse]]

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
  def multiGet(organizationId: OrganizationId, ids: Seq[EtlJobId]): Future[Map[EtlJobId, EtlJobResponse]]

  def getJob(organizationId: OrganizationId, id: EtlJobId): Future[EtlJob]

  /***
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
}

class EtlJobServiceImpl @Inject() (
    etlJobRepository: EtlJobRepository,
    profileClientService: ProfileClientService,
    deletedEtlJobRepository: TrashEtlJobRepository,
    orgAuthorizationClientService: OrgAuthorizationClientService
) extends EtlJobService {

  /**
    * List my etl jobs include share with me with pagination and sorting
    */
  override def listEtlJobs(
      organizationId: OrganizationId,
      request: ListEtlJobsRequest
  ): Future[PageResult[EtlJobResponse]] = {
    for {
      etlJobs <- etlJobRepository.list(organizationId, request)
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
          operatorInfo = etlJob.operatorInfo,
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
            operatorInfo = etlJob.operatorInfo,
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
      jobId <- etlJobRepository.insert(organizationId, request)
      etlJob <- etlJobRepository.get(organizationId, jobId)
      _ <- orgAuthorizationClientService.addPermissions(
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
      etlJob <- etlJobRepository.get(organizationId, request.id)
      newJob = etlJob.copy(
        displayName = request.displayName.getOrElse(etlJob.displayName),
        operators = request.operators.getOrElse(etlJob.operators),
        scheduleTime = request.scheduleTime.getOrElse(etlJob.scheduleTime),
        nextExecuteTime = TimeUtils.calculateNextRunTime(request.scheduleTime.getOrElse(etlJob.scheduleTime), None),
        extraData = request.extraData,
        // fixme: preview here
        operatorInfo = request.operators.getOrElse(etlJob.operators).toOperatorInfo(),
        config = request.config.getOrElse(etlJob.config)
      )
      _ <- etlJobRepository.update(newJob)
      jobResponse <- toJobResponse(organizationId, newJob)
    } yield jobResponse
  }

  /**
    * Update etl job
    */
  override def update(job: EtlJob): Future[EtlJob] = {
    etlJobRepository.update(job).map(_ => job)
  }

  /**
    * Soft delete job by EtlJobId, move EtlJob to trash
    *
    * @return EtlJobId
    * @throws Exception if id not existed
    */
  override def softDelete(organizationId: OrganizationId, id: EtlJobId): Future[EtlJobResponse] = {
    for {
      etlJob <- etlJobRepository.get(organizationId, id)
      isOk <- deletedEtlJobRepository.insert(organizationId, etlJob)
      _ <-
        if (isOk) etlJobRepository.delete(organizationId, id)
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
    etlJobRepository.get(organizationId, id)
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
    etlJobRepository.getNextJob
  }

  override def create(etlJob: EtlJob): Future[EtlJob] = {
    etlJobRepository.insert(etlJob).map(id => etlJob.copy(id = id))
  }

  /**
    * Multi get etl
    */
  override def multiGet(organizationId: OrganizationId, ids: Seq[EtlJobId]): Future[Map[EtlJobId, EtlJobResponse]] = {
    if (ids.isEmpty) {
      Future.value(Map.empty)
    } else {
      for {
        jobs: Seq[EtlJob] <- etlJobRepository.multiGet(organizationId, ids)
        jobResponses <- toJobResponses(organizationId, jobs)
      } yield jobResponses.map(jobResponse => jobResponse.id -> jobResponse).toMap
    }
  }

  /**
   * Migrate data operators to operator info
   */
  override def migrateData(): Future[Unit] = futurePool {
    var from = 0
    val size = 100
    var isRunning = true
    while (isRunning) {
      val jobs: Seq[EtlJob] = etlJobRepository.list(from, size).syncGet()
      if (jobs.isEmpty) {
        isRunning = false
      } else {
        from += jobs.size
        etlJobRepository.migrateData(jobs).syncGet()
      }
    }
  }
}

class MockEtlJobService extends EtlJobService {

  /**
    * List my etl jobs include share with me with pagination and sorting
    */
  override def listEtlJobs(
      organizationId: OrganizationId,
      request: ListEtlJobsRequest
  ): Future[PageResult[EtlJobResponse]] = {
    Future.value(mockMyEtlJobs)
  }

  /**
    * Create ETL job from CreateEtlJobRequest
    *
    * @return EtlJob
    * @throws InternalError if create failed
    */
  override def create(organizationId: OrganizationId, request: CreateEtlJobRequest): Future[EtlJobResponse] =
    Future.value(mockEtlJob)

  /**
    * Edit ETL Job
    *
    * @return EtlJob
    * @throws InternalError if update failed
    */
  override def update(organizationId: OrganizationId, request: UpdateEtlJobRequest): Future[EtlJobResponse] =
    Future.value(mockEtlJob)

  /**
    * Soft delete job by EtlJobId, move EtlJob to trash
    *
    * @return EtlJobId
    * @throws Exception if id not existed
    */
  override def softDelete(organizationId: OrganizationId, id: EtlJobId): Future[EtlJobResponse] =
    Future.value(mockEtlJob)

  /**
    * get job by EtlJobId
    *
    * @return EtlJobId
    * @throws Exception if id not existed
    */
  override def get(organizationId: OrganizationId, id: EtlJobId): Future[EtlJobResponse] = Future.value(mockEtlJob)

  /**
    * Update etl job
    */
  override def update(job: EtlJob): Future[EtlJob] = Future.value(job)

  /**   *
    * get next job to be process by JobWorker
    * ** there are two type of job: full sync and incremental sync, if <sync_interval> <= 0 full sync else incremental sync
    * ** full sync only schedule 1 time
    * ** incremental sync scheduler every <sync_interval>
    *
    * @return first job with time ascending order with [(last_successful_sync + sync_interval_in_mn) <= current_timestamp]
    *         and [current_sync_status != Queued && current_sync_status != Syncing]
    */
  override def getNextJob: Future[Option[EtlJob]] = Future.None

  override def getJob(organizationId: OrganizationId, id: EtlJobId): Future[EtlJob] =
    Future.value(EtlJob(1, 1, "", Array.empty, "1", NoneSchedule(), 1, status = EtlJobStatus.Done,
      operatorInfo = OperatorInfo.default(),
      config = EtlConfig()
    ))

  /**
    * Create job from job data with job id
    */
  override def create(job: EtlJob): Future[EtlJob] = Future.value(job)

  /**
    * Multi get etl
    */
  override def multiGet(organizationId: OrganizationId, ids: Seq[EtlJobId]): Future[Map[EtlJobId, EtlJobResponse]] =
    Future.value(Map.empty)

  /**
   * Migrate data operators to operator info
   */
  override def migrateData(): Future[Unit] = Future.Unit
}
