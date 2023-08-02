package co.datainsider.schema.repository

import co.datainsider.bi.client.JdbcClient
import co.datainsider.schema.domain.{FileSyncHistory, SyncStatus}
import com.twitter.util.Future
import datainsider.client.exception.BadRequestError

import java.sql.ResultSet
import scala.collection.mutable.ArrayBuffer

trait FileSyncHistoryRepository {
  def create(syncHistory: FileSyncHistory): Future[Long]

  def get(historyId: Long): Future[FileSyncHistory]

  def list(from: Int, size: Int): Future[Seq[FileSyncHistory]]

  def update(syncHistory: FileSyncHistory): Future[Boolean]

  def delete(historyId: Long): Future[Boolean]
}

class MySqlSyncHistoryRepository(
    client: JdbcClient,
    dbName: String,
    tblName: String
) extends FileSyncHistoryRepository {
  override def create(syncHistory: FileSyncHistory): Future[Long] =
    Future {
      val query =
        s"""
        |insert into $dbName.$tblName (organization_id, sync_id, file_name, start_time, end_time, sync_status, message)
        |values (?, ?, ?, ?, ?, ?, ?)
        |""".stripMargin

      client.executeInsert(
        query,
        syncHistory.orgId,
        syncHistory.syncId,
        syncHistory.fileName,
        syncHistory.startTime,
        syncHistory.endTime,
        syncHistory.syncStatus.toString,
        syncHistory.message
      )
    }

  override def get(historyId: Long): Future[FileSyncHistory] =
    Future {
      val query = s"select * from $dbName.$tblName where history_id = ?;"

      client.executeQuery(query, historyId)(rs => {
        if (rs.next()) {
          toSyncHistory(rs)
        } else {
          throw BadRequestError(s"not found sync history with id $historyId")
        }
      })
    }

  override def list(from: Int, size: Int): Future[Seq[FileSyncHistory]] =
    Future {
      val query = s"select * from $dbName.$tblName limit ? offset ?;"

      val syncHistories = ArrayBuffer.empty[FileSyncHistory]
      client.executeQuery(query, size, from)(rs => {
        while (rs.next()) {
          syncHistories += toSyncHistory(rs)
        }
      })

      syncHistories
    }

  override def update(syncHistory: FileSyncHistory): Future[Boolean] =
    Future {
      val query =
        s"""
         |update $dbName.$tblName
         |set sync_status = ?, end_time = ?, message = ?
         |where history_id = ?;
         |""".stripMargin

      client.executeUpdate(
        query,
        syncHistory.syncStatus.toString,
        syncHistory.endTime,
        syncHistory.message,
        syncHistory.historyId
      ) >= 0
    }

  override def delete(historyId: Long): Future[Boolean] =
    Future {
      val query = s"select * from $dbName.$tblName where history_id = ?;"

      client.executeUpdate(query, historyId) >= 0
    }

  private def toSyncHistory(rs: ResultSet): FileSyncHistory = {
    FileSyncHistory(
      orgId = rs.getLong("organization_id"),
      historyId = rs.getLong("history_id"),
      syncId = rs.getLong("sync_id"),
      fileName = rs.getString("file_name"),
      startTime = rs.getLong("start_time"),
      endTime = rs.getLong("end_time"),
      syncStatus = SyncStatus.withName(rs.getString("sync_status")),
      message = rs.getString("message")
    )
  }
}
