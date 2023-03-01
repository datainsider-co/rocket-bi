package datainsider.ingestion.service

import com.google.inject.Inject
import com.twitter.inject.Logging
import com.twitter.util.Future
import datainsider.client.exception.{BadRequestError, InternalError}
import datainsider.client.service.HadoopFileClientService
import datainsider.client.util.ZConfig
import datainsider.ingestion.controller.http.requests.InitSyncRequest
import datainsider.ingestion.domain.qos.FileUploadEvent
import datainsider.ingestion.domain.{FileSyncHistory, FileSyncInfo, SyncStatus, SyncType, UploadInfoStr}
import datainsider.ingestion.repository.FileSyncInfoRepository

trait FileSyncInfoService {

  /**
    * @param initSyncRequest info of this sync session
    * @return  a sync id to track current sync session
    */
  def startSync(initSyncRequest: InitSyncRequest): Future[Long]

  /**
    * process additional logic after all files have been uploaded
    * for full sync: all files are upload to /tmp/<location_path>, therefore need a step to remove old files and put new file to location path
    * for incremental sync: do nothing
    * @param syncId syncId
    * @return
    */
  def endSync(syncId: Long): Future[Boolean]

  /**
    * to be called for each uploaded file
    * @param syncId check if sync id is valid or not
    * @return a file history id to keep track of current uploading file, else throw an exception
    *         workaround: lake-server need to know file is incremental sync, so this function return a special pattern
    *         to lake-server: <sync_type>_<history_id>
    *          - sync_type has two hard coded value: full, incremental
    *          - history id is a long number
    *         E.g: full_123, incr_456
    *         lake-server will recognize the pattern and response correspondingly
    */
  def verify(syncId: Long, fileName: String): Future[String]

  /**
    * update total files, num fail files after each run
    * to be called when api upload file is finished
    */
  def recordHistory(
      historyId: Long,
      fileName: String,
      fileSize: Long,
      isSuccess: Boolean,
      message: String
  ): Future[Boolean]

  def list(from: Int, size: Int): Future[Seq[FileSyncInfo]]

}

class SyncInfoServiceImpl @Inject() (
    syncInfoRepository: FileSyncInfoRepository,
    fileHistoryService: FileSyncHistoryService,
    hadoopFileClientService: HadoopFileClientService
) extends FileSyncInfoService
    with Logging {

  override def startSync(request: InitSyncRequest): Future[Long] = {
    val newSyncInfo = FileSyncInfo(
      name = request.name,
      path = request.path,
      syncType = SyncType.withName(request.syncType),
      syncStatus = SyncStatus.Syncing,
      startTime = System.currentTimeMillis(),
      endTime = 0L,
      totalFiles = 0,
      numFailed = 0
    )
    syncInfoRepository.create(newSyncInfo)
  }

  override def endSync(syncId: Long): Future[Boolean] = {
    for {
      syncInfo <- syncInfoRepository.get(syncId)
      _ = if (syncInfo.endTime != 0) throw BadRequestError("job is already ended")

      postProcessed <- postSyncProcess(syncInfo)

      finishedSyncInfo = syncInfo.copy(endTime = System.currentTimeMillis(), syncStatus = SyncStatus.Finished)
      syncInfoUpdated <- syncInfoRepository.update(finishedSyncInfo)

    } yield syncInfoUpdated && postProcessed
  }

  private def postSyncProcess(syncInfo: FileSyncInfo): Future[Boolean] = {
    syncInfo.syncType match {
      case SyncType.FullSync =>
        info("begin full sync rename process:")

        val tmpPath = "/tmp" + syncInfo.path
        val mainPath = syncInfo.path
        val trashPath = ZConfig.getString("file_sync.trash_path")

        val nameIndex = mainPath.lastIndexOf("/")
        val containerPath = if (nameIndex != 0) mainPath.substring(0, nameIndex) else "/"
        val dirName = mainPath.substring(nameIndex + 1, mainPath.length)

        for {
          ensureDestFolder <- hadoopFileClientService.createFolder("/", mainPath)
          movedOldToTrash <- hadoopFileClientService.move(mainPath, trashPath, overwrite = true, dirName)
          movedTmpFolder <- hadoopFileClientService.move(tmpPath, containerPath, overwrite = true, dirName)
        } yield {
          if (movedTmpFolder) {
            info(s"moved files full sync successfully: $tmpPath to $mainPath")
            true
          } else {
            throw InternalError("move full sync files failed: ")
          }
        }

      case SyncType.IncrementalSync => Future.True
    }
  }

  override def verify(syncId: Long, fileName: String): Future[String] = {
    // TODO: improve with apiKeyService here, check data from syncId, check if job is ended, return path...

    val fileHistory = FileSyncHistory(
      syncId = syncId,
      fileName = fileName,
      startTime = System.currentTimeMillis(),
      endTime = 0L,
      syncStatus = SyncStatus.Syncing,
      message = ""
    )

    for {
      syncInfo <- syncInfoRepository.get(syncId)
      _ = if (syncInfo.endTime != 0) throw BadRequestError("job is already ended")
      historyId <- fileHistoryService.create(fileHistory)
    } yield {
      syncInfo.syncType match {
        case SyncType.FullSync        => UploadInfoStr.FullSyncType(historyId, syncInfo.path)
        case SyncType.IncrementalSync => UploadInfoStr.IncrementalType(historyId, syncInfo.path)
      }
    }
  }

  override def recordHistory(
      historyId: Long,
      fileName: String,
      fileSize: Long,
      isSuccess: Boolean,
      message: String
  ): Future[Boolean] = {
    for {
      // update file history
      fileHistory <- fileHistoryService.get(historyId)
      finishedHistory = fileHistory.copy(
        endTime = System.currentTimeMillis(),
        syncStatus = if (!isSuccess) SyncStatus.Failed else SyncStatus.Finished,
        message = message
      )
      fileHistoryUpdated <- fileHistoryService.update(finishedHistory)

      // update sync info history
      syncInfo <- syncInfoRepository.get(fileHistory.syncId)
      newSyncInfo = syncInfo.copy(
        totalFiles = syncInfo.totalFiles + 1,
        numFailed = if (!isSuccess) syncInfo.numFailed + 1 else syncInfo.numFailed
      )
      syncInfoUpdated <- syncInfoRepository.update(newSyncInfo)

      // monitor tracking event
//      _ = TrackingClient.track(
//        new FileUploadEvent(
//          syncInfo.orgId,
//          System.currentTimeMillis(),
//          fileName,
//          syncInfo.path,
//          fileSize,
//          syncInfo.syncId,
//          syncInfo.syncType.toString
//        )
//      )
    } yield fileHistoryUpdated && syncInfoUpdated
  }

  override def list(from: Int, size: Int): Future[Seq[FileSyncInfo]] = {
    syncInfoRepository.list(from, size)
  }
}

class MockFileSyncInfoService extends FileSyncInfoService {

  /**
    * @param initSyncRequest info of this sync session
    * @return a sync id to track current sync session
    */
  override def startSync(initSyncRequest: InitSyncRequest): Future[Long] = Future.value(1L)

  /**
    * process additional logic after all files have been uploaded
    * for full sync: all files are upload to /tmp/<location_path>, therefore need a step to remove old files and put new file to location path
    * for incremental sync: do nothing
    *
    * @param syncId syncId
    * @return
    */
  override def endSync(syncId: Long): Future[Boolean] = Future.value(true)

  /**
    * to be called for each uploaded file
    *
    * @param syncId check if sync id is valid or not
    * @return  a file history id to keep track of current uploading file, else throw an exception
    *          workaround: lake-server need to know file is incremental sync, so this function return a special pattern
    *          to lake-server: <sync_type>_<history_id>
    *          - sync_type has two hard coded value: full, incremental
    *          - history id is a long number
    *          E.g: full_123, incr_456
    *          lake-server will recognize the pattern and response correspondingly
    */
  override def verify(syncId: Long, fileName: String): Future[String] = Future.value("")

  /**
    * update total files, num fail files after each run
    * to be called when api upload file is finished
    */
  override def recordHistory(
      historyId: Long,
      fileName: String,
      fileSize: Long,
      isSuccess: Boolean,
      message: String
  ): Future[Boolean] = Future.value(true)

  override def list(from: Int, size: Int): Future[Seq[FileSyncInfo]] = Future.value(Seq())
}
