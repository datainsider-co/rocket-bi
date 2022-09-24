package datainsider.user_profile.controller.http.filter.common

import com.twitter.finagle.http.filter.Cors._

/**
 * @author anhlt
 */

class CORSFilter
  extends HttpFilter(
    Policy(
      allowsOrigin = { origin => Some(origin) },
      allowsMethods = { method => Some(Seq("GET", "POST", "PUT", "DELETE", "OPTIONS", "HEAD")) },
      allowsHeaders = { headers =>
        Some(Seq("origin", "content-type", "accept", "authorization", "X-Requested-With", "X-Codingpedia", "cookie"))
      },
      supportsCredentials = true
    )
  ) {}
