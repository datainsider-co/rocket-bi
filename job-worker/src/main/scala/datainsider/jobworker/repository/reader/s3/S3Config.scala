package datainsider.jobworker.repository.reader.s3

case class S3Config(bucketName: String, folderPath: String, incrementalSyncTime: Long)
