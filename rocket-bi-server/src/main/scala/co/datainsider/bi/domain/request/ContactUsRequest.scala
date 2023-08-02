package co.datainsider.bi.domain.request

case class ContactUsRequest(
    firstName: String,
    lastName: String,
    phone: String,
    email: String,
    companyName: Option[String] = None,
    message: Option[String] = None
)
