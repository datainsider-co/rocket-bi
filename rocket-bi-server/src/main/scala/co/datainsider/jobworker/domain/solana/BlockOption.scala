package co.datainsider.jobworker.domain.solana

import EncodingType.EncodingType
import TransactionDetailType.TransactionDetailType
import Commitment.Commitment

import java.util

object EncodingType extends Enumeration {
  type EncodingType = Value

  val Json = Value("json")
  val JsonParsed = Value("jsonParsed")
  val Base58 = Value("base58")
}

object TransactionDetailType extends Enumeration {
  type TransactionDetailType = Value

  val Full = Value("full")
  val Signatures = Value("signatures")
  val None = Value("none")
}

object Commitment extends Enumeration {
  type Commitment = Value

  val Finalized = Value("finalized")
  val Confirmed = Value("confirmed")
  val Processed = Value("processed")
}

case class CommitmentOption(commitment: Commitment) {
  def asParams: java.util.Map[String, Any] = {
    val map = new util.HashMap[String, Any]()
    map.put("commitment", commitment.toString)
    return map
  }
}

case class BlockOption(encoding: Option[EncodingType] = None,
                       transactionDetails: Option[TransactionDetailType] = None,
                       rewards: Option[Boolean] = None) {
  def asParams: java.util.Map[String, Any] = {
    val map = new util.HashMap[String, Any]()
    if (encoding.isDefined) {
      map.put("encoding", encoding.get.toString)
    }
    if (transactionDetails.isDefined) {
      map.put("transactionDetails", transactionDetails.get.toString)
    }
    if (rewards.isDefined) {
      map.put("rewards", rewards.get)
    }
    return map
  }
}

