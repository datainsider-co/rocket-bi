package datainsider.jobscheduler.domain

case class TLSConfiguration(
    certificateKeyFileData: String,
    certificateKeyFilePassword: String,
    caFileData: String
)
