package co.datainsider.bi.domain

import com.fasterxml.jackson.annotation.JsonIgnore

/**
  * created 2023-07-27 10:40 AM
  *
  * @author tvc12 - Thien Vi
  */
case class SshKeyPair(
    orgId: Long,
    @JsonIgnore privateKey: String,
    publicKey: String,
    @JsonIgnore passphrase: String,
    createdAt: Long = System.currentTimeMillis(),
    updatedAt: Long = System.currentTimeMillis()
)
