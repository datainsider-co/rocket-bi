package datainsider.jobworker.domain

case class TLSConfiguration(
    certificateKeyFileData: String,
    certificateKeyFilePassword: String,
    caFileData: String
)
