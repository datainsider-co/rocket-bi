package datainsider.schema.controller.http.filter

import com.google.inject.Singleton
import com.twitter.finagle.http.filter.Cors.{HttpFilter, Policy}

/**
  * @author anhlt
  */

@Singleton
class CORSFilter
    extends HttpFilter(
      Policy(
        allowsOrigin = { _ => Some("*") },
        allowsMethods = { _ => Some(Seq("GET", "POST", "PUT", "DELETE", "OPTIONS", "HEAD")) },
        allowsHeaders = { _ =>
          {
            Some(
              Seq(
                "origin",
                "content-type",
                "accept",
                "authorization",
                "X-Requested-With",
                "X-Codingpedia",
                "cookie",
                "DI-SERVICE-KEY",
                "Token-Id"
              )
            )
          }
        },
        supportsCredentials = true
      )
    ) {}
