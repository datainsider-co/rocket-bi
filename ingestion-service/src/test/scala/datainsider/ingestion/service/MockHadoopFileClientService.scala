package datainsider.ingestion.service

import com.twitter.util.Future
import datainsider.client.service.HadoopFileClientService

class MockHadoopFileClientService extends HadoopFileClientService {
  override def move(srcPath: String, destPath: String, overwrite: Boolean, newName: String): Future[Boolean] = Future.True

  override def moveTrash(path: String): Future[Boolean] = Future.True

  override def deleteForever(path: String): Future[Boolean] = Future.True

  override def createFolder(srcPath: String, name: String): Future[Boolean] = Future.True

  override def isExistPath(path: String): Future[Boolean] = Future.True
}
