package co.datainsider.jobworker.service

import co.datainsider.bi.domain.ClickhouseConnection
import co.datainsider.bi.module.TestContainerModule
import co.datainsider.bi.util.ZConfig
import co.datainsider.jobworker.domain._
import co.datainsider.jobworker.domain.job.{Ga4DateRange, Ga4Dimension, Ga4Job, Ga4Metric}
import co.datainsider.jobworker.domain.response.SyncInfo
import co.datainsider.jobworker.domain.source.GoogleServiceAccountSource
import co.datainsider.jobworker.module.JobWorkerTestModule
import co.datainsider.schema.module.MockSchemaClientModule
import com.twitter.inject.IntegrationTest
import com.twitter.inject.app.TestInjector
import com.twitter.util.Future
import datainsider.client.domain.Implicits.{FutureEnhanceLike, ScalaFutureLike}
import datainsider.client.module.{MockHadoopFileClientModule, MockLakeClientModule}
import education.x.commons.{KVS, SsdbKVS}
import org.nutz.ssdb4j.spi.SSDB

import scala.concurrent.ExecutionContext.Implicits.global

/**
  * created 2022-09-09 4:21 PM
  *
  * @author tvc12 - Thien Vi
  */
class Ga4WorkerTest extends AbstractWorkerTest {

  val runnableJobFactory: RunnableJobFactory = injector.instance[RunnableJobFactory]
  val ssdbClient: SSDB = injector.instance[SSDB]
  val dbName: String = ZConfig.getString("schedule_service.db_name")
  val ssdbKVS: KVS[Long, Boolean] = SsdbKVS[Long, Boolean](dbName, ssdbClient)

  val googleSource = GoogleServiceAccountSource(
    orgId = 1L,
    id = 1L,
    displayName = "google source",
    credential = """
      |{
      |  "type": "service_account",
      |  "project_id": "ga4-project-1662716211975",
      |  "private_key_id": "5ad4a346b672abdddf0f041f09ab02ff0c038230",
      |  "private_key": "-----BEGIN PRIVATE KEY-----\nMIIEvgIBADANBgkqhkiG9w0BAQEFAASCBKgwggSkAgEAAoIBAQDQBhSHxpoC7Bax\n5Y5dv514VLRIirutmGIKSY193X3MNRorOhNI9VL21PW9mFkJnbLETMqdXzmaHr+M\nkOCjUPafGSJP6mRsQznn611PYsYXKFnZt1+d2me5BFhcm6zf4z7CXcheHSykn6ge\nUuvQTlFz4iMy2Y1A0/xhRPKLuE2pZDA+xRUbacowjow6qM4TcZ4aFKEaRj7SEXWU\ndEOu88pw/SJk4uFmQJarQ2MQN7fCDXJfC/yfFOmcyqZCNNdd1o/vFokkf06RijYF\nItQWXzqqGZLyToa7uLqdD5kfxiNhjzcewD6i5S7hm65eLPq5qP4EDDsxFTdo2CMm\nCgSEdBzdAgMBAAECggEAXFrWspERv0phqQlpc2Wm281/XNV7DU8h978/+iljuE27\nGIXoGfQQqVVS5KHGpeZFf7E4IzYrtKkCEb4gfWFsnKXj/ebqPsZ55uUvwBbyK0XW\n3jnzUXmtow6yzCqxTZTuQAyy8FWzhEL9uLjHyOt8bh5v0huUArwayHR72lww3oq3\nl2P5wns0AOdbA9G0BFBWk/vnAcxpMNT+XQp29Q2kxY3yW1fRWIZL8CmVI5z26t2y\nB7NTyTFpR4U6jm08C2sLUdHTARzQ8SOFSMNEAxisyzhX3C/5Lto48F+9gHejFGca\nMYPswm8ItdjfOm3efh4RV1LlT4F7Tw5j33EQPw0nYQKBgQDn9/C0JdG+CWMAf37M\n0msJLC1NN5lEp/mFB193x/ir613nJm0SlTYinuqoyi6WkagB/4A7LxGGCwOQlF7w\nrSSawh5kVWvd9cdraoUuPiO5kSyOfzTgnugg7MomImHVlXVpoBvkV2Lb8mtxdsHt\nnP01QpvVYNeYmm/9DxUgSqr8vwKBgQDlkxk1MRkm3TvFWcbCfFL/UUTqvxmPIQeL\n4Pnfi2+8TZHJxIeTH/LVjHlXQ0WkCo62pJ6WvisQ2xB7E1YgMPMT0mfOfN1dMw4e\nv/yhEpzr+2Nh4nR43RWDADnIlFQDXKhrpn98GHHTWVGyoi6mhaY6dGXMfOmNfHXr\nQ8AIeXBhYwKBgQCq9xRS0eTqOSTcgxtDfnohAoxI8wdlkJ/Yqfx03c+rdgd5i9qr\n7Yk+rv2odYsssiGvh05NUH2L26Y+8vueSx5FaXjY3hRoPPNDefi6glX2OMcsJxkj\nzDqtuZerz39n2YX12Wl1O+rCzMLfl3WK2T/N90+/TmbYNEsBqhIaAK5RJQKBgQDU\nbI0Zo+mzBWiGDrEUSnd92dQcJmFfB9/0tWJgT6Q/J8NrYBdWsmw+3vF0JkItLLur\nEp3Pu/0bZqhUSasatFBnmfwFm5I058X7/AelfxSGYqEt9J1zLJb4FWBiUaV/SuBo\nY7J4wCGqv24SDXF/EhGi6ws68KYnDfAKljD9ZmjvIwKBgEsV/75dAEh7211cJOZv\nImc+EyZoZeiLodBqTCRk/7JkEZgQPGqiAlsF2RQOXW8TauI5KCN2OfpY7lK53KaT\nadSraLfttorc/lRHHbFEx2Xvb6H7MSgI4hJvIEIU8MBwHfWPXzM2AR/+Wy+Bq551\n3qqrrpp5861V9nT8Lac6dm9a\n-----END PRIVATE KEY-----\n",
      |  "client_email": "starting-account-c5s0nsi4oa7f@ga4-project-1662716211975.iam.gserviceaccount.com",
      |  "client_id": "111032448903620990514",
      |  "auth_uri": "https://accounts.google.com/o/oauth2/auth",
      |  "token_uri": "https://oauth2.googleapis.com/token",
      |  "auth_provider_x509_cert_url": "https://www.googleapis.com/oauth2/v1/certs",
      |  "client_x509_cert_url": "https://www.googleapis.com/robot/v1/metadata/x509/starting-account-c5s0nsi4oa7f%40ga4-project-1662716211975.iam.gserviceaccount.com"
      |}
      |""".stripMargin
  )
  val ga4Job = Ga4Job(
    orgId = 1L,
    jobId = 1,
    jobType = JobType.Ga4,
    syncMode = SyncMode.IncrementalSync,
    sourceId = 1L,
    lastSuccessfulSync = System.currentTimeMillis(),
    syncIntervalInMn = 0,
    lastSyncStatus = JobStatus.Synced,
    currentSyncStatus = JobStatus.Synced,
    destDatabaseName = "ga4_database",
    destTableName = "ga4_table",
    destinations = Seq(DataDestination.Clickhouse),
    propertyId = "314717053",
    dateRanges = Array(Ga4DateRange("1daysAgo", "today")),
    metrics = Array(Ga4Metric("eventCount", "int64")),
    dimensions = Array(Ga4Dimension("eventName"), Ga4Dimension("sessionSourceMedium"))
  )

  test("run ga4 job using wrong credentials") {
    val syncInfo = SyncInfo(
      10,
      ga4Job,
      Some(
        googleSource.copy(credential = """
        |{
        |  "type": "service_account",
        |  "project_id": "fake-1662716211975",
        |  "private_key_id": "sadas",
        |  "private_key": "-----BEGIN PRIVATE KEY-----\\n5Y5dv514VLRIirutmGIKSY193X3MNRorOhNI9VL21PW9mFkJnbLETMqdXzmaHr+M\nkOCjUPafGSJP6mRsQznn611PYsYXKFnZt1+d2me5BFhcm6zf4z7CXcheHSykn6ge\nUuvQTlFz4iMy2Y1A0/xhRPKLuE2pZDA+xRUbacowjow6qM4TcZ4aFKEaRj7SEXWU\ndEOu88pw/SJk4uFmQJarQ2MQN7fCDXJfC/yfFOmcyqZCNNdd1o/vFokkf06RijYF\nItQWXzqqGZLyToa7uLqdD5kfxiNhjzcewD6i5S7hm65eLPq5qP4EDDsxFTdo2CMm\nCgSEdBzdAgMBAAECggEAXFrWspERv0phqQlpc2Wm281/XNV7DU8h978/+iljuE27\nGIXoGfQQqVVS5KHGpeZFf7E4IzYrtKkCEb4gfWFsnKXj/ebqPsZ55uUvwBbyK0XW\n3jnzUXmtow6yzCqxTZTuQAyy8FWzhEL9uLjHyOt8bh5v0huUArwayHR72lww3oq3\nl2P5wns0AOdbA9G0BFBWk/vnAcxpMNT+XQp29Q2kxY3yW1fRWIZL8CmVI5z26t2y\nB7NTyTFpR4U6jm08C2sLUdHTARzQ8SOFSMNEAxisyzhX3C/5Lto48F+9gHejFGca\nMYPswm8ItdjfOm3efh4RV1LlT4F7Tw5j33EQPw0nYQKBgQDn9/C0JdG+CWMAf37M\n0msJLC1NN5lEp/mFB193x/ir613nJm0SlTYinuqoyi6WkagB/4A7LxGGCwOQlF7w\nrSSawh5kVWvd9cdraoUuPiO5kSyOfzTgnugg7MomImHVlXVpoBvkV2Lb8mtxdsHt\nnP01QpvVYNeYmm/9DxUgSqr8vwKBgQDlkxk1MRkm3TvFWcbCfFL/UUTqvxmPIQeL\n4Pnfi2+8TZHJxIeTH/LVjHlXQ0WkCo62pJ6WvisQ2xB7E1YgMPMT0mfOfN1dMw4e\nv/yhEpzr+2Nh4nR43RWDADnIlFQDXKhrpn98GHHTWVGyoi6mhaY6dGXMfOmNfHXr\nQ8AIeXBhYwKBgQCq9xRS0eTqOSTcgxtDfnohAoxI8wdlkJ/Yqfx03c+rdgd5i9qr\n7Yk+rv2odYsssiGvh05NUH2L26Y+8vueSx5FaXjY3hRoPPNDefi6glX2OMcsJxkj\nzDqtuZerz39n2YX12Wl1O+rCzMLfl3WK2T/N90+/TmbYNEsBqhIaAK5RJQKBgQDU\nbI0Zo+mzBWiGDrEUSnd92dQcJmFfB9/0tWJgT6Q/J8NrYBdWsmw+3vF0JkItLLur\nEp3Pu/0bZqhUSasatFBnmfwFm5I058X7/AelfxSGYqEt9J1zLJb4FWBiUaV/SuBo\nY7J4wCGqv24SDXF/EhGi6ws68KYnDfAKljD9ZmjvIwKBgEsV/75dAEh7211cJOZv\nImc+EyZoZeiLodBqTCRk/7JkEZgQPGqiAlsF2RQOXW8TauI5KCN2OfpY7lK53KaT\nadSraLfttorc/lRHHbFEx2Xvb6H7MSgI4hJvIEIU8MBwHfWPXzM2AR/+Wy+Bq551\n3qqrrpp5861V9nT8Lac6dm9a\n-----END PRIVATE KEY-----\n",
        |  "client_email": "starting-account-@ga4-project-1662716211975.iam.gserviceaccount.com",
        |  "client_id": "111032448903620990514",
        |  "auth_uri": "https://accounts.google.com/o/oauth2/auth",
        |  "token_uri": "https://oauth2.googleapis.com/token",
        |  "auth_provider_x509_cert_url": "https://www.googleapis.com/oauth2/v1/certs",
        |  "client_x509_cert_url": "https://www.googleapis.com/robot/v1/metadata/x509/starting-account-c5s0nsi4oa7f%40ga4-project-1662716211975.iam.gserviceaccount.com"
        |}
        |""".stripMargin)
      ),
      connection = connection
    )
    var finalJobProgress: JobProgress = null
    val worker = runnableJobFactory.create(
      syncInfo,
      (jobProgress: JobProgress) => {
        println(s"Job progress ${jobProgress}")
        finalJobProgress = jobProgress
        Future.Unit
      }
    )
    worker.run()
    assert(finalJobProgress.jobStatus == JobStatus.Error)
    assert(finalJobProgress.message.isDefined)
    println(s"job failure cause ${finalJobProgress.message.get}")
  }

  test("run ga4 job success") {
    val syncInfo = SyncInfo(11, ga4Job, Some(googleSource), connection = connection)
    var finalJobProgress: JobProgress = null
    val worker = runnableJobFactory.create(
      syncInfo,
      (jobProgress: JobProgress) => {
        println(s"Job progress ${jobProgress}")
        finalJobProgress = jobProgress
        Future.Unit
      }
    )
    worker.run()
    assert(finalJobProgress.jobStatus == JobStatus.Synced)
    assert(finalJobProgress.message.isDefined)
    assert(finalJobProgress.totalExecutionTime > 0)
    assert(finalJobProgress.totalSyncRecord > 0)
    println(s"job success ${finalJobProgress}")
  }

  test("run ga4 job and terminated") {
    val syncInfo = SyncInfo(12, ga4Job, Some(googleSource), connection = connection)
    var finalJobProgress: JobProgress = null
    val worker = runnableJobFactory.create(
      syncInfo,
      (jobProgress: JobProgress) => {
        println(s"Job progress ${jobProgress}")
        finalJobProgress = jobProgress
        Future.Unit
      }
    )
    ssdbKVS.remove(syncInfo.syncId).asTwitter.syncGet()
    worker.run()
    assert(finalJobProgress.jobStatus == JobStatus.Terminated)
    assert(finalJobProgress.message.isDefined)
    assert(finalJobProgress.totalExecutionTime >= 0)
    assert(finalJobProgress.totalSyncRecord == 0)
    println(s"job run terminated ${finalJobProgress}")
  }

}
