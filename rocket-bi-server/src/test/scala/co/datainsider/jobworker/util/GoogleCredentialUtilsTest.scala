package co.datainsider.jobworker.util

import co.datainsider.bi.util
import co.datainsider.jobworker.domain.response.TokenResponse
import com.google.api.client.auth.oauth2.TokenResponseException
import com.twitter.inject.Test

/**
 * created 2023-03-03 10:25 AM
 *
 * @author tvc12 - Thien Vi
 */
class GoogleCredentialUtilsTest extends Test {
  val googleOAuthConfig = GoogleOAuthConfig(
    clientId = util.ZConfig.getString("google.gg_client_id"),
    clientSecret = util.ZConfig.getString("google.gg_client_secret"),
    redirectUri = util.ZConfig.getString("google.redirect_uri"),
    serverEncodedUrl = util.ZConfig.getString("google.server_encoded_url")
  )
  test("test get google credential with wrong token") {
    val credential = GoogleCredentialUtils.buildCredentialFromToken("access_token", "refresh_token", googleOAuthConfig)
    println("credential: " + credential)
    assert(credential.getAccessToken == "access_token")
    assert(credential.getRefreshToken == "refresh_token")
    assertThrows[TokenResponseException](!credential.refreshToken())
  }
//  test("test get google credential with correct token") {
//    val refreshToken = "1//04hWHWmaAMd5gCgYIARAAGAQSNwF-L9Ire884DBM8iFYGtspj-106LPx3xsXf-m-TAgejc23aQ26EPK3EZWclNomh9D6hhlWE8Yo"
//    val accessToken = "ya29.a0AVvZVsqS46UAd2eb4MhZvBUWsF_UA2uM9eNyXWNFOXn2M5YyJ3E3ppfINq7zTVQbPS8VtilsZjb0JQFf7yWxWk9KQAkRliJbfxnrOzx9utinSyzzkVAQHEYnc3wJlOzFILw_BFERlAz-R6IMYL1BNsSKBL5gaCgYKAekSARESFQGbdwaI4vUL6zPEfhadlXWewtL_3w0163"
//    val credential = GoogleCredentialUtils.buildCredentialFromToken(accessToken, refreshToken, googleOAuthConfig)
//    println("credential: " + credential)
//    assert(credential.getAccessToken == accessToken)
//    assert(credential.getRefreshToken == refreshToken)
//    assert(credential.refreshToken())
//  }
//
//  test("refresh token with expired access token") {
//    val accessToken = "ya29.a0AVvZVsrs6-hPppLhQOhcLA6Gn8BuuuiWo0axx4LoZSE-Kwqptb33mTjs4G-R4j-AVvxWwb3vMDjUG-BOZ-hy_hdxyOssBDN4R3Iz9DsorRPwpfFeYjEB-O2P4I77J2gVB-ewhKgpa2Ju4u4KfixWmkbsGpX330UaCgYKAbESARESFQGbdwaI150vZ1VMaT0rvk7GygU6hg0166"
//    val refreshToken = "1//0eTyFMIjtLW_hCgYIARAAGA4SNwF-L9IrJWB4oc1AxpMKwPQq6LueXJTyKdso47QBsesxp7nmCncFkHM7Na2RblobFnrhENdCY-g"
//    val tokenResponse: TokenResponse = GoogleCredentialUtils.refreshToken(accessToken, refreshToken, googleOAuthConfig)
//    println("new access token: " + tokenResponse)
//    assert(tokenResponse.accessToken != accessToken)
//    assert(tokenResponse.refreshToken == refreshToken)
//  }
}
