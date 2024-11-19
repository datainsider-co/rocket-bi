package co.datainsider.schema.service

import co.datainsider.common.client.domain.kvs.ExpiredKVS
import com.twitter.util.Future

class ExpiredStatusService(db: ExpiredKVS[Long, Boolean]) extends JobStatusService {

  override def isRunning(id: Long): Future[Boolean] =
    Future {
      db.get(id).getOrElse(false)
    }

  override def setRunning(id: Long, isRunning: Boolean): Future[Unit] =
    Future {
      db.put(id, isRunning)
    }

  override def remove(id: Long): Future[Unit] =
    Future {
      db.remove(id)
    }

  override def size(): Future[Int] =
    Future {
      db.size()
    }
}
