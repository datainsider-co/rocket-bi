package datainsider.schema.service

import com.google.inject.Inject
import com.twitter.util.Future
import datainsider.schema.domain.{FileSyncHistory, SyncStatus}
import datainsider.schema.repository.FileSyncHistoryRepository

trait FileSyncHistoryService {

  def create(syncHistory: FileSyncHistory): Future[Long]

  def update(syncHistory: FileSyncHistory): Future[Boolean]

  def list(from: Int, size: Int): Future[Seq[FileSyncHistory]]

  def get(historyId: Long): Future[FileSyncHistory]
}

class SyncHistoryServiceImpl @Inject() (
    syncHistoryRepository: FileSyncHistoryRepository
) extends FileSyncHistoryService {
  override def create(syncHistory: FileSyncHistory): Future[Long] = syncHistoryRepository.create(syncHistory)

  override def update(syncHistory: FileSyncHistory): Future[Boolean] = syncHistoryRepository.update(syncHistory)

  override def list(from: Int, size: Int): Future[Seq[FileSyncHistory]] = syncHistoryRepository.list(from, size)

  override def get(historyId: Long): Future[FileSyncHistory] = syncHistoryRepository.get(historyId)
}

class MockFileSyncHistoryService extends FileSyncHistoryService {
  override def create(syncHistory: FileSyncHistory): Future[Long] = Future.value(1L)

  override def update(syncHistory: FileSyncHistory): Future[Boolean] = Future.value(true)

  override def list(from: Int, size: Int): Future[Seq[FileSyncHistory]] = Future.value(Seq())

  override def get(historyId: Long): Future[FileSyncHistory] =
    Future.value(
      FileSyncHistory(
        orgId = 1L,
        historyId = 1L,
        syncId = 1L,
        fileName = "test",
        startTime = 0,
        endTime = 0,
        syncStatus = SyncStatus.Finished,
        message = ""
      )
    )
}
