package datainsider.jobworker.repository.reader

import com.fasterxml.jackson.databind.JsonNode
import com.fasterxml.jackson.databind.node.{ArrayNode, ObjectNode}
import datainsider.client.domain.schema.TableSchema
import datainsider.client.domain.schema.column._
import datainsider.jobworker.client.JdbcClient.Record
import datainsider.jobworker.repository.{SkippedBlockException, SolanaClient}
import datainsider.jobworker.util.StringUtils
import datainsider.jobworker.util.StringUtils.RichOptionConvert

import java.sql.Timestamp
import scala.collection.mutable.ArrayBuffer

trait SolanaReader {

  def getHighestSlot(): Long

  def getCurrentSlot(): Long

  def hasNext(): Boolean

  @throws[SkippedBlockException]
  def next(): Unit

  def getBlockRecord(): Record

  def getTransactionRecords(): Seq[Record]

  def getRewardRecords(): Seq[Record]

  def getBlockTableSchema(dbName: String, tblName: String): TableSchema

  def getTransactionTableSchema(dbName: String, tblName: String): TableSchema

  def getRewardTableSchema(dbName: String, tblName: String): TableSchema
}

class SolanaReaderImpl(
    organizationId: Long,
    client: SolanaClient,
    lastSyncedValue: Long
) extends SolanaReader {
  private var currentSlot = lastSyncedValue
  private lazy val total = client.getHighestSlot()
  private var blockRecord: Record = Seq.empty
  private var transactionRecords: Seq[Record] = Seq.empty
  private var rewardRecords: Seq[Record] = Seq.empty

  override def getHighestSlot(): Long = total

  override def hasNext(): Boolean = currentSlot < total

  override def getCurrentSlot(): Long = currentSlot

  private def getValue(node: JsonNode, column: Column, path: String): Any = {
    column match {
      case _: Int64Column => node.at(path).longValue()
      case _: DateTimeColumn => toDateTime(node.at(path))
      case _: StringColumn =>
        val currentNode = node.at(path)
        if (currentNode.isValueNode) {
          currentNode.textValue()
        } else {
          currentNode.toString
        }
    }
  }

  private def toDateTime(node: JsonNode): Timestamp = {
    if (node.isLong) {
      return new Timestamp(node.longValue())
    } else if (node.isValueNode) {
      val value: Option[Long] = node.textValue().toLongOption()
      if (value.isDefined) {
        return new Timestamp(value.get)
      } else {
        return null
      }
    } else {
      return null
    }
  }

  private def toBlock(blockData: JsonNode): Record = {
    this.blockColumns.map(column => {
      val path: String = blockColumNameToPath(column.name)
      getValue(blockData, column, path)
    })
  }

  private def toTransactionRecords(rootData: JsonNode): Seq[Record] = {
    val transactions = new ArrayBuffer[Record]()
    val transactionNodes = rootData.at("/transactions")
    if (transactionNodes.isArray) {
      transactionNodes
        .asInstanceOf[ArrayNode]
        .forEach((node) => {
          val newNode = addExtraData(node, rootData)
          val record = this.transactionColumns.map(column => {
            val path: String = transactionColumNameToPath(column.name)
            getValue(newNode, column, path)
          })
          transactions.append(record)
        })
    }
    transactions.toSeq
  }



  def loadData(): Unit = {
    val blockData: JsonNode = client.getBlock(currentSlot)
    val nodeData = blockData.asInstanceOf[ObjectNode]
    // convert unix time to timestamp
    val timestamp: Long = nodeData.at("/blockTime").longValue()
    if (timestamp != null) {
      nodeData.put("blockTime", timestamp * 1000)
    }
    blockRecord = toBlock(nodeData)
    transactionRecords = toTransactionRecords(nodeData)
    rewardRecords = toRewardRecords(nodeData)
  }

  private def addExtraData(node: JsonNode, rootData: JsonNode) = {
    val newNode = node.asInstanceOf[ObjectNode]
    // add extra data
    newNode.put("blockhash", rootData.at("/blockhash").textValue())
    newNode.put("blockTime", rootData.at("/blockTime").longValue())
    newNode.put("blockHeight", rootData.at("/blockHeight").longValue())
    newNode
  }

  private def toRewardRecords(rootData: JsonNode): Seq[Record] = {
    val rewardRecords = new ArrayBuffer[Record]()
    val rewardNodes = rootData.at("/rewards")
    if (rewardNodes.isArray) {
      rewardNodes
        .asInstanceOf[ArrayNode]
        .forEach((node) => {
          val newNode = addExtraData(node, rootData)
          val record = this.rewardColumns.map(column => {
            val path: String = rewardColumNameToPath(column.name)
            getValue(newNode, column, path)
          })
          rewardRecords.append(record)
        })
    }
    rewardRecords.toSeq
  }

  @throws[SkippedBlockException]
  override def next(): Unit = {
    currentSlot += 1
    loadData()
  }

  override def getBlockRecord(): Record = blockRecord

  override def getTransactionRecords(): Seq[Record] = transactionRecords

  override def getRewardRecords(): Seq[Record] = rewardRecords

  private val blockColumns = Seq(
    StringColumn("blockhash", "blockhash", isNullable = false),
    StringColumn("previous_blockhash", "previous_blockhash", isNullable = false),
    DateTimeColumn("block_time", "block_time", isNullable = false),
    Int64Column("block_height", "block_height", isNullable = true),
    Int64Column("parent_slot", "parent_slot", isNullable = true),
    StringColumn("signatures", "signatures", isNullable = true)
  )

  private val blockColumNameToPath = Map[String, String](
    "blockhash" -> "/blockhash",
    "previous_blockhash" -> "/previousBlockhash",
    "parent_slot" -> "/parentSlot",
    "block_time" -> "/blockTime",
    "block_height" -> "/blockHeight",
    "rewards" -> "/rewards",
    "signatures" -> "/signatures"
  )

  override def getBlockTableSchema(dbName: String, tblName: String): TableSchema = {
    new TableSchema(
      tblName,
      dbName,
      organizationId,
      StringUtils.getOriginTblName(tblName),
      blockColumns,
      partitionBy = Seq("toYYYYMM(block_time)")
    )
  }

  private val transactionColumNameToPath = Map[String, String](
    "blockhash" -> "/blockhash",
    "block_time" -> "/blockTime",
    "block_height" -> "/blockHeight",
    "signatures" -> "/transaction/signatures",
    "account_keys" -> "/transaction/message/accountKeys",
    "message_header" -> "/transaction/message/header",
    "header" -> "/transaction/message/header",
    "instructions" -> "/transaction/message/instructions",
    "address_table_lookups" -> "/transaction/message/addressTableLookups",
    "fee" -> "/meta/fee",
    "error" -> "/meta/err",
    "pre_balances" -> "/meta/preBalances",
    "post_balances" -> "/meta/postBalances",
    "post_balances" -> "/meta/postBalances",
    "inner_instructions" -> "/meta/innerInstructions",
    "pre_token_balances" -> "/meta/preTokenBalances",
    "post_token_balances" -> "/meta/postTokenBalances",
    "log_messages" -> "/meta/logMessages",
    "loaded_addresses" -> "/meta/loadedAddresses",
    "version" -> "/version"
  )

  private val transactionColumns = Seq(
    StringColumn("blockhash", "blockhash", isNullable = false),
    DateTimeColumn("block_time", "block_time", isNullable = false),
    Int64Column("block_height", "block_height", isNullable = true),
    StringColumn("signatures", "signatures", isNullable = true),
    StringColumn("account_keys", "account_keys", isNullable = true),
    StringColumn("header", "header", isNullable = true),
    StringColumn("instructions", "instructions", isNullable = true),
    StringColumn("address_table_lookups", "address_table_lookups", isNullable = true),
    Int64Column("fee", "fee", isNullable = false),
    StringColumn("error", "error", isNullable = true),
    StringColumn("pre_balances", "pre_balances", isNullable = true),
    StringColumn("post_balances", "post_balances", isNullable = true),
    StringColumn("inner_instructions", "inner_instructions", isNullable = true),
    StringColumn("pre_token_balances", "pre_token_balances", isNullable = true),
    StringColumn("post_token_balances", "post_token_balances", isNullable = true),
    StringColumn("log_messages", "log_messages", isNullable = true),
    StringColumn("loaded_addresses", "loaded_addresses", isNullable = true),
    StringColumn("version", "version", isNullable = true)
  )

  override def getTransactionTableSchema(dbName: String, tblName: String): TableSchema = {
    new TableSchema(
      tblName,
      dbName,
      organizationId,
      StringUtils.getOriginTblName(tblName),
      transactionColumns,
      partitionBy = Seq("toYYYYMM(block_time)")
    )
  }

  private val rewardColumNameToPath = Map[String, String](
    "blockhash" -> "/blockhash",
    "block_time" -> "/blockTime",
    "block_height" -> "/blockHeight",
    "commission" -> "/commission",
    "lamports" -> "/lamports",
    "post_balance" -> "/postBalance",
    "pubkey" -> "/pubkey",
    "reward_type" -> "/rewardType",
  )

  private val rewardColumns = Seq(
    StringColumn("blockhash", "blockhash", isNullable = false),
    DateTimeColumn("block_time", "block_time", isNullable = false),
    Int64Column("block_height", "block_height", isNullable = true),
    Int64Column("commission", "commission", isNullable = true),
    Int64Column("lamports", "lamports", isNullable = true),
    Int64Column("post_balance", "post_balance", isNullable = true),
    StringColumn("pubkey", "pubkey", isNullable = true),
    StringColumn("reward_type", "reward_type", isNullable = true),

  )

  override def getRewardTableSchema(dbName: String, tblName: String): TableSchema = {
    new TableSchema(
      tblName,
      dbName,
      organizationId,
      StringUtils.getOriginTblName(tblName),
      rewardColumns,
      partitionBy = Seq("toYYYYMM(block_time)")
    )
  }
}
