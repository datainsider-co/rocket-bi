package datainsider.lakescheduler.domain

import com.fasterxml.jackson.annotation.JsonSubTypes.Type
import com.fasterxml.jackson.annotation.{JsonSubTypes, JsonTypeInfo}

@JsonTypeInfo(
  use = JsonTypeInfo.Id.NAME,
  include = JsonTypeInfo.As.PROPERTY,
  property = "class_name"
)
@JsonSubTypes(
  Array(
    new Type(value = classOf[HttpCloneInfo], name = "http_clone_info"),
    new Type(value = classOf[SshCloneInfo], name = "ssh_clone_info")
  )
)
abstract class GitCloneInfo

case class HttpCloneInfo(url: String, username: String, password: String) extends GitCloneInfo

case class SshCloneInfo(url: String, privateKey: String) extends GitCloneInfo
