package co.datainsider.jobworker.hubspot.deal

import co.datainsider.jobworker.hubspot.util.{JsonUtil, ReflectionUtil}
import com.fasterxml.jackson.databind.PropertyNamingStrategy.LowerCaseStrategy
import com.fasterxml.jackson.databind.annotation.JsonNaming

/**
 * Created by phuonglam on 2/16/17.
 **/
@JsonNaming
case class Deal(
  portalId: Long,
  dealId: Long,
  isDeleted: Boolean,
  associations: Option[DealAssociation] = None,
  properties: Map[String, DealProperties]
) {
  def extractTo[T: Manifest]: T = {
    val node = JsonUtil.createObjectNode
    node.put("deal", dealId)
    node.put("portalId", portalId)
    properties.foreach(f => {
      node.put(f._1, f._2.value)
    })
    JsonUtil.fromJson[T](node, new LowerCaseStrategy())
  }
}

@JsonNaming
case class DealAssociation(
  associatedVids: Seq[Long] = Seq(),
  associatedCompanyIds: Seq[Long] = Seq(),
  associatedDealIds: Seq[Long] = Seq()
)

@JsonNaming
case class DealProperties(
  name: String = "",
  value: String,
  timestamp: Option[Long] = None,
  source: Option[String] = None,
  sourceId: Option[String] = None,
  versions: Option[Seq[Object]] = None
)

@JsonNaming(classOf[LowerCaseStrategy])
case class GenericDeal(
  dealName: String,
  closeDate: Option[Long] = None,
  customer_phone: Option[String] = None,
  customer_email: Option[String] = None,
  createDate: Option[Long] = None,
  pipeline: String = "default",
  hubspot_owner_id: Option[Long] = None,
  dealId: Option[Long] = None,
  portalId: Option[Long] = None,
  amount: Long,
  dealStage: String,
  dealType: Option[String] = None,
  hs_createDate: Option[Long] = None
)

object DealParser {
  def parse[T: Manifest](t: T): Seq[DealProperties] = ReflectionUtil.extractProperty[T](t)
    .filter(f => {
      !f._1.equals("vid") &&
        (f._2 match {
          case o: Option[Nothing] => o.isDefined
          case _ => true
        })
    })
    .map(f => DealProperties(name = f._1.toLowerCase(), value = f._2 match {
      case Some(x) => x.toString
      case _ => f._2.toString
    }))
}

@JsonNaming
case class CreateDealRequest[T: Manifest](
  association: DealAssociation,
  properties: Seq[DealProperties],
  portalId: Option[Long],
  deal: Option[T]
)

object CreateDealRequest {
  def apply[T: Manifest](association: DealAssociation, deal: T, portalId: Option[Long] = None): CreateDealRequest[T] = CreateDealRequest[T](
    association = association,
    properties = DealParser.parse[T](deal),
    portalId = portalId,
    deal = None
  )

  def apply[T: Manifest](association: DealAssociation, properties: Seq[DealProperties], portalId: Option[Long]): CreateDealRequest[T] = CreateDealRequest(
    association = association,
    properties = properties,
    portalId = portalId,
    deal = None
  )
}

@JsonNaming
case class UpdateDealRequest[T: Manifest](
  dealId: Long,
  properties: Seq[DealProperties],
  deal: Option[T]
)

object UpdateDealRequest {
  def apply[T: Manifest](dealId: Long, deal: T): UpdateDealRequest[T] = UpdateDealRequest[T](
    dealId = dealId,
    properties = DealParser.parse[T](deal),
    deal = None
  )

  def apply[T: Manifest](dealId: Long, properties: Seq[DealProperties]): UpdateDealRequest[T] = UpdateDealRequest[T](
    dealId = dealId,
    properties = properties,
    deal = None
  )
}

@JsonNaming
case class GetDealRequest(
  limit: Option[Int] = None,
  offset: Option[Long] = None,
  properties: Seq[String] = Seq(),
  propertiesWithHistory: Seq[String] = Seq(),
  includeAssociations: Option[Boolean] = None,
  since: Option[Long] = None
)

@JsonNaming
case class GetDealResponse(
  deals: Seq[Deal],
  hasMore: Boolean,
  offset: Long
)

@JsonNaming
case class RecentDealResponse(
  results: Seq[Deal],
  hasMore: Boolean,
  offset: Long,
  total: Long
)
