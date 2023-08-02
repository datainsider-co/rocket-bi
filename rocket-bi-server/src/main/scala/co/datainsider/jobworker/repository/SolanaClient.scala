package co.datainsider.jobworker.repository

import co.datainsider.jobworker.domain.solana.{Commitment, CommitmentOption}
import com.fasterxml.jackson.databind.JsonNode
import com.twitter.finagle.http.Status
import com.twitter.inject.Logging
import datainsider.client.exception.DIException
import co.datainsider.jobworker.util.SolanaRpcClient.SolanaRpcClientImplicit
import okhttp3.OkHttpClient
import org.p2p.solanaj.rpc.{RpcClient, RpcException}

import java.util.Optional
import java.util.concurrent.TimeUnit

class SolanaClientException(message: String, cause: Throwable = null) extends DIException(message, cause) {
  override val reason: String = "solana_client_exception"

  override def getStatus: Status = Status.InternalServerError
}

case class SkippedBlockException(message: String, slot: Long) extends SolanaClientException(message)

trait SolanaClient {

  @throws[SolanaClientException]
  @throws[SkippedBlockException]
  def getBlock(slot: Long): JsonNode

  @throws[SolanaClientException]
  def getBlockHeight(): Long

  @throws[SolanaClientException]
  def getConfirmedBlockHeight(): Long


  @throws[SolanaClientException]
  def getHighestSlot(): Long

  @throws[SolanaClientException]
  def getLowestSlot(): Long
}

class SolanaClientImpl(entryPoint: String, maxRetryTime: Int = 3, connectTimeout: Long = 5000, readTimeout: Long = 30000) extends SolanaClient with Logging {
  private val SKIP_CODE = -32007
  private val CLEANED_CODE = -32001
  private lazy val client = new OkHttpClient.Builder()
    .connectTimeout(connectTimeout, TimeUnit.MILLISECONDS)
    .readTimeout(readTimeout, TimeUnit.MILLISECONDS)
    .build()
  private lazy val rpcClient = new RpcClient(entryPoint, client)


  @throws[SolanaClientException]
  @throws[SkippedBlockException]
  def getBlock(slot: Long): JsonNode = {
    try {
      logger.info(s"request get block ${slot}")
      val block = rpcClient.getBlock(slot)
      logger.info(s"get block ${slot} success")
      block
    } catch {
      case ex: RpcException => {
        val code: Optional[Long] = ex.errorData().map(_.getCode)
        if (isSkippedBlock(code)) {
          throw SkippedBlockException(s"skipped slot ${slot}", slot)
        } else {
          throw new SolanaClientException(ex.getMessage, ex)
        }
      }
    }
  }

  private def isSkippedBlock(code: Optional[Long]): Boolean = {
    if (code.isPresent) {
      return code.get() == SKIP_CODE || code.get() == CLEANED_CODE
    } else {
      return false;
    }
  }

  def getBlockHeight(): Long = rpcClient.getBlockHeight(Some(CommitmentOption(Commitment.Finalized)))

  def getConfirmedBlockHeight(): Long = rpcClient.getBlockHeight(Some(CommitmentOption(Commitment.Confirmed)))

  override def getHighestSlot(): Long = rpcClient.getHighestSlot()

  override def getLowestSlot(): Long = rpcClient.getLowestSlot()
}
