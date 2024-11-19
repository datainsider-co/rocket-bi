package co.datainsider.schema.repository

import co.datainsider.bi.client.JdbcClient
import co.datainsider.schema.domain.{FileSyncInfo, SyncStatus, SyncType}
import com.twitter.util.Future
import co.datainsider.common.client.exception.BadRequestError

import java.sql.ResultSet
import scala.collection.mutable.ArrayBuffer

trait FileSyncInfoRepository {
  def create(syncInfo: FileSyncInfo): Future[Long]

  def get(syncId: Long): Future[FileSyncInfo]

  def list(from: Int, size: Int): Future[Seq[FileSyncInfo]]

  def update(syncInfo: FileSyncInfo): Future[Boolean]

  def delete(syncId: Long): Future[Boolean]
}

class MySqlSyncInfoRepository(
    client: JdbcClient,
    dbName: String,
    tblName: String
) extends FileSyncInfoRepository {
  override def create(syncInfo: FileSyncInfo): Future[Long] =
    Future {
      val query =
        s"""
         |insert into $dbName.$tblName (organization_id, name, path, sync_type, sync_status, start_time, end_time, total_files, num_failed)
         |values (?, ?, ?, ?, ?, ?, ?, ?, ?);
         |""".stripMargin

      client.executeInsert(
        query,
        syncInfo.orgId,
        syncInfo.name,
        syncInfo.path,
        syncInfo.syncType.toString,
        syncInfo.syncStatus.toString,
        syncInfo.startTime,
        syncInfo.endTime,
        syncInfo.totalFiles,
        syncInfo.numFailed
      )
    }

  override def get(syncId: Long): Future[FileSyncInfo] =
    Future {
      val query = s"select * from $dbName.$tblName where sync_id = ?;"

      client.executeQuery(query, syncId)(rs => {
        if (rs.next()) {
          toSyncInfo(rs)
        } else {
          throw BadRequestError(s"sync info for id $syncId not found")
        }
      })
    }

  override def list(from: Int, size: Int): Future[Seq[FileSyncInfo]] =
    Future {
      val query = s"select * from $dbName.$tblName limit ? offset ?;"

      val syncInfos = ArrayBuffer.empty[FileSyncInfo]
      client.executeQuery(query, size, from)(rs => {
        while (rs.next()) {
          syncInfos += toSyncInfo(rs)
        }
      })

      syncInfos
    }

  override def update(syncInfo: FileSyncInfo): Future[Boolean] =
    Future {
      val query =
        s"""
         |update $dbName.$tblName
         |set sync_status = ?, end_time = ?, total_files = ?, num_failed = ?
         |where sync_id = ?;
         |""".stripMargin

      client.executeUpdate(
        query,
        syncInfo.syncStatus.toString,
        syncInfo.endTime,
        syncInfo.totalFiles,
        syncInfo.numFailed,
        syncInfo.syncId
      ) >= 0
    }

  override def delete(syncId: Long): Future[Boolean] =
    Future {
      val query =
        s"""
         |delete from $dbName.$tblName
         |where sync_id = ?;
         |""".stripMargin

      client.executeUpdate(query, syncId) >= 0
    }

  private def toSyncInfo(rs: ResultSet): FileSyncInfo = {
    FileSyncInfo(
      orgId = rs.getLong("organization_id"),
      syncId = rs.getLong("sync_id"),
      name = rs.getString("name"),
      path = rs.getString("path"),
      syncType = SyncType.withName(rs.getString("sync_type")),
      syncStatus = SyncStatus.withName(rs.getString("sync_status")),
      startTime = rs.getLong("start_time"),
      endTime = rs.getLong("end_time"),
      totalFiles = rs.getInt("total_files"),
      numFailed = rs.getInt("num_failed")
    )
  }
}
