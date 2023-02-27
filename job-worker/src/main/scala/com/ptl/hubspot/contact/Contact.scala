package com.ptl.hubspot.contact

import com.fasterxml.jackson.annotation.JsonProperty
import com.fasterxml.jackson.databind.PropertyNamingStrategy.LowerCaseStrategy
import com.fasterxml.jackson.databind.annotation.JsonNaming
import com.ptl.util.JsonUtil

/**
 * Created by phuonglam on 2/16/17.
 **/
@JsonNaming
case class Contact(
  vid: Long,
  @JsonProperty("canonical-vid") canonicalVid: Long,
  @JsonProperty("portal-id") portalId: Long,
  @JsonProperty("contact-id") isContact: Boolean,
  @JsonProperty("addedAt") addedAt: Long = 0L,
  @JsonProperty("profile-token") profileToken: Option[String] = None,
  @JsonProperty("profile-url") profileUrl: Option[String] = None,
  @JsonProperty("merged-vids") mergedVids: Seq[Long] = Seq[Long](),
  properties: Map[String, ContactProperties] = Map[String, ContactProperties](),
  @JsonProperty("form-submissions") formSubmissions: Seq[FormSubmission] = Seq[FormSubmission](),
  @JsonProperty("identity-profiles") identityProfiles: Seq[ContactIdentityProfile] = Seq[ContactIdentityProfile](),
  @JsonProperty("merge-audits") mergeAudits: Seq[ContactMergeAudit] = Seq[ContactMergeAudit](),
  @JsonProperty("list-memberships") listMemberships: Seq[ContactListMembership] = Seq[ContactListMembership]()
) {
  def email: Option[String] = if (properties.contains("email")) Option(properties("email").value) else None

  def extractTo[T: Manifest]: T = {
    val node = JsonUtil.createObjectNode
    node.put("vid", vid)
    properties.foreach(f => {
      node.put(f._1, f._2.value)
    })
    JsonUtil.fromJson[T](node, new LowerCaseStrategy())
  }

  def prop(field: String): Option[String] = properties.get(field).map(_.value)
}

case class FormSubmission(
  conversionId: String,
  timestamp: Long,
  formId: String,
  portalId: String,
  pageUrl: String,
  title: String
)

case class ContactListMembership(
  staticListId: String,
  internalListId: String,
  timestamp: String,
  vid: Long,
  isMember: Boolean
)

case class ContactIdentityProfile(
  vid: Long,
  savedAtTimestamp: Long,
  deletedChangedTimestamp: Long,
  identities: Seq[ContactIdentity]
)

case class ContactIdentity(
  types: String,
  value: String,
  timestamp: Long
)

case class ContactProperties(
  value: String,
  property: String = "",
  versions: Seq[Object] = Seq[Object]()
)

case class ContactMergeAudit(
  canonicalVid: Long,
  vidToMerge: Long,
  timestamp: Long,
  entityId: String,
  userId: Long,
  numPropertiesMoved: Int,
  mergeFromEmail: Object,
  mergeToEmail: Object
)

case class ContactDeleteResponse(
  vid: Long,
  deleted: Boolean,
  reason: String
)

case class ContactCreateOrUpdateResponse(
  vid: Long,
  isNew: Boolean
)

case class ContactGetResponse(
  contacts: Seq[Contact],
  @JsonProperty("has-more") hasMore: Boolean,
  @JsonProperty("vid-offset") vidOffset: Long,
  @JsonProperty("time-offset") timeOffset: Long = 0L
)

case class ContactSearchResponse(
  contacts: Seq[Contact],
  offset: Long,
  hasMore: Boolean,
  total: Long
)

@JsonNaming
case class ContactsInListResponse(
  updated: Seq[Long],
  discarded: Seq[Long],
  invalidVids: Seq[Long],
  invalidEmails: Seq[String]
)

case class GenericContact(
  vid: Option[Long] = None,
  salutation: Option[String] = None,
  email: Option[String] = None,
  phone: Option[String] = None,
  firstName: Option[String] = None,
  lastName: Option[String] = None,
  createDate: Option[Long] = None,
  hubspot_owner_id: Option[String] = None,
  job_position: Option[String] = None,
  province: Option[String] = None,
  jobTitle: Option[String] = None,
  description_note: Option[String] = None
)

case class ContactCreateRequest(
  properties: Seq[ContactProperties]
)

case class ContactCreateOrUpdateRequest(
  vid: Option[Long] = None,
  email: Option[String] = None,
  properties: Seq[ContactProperties]
)

case class ContactGetPropertyMode(data: Option[String])
object ContactGetPropertyMode {
  val default = ContactGetPropertyMode(None)
  val valueOnly = ContactGetPropertyMode(Some("value_only"))
  val valueAndHistory = ContactGetPropertyMode(Some("value_and_history"))
}

case class ContactFormSubmissionMode(data: Option[String])
object ContactFormSubmissionMode {
  val default = ContactFormSubmissionMode(None)
  val all = ContactFormSubmissionMode(Some("all"))
  val none = ContactFormSubmissionMode(Some("none"))
  val newest = ContactFormSubmissionMode(Some("newest"))
}