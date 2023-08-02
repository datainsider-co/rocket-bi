package co.datainsider.jobworker.util

import co.datainsider.jobworker.domain.solana.{BlockOption, ClusterNode, CommitmentOption}
import com.fasterxml.jackson.databind.JsonNode
import org.p2p.solanaj.rpc.{RpcClient, RpcException}

import java.util

object SolanaRpcClient {
//  https://docs.solana.com/developing/clients/jsonrpc-api#getclusternodes
  implicit class SolanaRpcClientImplicit(val client: RpcClient) extends AnyVal {

    @throws[RpcException]
    def getClusterNodes(): Array[ClusterNode] = {
      val nodes = client.call(
        "getClusterNodes",
        new util.ArrayList[AnyRef](),
        classOf[Any]
      )
      JsonUtils.mapper.treeToValue[Array[ClusterNode]](JsonUtils.toNode(nodes))
    }
    @throws[RpcException]
    def getBlockHeight(options: Option[CommitmentOption] = None): Long = {
      val list = new util.ArrayList[Object]()
      val optionData = options.map(_.asParams).getOrElse(new util.HashMap())
      list.add(optionData)
      client.call(
        "getBlockHeight",
        list,
        classOf[java.lang.Long]
      )
    }

  @throws[RpcException]
  def getLowestSlot(): Long = {
    client.call(
      "getFirstAvailableBlock",
      new util.ArrayList[AnyRef](),
      classOf[java.lang.Long]
    )
  }

  @throws[RpcException]
  def getHighestSlot(): Long = {
    val data = client.call(
      "getHighestSnapshotSlot",
      new util.ArrayList[AnyRef](),
      classOf[Any]
    )
    val node: JsonNode = JsonUtils.toNode(data)
    val full = node.at("/full").longValue()
    val incremental = node.at("/incremental").longValue()
    println(s"full ${full} & incremental ${incremental}")
    if (incremental != null && incremental > full) {
      incremental
    } else {
      full
    }
  }

  @throws[RpcException]
  def getBlock(slot: Long, options: Option[BlockOption] = None): JsonNode = {
    val optionData = options.map(_.asParams).getOrElse(new util.HashMap())
    val list = new util.ArrayList[Object]()
    list.add(slot.asInstanceOf[Object])
    list.add(optionData)
    val block: Any = client.call(
      "getBlock",
      list,
      classOf[Any]
    )
    JsonUtils.toNode(block)
  }

  }
}
