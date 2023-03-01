package datainsider.jobworker.service.handler
import com.google.ads.googleads.lib.GoogleAdsClient
import com.google.ads.googleads.v12.errors.GoogleAdsException
import com.google.ads.googleads.v12.resources.{CustomerClient, CustomerName}
import com.google.ads.googleads.v12.services.GoogleAdsServiceClient.SearchPagedResponse
import com.google.ads.googleads.v12.services.{CustomerServiceClient, GoogleAdsRow, ListAccessibleCustomersRequest, ListAccessibleCustomersResponse, SearchGoogleAdsRequest}
import com.google.api.client.http.HttpResponseException
import com.google.auth.oauth2.UserCredentials
import com.google.cloud.http.HttpTransportOptions.DefaultHttpTransportFactory
import com.twitter.util.Future
import com.twitter.util.logging.Logging
import datainsider.jobworker.domain.{GoogleAdsSource, Job}
import datainsider.jobworker.util.Using

import java.net.URI
import java.util
import scala.collection.mutable.ArrayBuffer
import scala.jdk.CollectionConverters.asScalaBufferConverter

class GoogleAdsMetaDataHandler(
    source: GoogleAdsSource,
    clientId: String,
    clientSecret: String,
    serverEncodedUrl: String,
    developerToken: String
) extends SourceMetadataHandler
    with Logging {

  private val credential: UserCredentials = UserCredentials
    .newBuilder()
    .setRefreshToken(source.refreshToken)
    .setClientId(clientId)
    .setClientSecret(clientSecret)
    .setHttpTransportFactory(new DefaultHttpTransportFactory())
    .setTokenServerUri(URI.create(serverEncodedUrl))
    .build()

  private def getGoogleAdsClient(): GoogleAdsClient =
    GoogleAdsClient.newBuilder().setDeveloperToken(developerToken).setCredentials(credential).build()

  override def testConnection(): Future[Boolean] =
    Future {
      try {
        credential.refreshAccessToken()
        true
      } catch {
        case e: HttpResponseException =>
          logger.error(s"GoogleAdsMetaDataHandler::testConnection::${e.getMessage}")
          false
      }
    }

  /**
    * @throws GoogleAdsException
    */
  private def listAllCustomerClientIds(customerId: String): Seq[String] = {
    Using(getGoogleAdsClient().getLatestVersion.createGoogleAdsServiceClient())(client => {
      try {
        val query: String =
          s"""
             |SELECT customer_client.id, customer_client.resource_name, customer_client.time_zone, customer_client.descriptive_name
             |FROM customer_client
             |WHERE customer_client.manager = FALSE AND customer_client.status = 'ENABLED'
             |""".stripMargin
        val request: SearchGoogleAdsRequest = SearchGoogleAdsRequest
          .newBuilder()
          .setQuery(query)
          .setCustomerId(customerId)
          .build()
        val response: SearchPagedResponse = client.search(request)
        val queryResult: util.Iterator[GoogleAdsRow] = response.iterateAll().iterator()
        val customerIds = ArrayBuffer.empty[String]
        while (queryResult.hasNext) {
          val customerClient: CustomerClient = queryResult.next().getCustomerClient
          customerIds.append(customerClient.getId.toString)
        }
        customerIds
      } catch {
        case e: GoogleAdsException =>
          logger.error(s"GoogleAdsMetaDataHandler::GetCustomerClient::${e.getMessage}")
          Seq.empty[String]
      }
    })

  }

  private def listDirectCustomerIds(): Set[String] = {
    Using(getGoogleAdsClient().getLatestVersion.createCustomerServiceClient())(client => {
      val request: ListAccessibleCustomersRequest = ListAccessibleCustomersRequest.newBuilder().build()
      val response: ListAccessibleCustomersResponse = client.listAccessibleCustomers(request)
      val customerIds: Set[String] = response.getResourceNamesList.asScala
        .map(resourceName => {
          CustomerName.parse(resourceName).getCustomerId
        })
        .toSet
      customerIds
    })
  }

  override def listDatabases(): Future[Seq[String]] =
    Future {
      val directCustomerIds: Set[String] = listDirectCustomerIds()
      directCustomerIds
        .flatMap(directCustomerId => {
          listAllCustomerClientIds(directCustomerId)
        })
        .toSeq
    }

  override def listTables(databaseName: String): Future[Seq[String]] = ???

  override def listColumn(databaseName: String, tableName: String): Future[Seq[String]] = ???

  override def testJob(job: Job): Future[Boolean] = ???
}
