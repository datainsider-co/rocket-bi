package co.datainsider.caas.user_caas.service

import com.twitter.util.Future
import co.datainsider.caas.user_caas.repository.SessionRepository

import javax.inject.Inject

trait SessionService {
  def clear(): Future[Int]

}

case class SessionServiceImpl @Inject() (sessionRepository: SessionRepository) extends SessionService {

  override def clear(): Future[Int] = {
    Future {
      clearSessions(0)
    }
  }

  private def clearSessions(count: Int): Int = {
    val sessionIds = sessionRepository.getSessionIds(50)
    if (sessionIds != null && sessionIds.nonEmpty) {
      sessionRepository.multiDelete(sessionIds) match {
        case true  => clearSessions(count + sessionIds.size)
        case false => count
      }
    } else {
      count
    }
  }
}
