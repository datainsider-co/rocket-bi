package co.datainsider.jobworker.client.mixpanel

case class USMixpanelClient(
    accountUsername: String,
    accountSecret: String
) extends AbstractMixpanelClient(accountUsername, accountSecret) {
  override protected def getApiUrl(): String = "https://mixpanel.com/"

  override protected def getExportUrl(): String = "https://data.mixpanel.com/"
}
