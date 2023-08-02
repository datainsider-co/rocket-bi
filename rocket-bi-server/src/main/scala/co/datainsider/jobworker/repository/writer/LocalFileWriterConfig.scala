package co.datainsider.jobworker.repository.writer;
case class LocalFileWriterConfig(
    baseDir: String,
    fileExtension: String,
    maxFileSizeInBytes: Long
)
