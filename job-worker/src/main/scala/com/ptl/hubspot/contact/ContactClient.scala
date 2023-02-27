package com.ptl.hubspot.contact

import com.ptl.hubspot.client.{HubspotClient, NobodyResponse, ParamBuilder, Response}
import com.ptl.util.JsonUtil._
import com.ptl.util.ReflectionUtil

/**
 * Created by phuonglam on 2/16/17.
 **/
trait ContactClient extends HubspotClient {
  private val contactBaseUrl = s"$apiUrl/contacts/v1"

  def createContact(properties: Seq[ContactProperties]): Response[Contact] = _createContact(properties)

  protected def _createContact(properties: Seq[ContactProperties]): Response[Contact] = http.POST[Contact](
    s"$contactBaseUrl/contact/",
    Map("properties" -> properties).toJsonString
  )

  def createContact[T: Manifest](t: T): Response[Contact] = _createContact(parseToProperties[T](t))

  def updateContactByVid(vid: Long, properties: Seq[ContactProperties]): Response[NobodyResponse] = _updateContactByVid(vid, properties)

  def updateContactByVid[T: Manifest](vid: Long, t: T): Response[NobodyResponse] = _updateContactByVid(vid, parseToProperties[T](t))

  protected def _updateContactByVid(vid: Long, properties: Seq[ContactProperties]): Response[NobodyResponse] = http.POST[NobodyResponse](
    s"$contactBaseUrl/contact/vid/$vid/profile",
    Map("properties" -> properties).toJsonString
  )

  def mUpdateContactByVid(contacts: Map[Long, Seq[ContactProperties]]): Response[NobodyResponse] = {
    http.POST[NobodyResponse](
      s"$contactBaseUrl/contact/batch",
      contacts.map(f => Map("vid" -> f._1, "properties" -> f._2)).toJsonString
    )
  }

  def updateContactByEmail(email: String, properties: Seq[ContactProperties]): Response[NobodyResponse] = _updateContactByEmail(email, properties)

  protected def _updateContactByEmail(email: String, properties: Seq[ContactProperties]): Response[NobodyResponse] = http.POST[NobodyResponse](
    s"$contactBaseUrl/contact/email/$email/profile",
    Map("properties" -> properties).toJsonString
  )

  def updateContactByEmail[T: Manifest](email: String, t: T): Response[NobodyResponse] = _updateContactByEmail(email, parseToProperties[T](t))

  protected def parseToProperties[T: Manifest](t: T): Seq[ContactProperties] = ReflectionUtil.extractProperty[T](t)
    .filter(f => {
      !f._1.equals("vid") &&
        (f._2 match {
          case o: Option[Nothing] => o.isDefined
          case _ => true
        })
    })
    .map(f => ContactProperties(property = f._1, value = f._2 match {
      case Some(x) => x.toString
      case _ => f._2.toString
    }))

  def createOrUpdateContact(email: String, properties: Seq[ContactProperties]): Response[ContactCreateOrUpdateResponse] = _createOrUpdateContact(email, properties)

  def createOrUpdateContact[T: Manifest](email: String, t: T): Response[ContactCreateOrUpdateResponse] = _createOrUpdateContact(email, parseToProperties[T](t))

  protected def _createOrUpdateContact(email: String, properties: Seq[ContactProperties]): Response[ContactCreateOrUpdateResponse] = http.POST[ContactCreateOrUpdateResponse](
    s"$contactBaseUrl/contact/createOrUpdate/email/$email/",
    Map("properties" -> properties).toJsonString
  )

  def createOrUpdateGroupContact(request: Seq[ContactCreateOrUpdateRequest]): Response[NobodyResponse] = http.POST[NobodyResponse](
    s"$contactBaseUrl/contact/batch/",
    request.toJsonString
  )

  def deleteContact(vid: Long): Response[ContactDeleteResponse] = http.DELETE[ContactDeleteResponse](s"$contactBaseUrl/contact/vid/$vid")

  def getAllContact(
    count: Int = 10,
    vidOffset: Option[Long] = None,
    property: Seq[String] = Seq[String](),
    propertyMode: ContactGetPropertyMode = ContactGetPropertyMode.default,
    formSubmissionMode: ContactFormSubmissionMode = ContactFormSubmissionMode.default,
    showListMemberships: Option[Boolean] = None
  ): Response[ContactGetResponse] = _get[ContactGetResponse](
    s"$contactBaseUrl/lists/all/contacts/all?count=$count",
    vidOffset,
    property,
    propertyMode,
    formSubmissionMode,
    showListMemberships
  )

  def getRecentUpdateContact(
    count: Option[Long] = None,
    vidOffset: Option[Long] = None,
    timeOffset: Option[Long] = None,
    property: Seq[String] = Seq[String](),
    propertyMode: ContactGetPropertyMode = ContactGetPropertyMode.default,
    formSubmissionMode: ContactFormSubmissionMode = ContactFormSubmissionMode.default,
    showListMemberships: Option[Boolean] = None
  ): Response[ContactGetResponse] = {
    http.GET[ContactGetResponse](s"$contactBaseUrl/lists/recently_updated/contacts/recent",
      ParamBuilder()
        .add("count", count)
        .add("vidOffset", vidOffset)
        .add("property", property)
        .add("timeOffset", timeOffset)
        .add("propertyMode", propertyMode.data)
        .add("showListMemberships", showListMemberships).build()
    )
  }

  def getRecentContact(
    count: Int = 10,
    vidOffset: Option[Long] = None,
    property: Seq[String] = Seq[String](),
    propertyMode: ContactGetPropertyMode = ContactGetPropertyMode.default,
    formSubmissionMode: ContactFormSubmissionMode = ContactFormSubmissionMode.default,
    showListMemberships: Option[Boolean] = None
  ): Response[ContactGetResponse] = _get[ContactGetResponse](
    s"$contactBaseUrl/lists/recently_updated/contacts/recent?count=$count",
    vidOffset,
    property,
    propertyMode,
    formSubmissionMode,
    showListMemberships
  )

  def getContactInLists(
    listId: Long,
    count: Int = 10,
    vidOffset: Option[Long] = None,
    property: Seq[String] = Seq[String](),
    propertyMode: ContactGetPropertyMode = ContactGetPropertyMode.default,
    formSubmissionMode: ContactFormSubmissionMode = ContactFormSubmissionMode.default,
    showListMemberships: Option[Boolean] = None
  ): Response[ContactGetResponse] = _get[ContactGetResponse](
    s"$contactBaseUrl/lists/$listId/contacts/all?count=$count",
    vidOffset,
    property,
    propertyMode,
    formSubmissionMode,
    showListMemberships
  )

  def getRecentContactInLists(
    listId: Long,
    count: Int = 10,
    vidOffset: Option[Long] = None,
    property: Seq[String] = Seq[String](),
    propertyMode: ContactGetPropertyMode = ContactGetPropertyMode.default,
    formSubmissionMode: ContactFormSubmissionMode = ContactFormSubmissionMode.default,
    showListMemberships: Option[Boolean] = None
  ): Response[ContactGetResponse] = _get[ContactGetResponse](
    s"$contactBaseUrl/lists/$listId/contacts/recent?count=$count",
    vidOffset,
    property,
    propertyMode,
    formSubmissionMode,
    showListMemberships
  )

  def getContactByVid(
    vid: Long,
    property: Seq[String] = Seq[String](),
    propertyMode: ContactGetPropertyMode = ContactGetPropertyMode.default,
    formSubmissionMode: ContactFormSubmissionMode = ContactFormSubmissionMode.default,
    showListMemberships: Option[Boolean] = None
  ): Response[Contact] = {
    http.GET[Contact](
      path = s"$contactBaseUrl/contact/vid/$vid/profile",
      params = ParamBuilder()
        .add("property", property)
        .add("propertyMode", propertyMode.data)
        .add("formSubmissionMode", formSubmissionMode.data)
        .add("showListMemberships", showListMemberships)
        .build()
    )
  }

  def mgetContactByVid(
    vids: Seq[Long],
    property: Seq[String] = Seq[String](),
    propertyMode: ContactGetPropertyMode = ContactGetPropertyMode.default,
    formSubmissionMode: ContactFormSubmissionMode = ContactFormSubmissionMode.default,
    showListMemberships: Option[Boolean] = None,
    includeDeletes: Option[Boolean] = None
  ): Response[Map[String, Contact]] = _get[Map[String, Contact]](s"$contactBaseUrl/contact/vids/batch/?${
    s"vid=${vids.mkString("&vid=")}${
      includeDeletes match {
        case Some(s) => s"&includeDeletes=$s"
        case _ => ""
      }
    }"
  }", None, property, propertyMode, formSubmissionMode, showListMemberships)

  def getContactByEmail(
    email: String,
    property: Seq[String] = Seq[String](),
    propertyMode: ContactGetPropertyMode = ContactGetPropertyMode.default,
    formSubmissionMode: ContactFormSubmissionMode = ContactFormSubmissionMode.default,
    showListMemberships: Option[Boolean] = None
  ): Response[Contact] = http.GET[Contact](
    path = s"$contactBaseUrl/contact/email/$email/profile",
    params = ParamBuilder()
      .add("property", property)
      .add("propertyMode", propertyMode.data)
      .add("formSubmissionMode", formSubmissionMode.data)
      .add("showListMemberships", showListMemberships)
      .build()
  )

  def mgetContactByEmail(
    emails: Seq[String],
    property: Seq[String] = Seq[String](),
    propertyMode: ContactGetPropertyMode = ContactGetPropertyMode.default,
    formSubmissionMode: ContactFormSubmissionMode = ContactFormSubmissionMode.default,
    showListMemberships: Option[Boolean] = None,
    includeDeletes: Option[Boolean] = None
  ): Response[Map[String, ContactClient]] = _get[Map[String, ContactClient]](s"$contactBaseUrl/contact/vids/batch/?${
    s"email=${emails.mkString("&email=")}${
      includeDeletes match {
        case Some(s) => s"&includeDeletes=$s"
        case _ => ""
      }
    }"
  }", None, property, propertyMode, formSubmissionMode, showListMemberships)

  protected def _get[A: Manifest](
    getUrl: String,
    vidOffset: Option[Long] = None,
    property: Seq[String] = Seq[String](),
    propertyMode: ContactGetPropertyMode = ContactGetPropertyMode.default,
    formSubmissionMode: ContactFormSubmissionMode = ContactFormSubmissionMode.default,
    showListMemberships: Option[Boolean] = None
  ): Response[A] = {
    var params = property.map(f => ("property", f))
    vidOffset match {
      case Some(n) => params = params :+ ("vidOffset", n.toString)
      case _ => ;
    }
    propertyMode.data match {
      case Some(s) => params = params :+ ("propertyMode", s)
      case _ => ;
    }
    showListMemberships match {
      case Some(s) => params = params :+ ("showListMemberships", s.toString)
      case _ => ;
    }
    http.GET[A](getUrl, params)
  }

  def searchContact(query: String, count: Int = 10, offset: Option[Int] = None, property: Seq[String] = Seq[String]()): Response[ContactSearchResponse] = {
    var params = Map[String, String](
      "q" -> query.toLowerCase(),
      "count" -> count.toString
    ) ++ property.map(f => "property" -> f)
    offset match {
      case Some(s) => params = params + ("offset" -> s.toString)
      case _ => ;
    }
    http.GET[ContactSearchResponse](s"$contactBaseUrl/search/query", params.toSeq)
  }

  def addContactToList(listId: Long, vids: Seq[Long] = Seq(), emails: Seq[String] = Seq()): Response[ContactsInListResponse] = http.POST[ContactsInListResponse](
    s"$contactBaseUrl/lists/$listId/add", Map(
      "vids" -> vids,
      "emails" -> emails
    ).toJsonString
  )

  def removeContactFromList(listId: Long, vids: Seq[Long] = Seq(), emails: Seq[String] = Seq()): Response[ContactsInListResponse] = http.POST[ContactsInListResponse](
    s"$contactBaseUrl/lists/$listId/remove", Map(
      "vids" -> vids,
      "emails" -> emails
    ).toJsonString
  )
}
