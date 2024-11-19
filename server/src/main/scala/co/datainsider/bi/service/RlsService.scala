package co.datainsider.bi.service

import co.datainsider.bi.domain.query.Condition
import co.datainsider.bi.domain.response.PaginationResponse
import co.datainsider.bi.domain.{RlsPolicy, UserAttribute}
import co.datainsider.bi.repository.RlsPolicyRepository
import co.datainsider.share.domain.response.PageResult
import com.google.inject.Inject
import com.twitter.util.Future
import co.datainsider.common.client.exception.BadRequestError

trait RlsPolicyService {

  def get(orgId: Long, policyId: Long): Future[RlsPolicy]

  def list(orgId: Long, dbName: Option[String], tblName: Option[String]): Future[PageResult[RlsPolicy]]

  def create(orgId: Long, policy: RlsPolicy): Future[RlsPolicy]

  def update(
      orgId: Long,
      policyId: Long,
      userIds: Seq[String],
      userAttribute: Option[UserAttribute],
      conditions: Array[Condition]
  ): Future[RlsPolicy]

  def put(
      orgId: Long,
      dbName: String,
      tblName: String,
      policies: Seq[RlsPolicy]
  ): Future[PageResult[RlsPolicy]]

  def delete(orgId: Long, policyId: Long): Future[Boolean]

  def suggestAttributes(orgId: Long): Future[PaginationResponse[UserAttribute]]

  def cleanup(orgId: Long): Future[Boolean]

}

class RlsPolicyServiceImpl @Inject() (policyRepository: RlsPolicyRepository) extends RlsPolicyService {

  override def get(orgId: Long, policyId: Long): Future[RlsPolicy] = {
    policyRepository.get(orgId, policyId).map {
      case Some(policy) => policy
      case None         => throw BadRequestError(s"no policy found for id: $policyId")
    }
  }

  override def list(
      orgId: Long,
      dbName: Option[String],
      tblName: Option[String]
  ): Future[PageResult[RlsPolicy]] = {
    policyRepository
      .list(orgId, dbName, tblName)
      .map(policies => PageResult(data = policies, total = policies.size))
  }

  override def create(orgId: Long, policy: RlsPolicy): Future[RlsPolicy] = {
    for {
      createdId <- policyRepository.create(orgId, policy)
      createdPolicy <- get(orgId, createdId)
    } yield createdPolicy
  }

  override def update(
      orgId: Long,
      policyId: Long,
      userIds: Seq[String],
      userAttribute: Option[UserAttribute],
      conditions: Array[Condition]
  ): Future[RlsPolicy] = {
    for {
      currentPolicy <- get(orgId, policyId)
      updateOk <- policyRepository.update(
        orgId,
        currentPolicy.copy(
          userIds = userIds,
          userAttribute = userAttribute,
          conditions = conditions
        )
      )
      updatedPolicy <- get(orgId, policyId)
    } yield updatedPolicy
  }

  override def put(
      orgId: Long,
      dbName: String,
      tblName: String,
      policies: Seq[RlsPolicy]
  ): Future[PageResult[RlsPolicy]] = {
    for {
      currentPolicies <- policyRepository.list(orgId, Some(dbName), Some(tblName))
      newPolicies = policies.filter(_.policyId <= 0)
      toBeUpdatePolicies = policies.filter(_.policyId > 0)
      deleteIds = currentPolicies.map(_.policyId).filterNot(id => policies.map(_.policyId).contains(id))
      createOk <- policyRepository.multiCreate(orgId, newPolicies)
      updateOk <- policyRepository.multiUpdate(orgId, toBeUpdatePolicies)
      deleteOk <- policyRepository.multiDelete(orgId, deleteIds)
      updatedPolicies <- list(orgId, Some(dbName), Some(tblName))
    } yield updatedPolicies

  }

  override def delete(orgId: Long, policyId: Long): Future[Boolean] = {
    policyRepository.delete(orgId, policyId)
  }

  override def suggestAttributes(orgId: Long): Future[PaginationResponse[UserAttribute]] = ???

  override def cleanup(orgId: Long): Future[Boolean] = {
    policyRepository.deleteByOrgId(orgId)
  }
}
