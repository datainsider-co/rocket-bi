package co.datainsider.jobworker.client.mixpanel

case class EUMixpanelClient(
    accountUsername: String,
    accountSecret: String
) extends AbstractMixpanelClient(accountUsername, accountSecret) {
  override protected def getApiUrl(): String = "https://mixpanel.eu/"

  override protected def getExportUrl(): String = "https://data.mixpanel.eu/"
}
