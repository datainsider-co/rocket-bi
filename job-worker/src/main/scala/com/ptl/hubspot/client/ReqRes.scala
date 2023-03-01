package com.ptl.hubspot.client

import com.fasterxml.jackson.databind.annotation.JsonNaming

/**
 * Created by phuonglam on 2/16/17.
 **/
case class Response[A](
  code: Int = 200,
  error: Option[Error] = None,
  data: Option[A] = None
) {
  def isConflict: Boolean = code == 409

  def isUnauthorized: Boolean = code == 401

  def isSuccess: Boolean = is2xx

  def is2xx: Boolean = isCodeInRange(200, 299)

  def isRedirect: Boolean = is3xx

  def is3xx: Boolean = isCodeInRange(300, 399)

  def isClientError: Boolean = is4xx

  def isServerError: Boolean = is5xx

  def isNotError: Boolean = !isError

  def isError: Boolean = is4xx || is5xx

  def is4xx: Boolean = isCodeInRange(400, 499)

  def is5xx: Boolean = isCodeInRange(500, 599)

  def isCodeInRange(lower: Int, upper: Int): Boolean = lower <= code && code <= upper

  def isExceededLimit: Boolean = code == 429

  def isNotFound: Boolean = code == 404
}

case class NobodyResponse()

@JsonNaming
case class Error(
  status: String,
  message: String,
  correlationId: String,
  requestId: String,
  validationResults: Seq[ValidationResult] = Seq[ValidationResult](),
  error: String = "UNKNOWN_ERROR",
  vid: Long = 0L
)

@JsonNaming
case class ValidationResult(
  isValid: Boolean,
  message: String,
  error: String,
  name: String
)

case class FileCreateResponse(
  objects: Seq[File]
)

case class File(
  id: Long,
  url: String,
  portalId: String,
  title: String,
  created: Long,
  updated: Long,
  deleted_at: Long,
  folderId: Option[String] = None
)

case class MultiPartData(name: String, filename: String, mime: String, data: Any)

case class UploadFileRequest(
  overwrite: Boolean = true,
  mimeType: String,
  files: Array[Byte],
  fileNames: Option[String] = None,
  folderPaths: Option[String] = None,
  folderId: Option[Long] = None
)

case class SearchRange[A](
  gt: Option[A] = None,
  gte: Option[A] = None,
  lt: Option[A] = None,
  lte: Option[A] = None
)

case class ParamBuilder() {
  private var _params = Seq[(String, String)]()

  private def _add(key: String, value: String): ParamBuilder = {
    _params = _params :+ (key, value)
    this
  }

  def add(key: String, value: String): ParamBuilder = _add(key, value)

  def add(key: String, value: AnyVal): ParamBuilder = _add(key, value.toString)


  def add[B](key: String, value: Option[B]): ParamBuilder = {
    value match {
      case Some(s) => _params = _params :+ (key, s.toString)
      case _ => ;
    }
    this
  }

  def add(map: Map[String, String]): ParamBuilder = {
    _params = _params ++ map.toSeq
    this
  }

  def add[B](key: String, values: Seq[B]): ParamBuilder = {
    _params = _params ++ values.map(f => (key, f.toString))
    this
  }

  def add[B](key: String, values: SearchRange[B]): ParamBuilder = {
    if (values.gt.isDefined) _add(s"${key}__gt", values.gt.get.toString)
    if (values.gte.isDefined) _add(s"${key}__gte", values.gte.get.toString)
    if (values.lt.isDefined) _add(s"${key}__lt", values.lt.get.toString)
    if (values.lte.isDefined) _add(s"${key}__lte", values.lte.get.toString)
    this
  }

  def build(): Seq[(String, String)] = _params
}