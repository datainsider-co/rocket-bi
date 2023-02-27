package io.chaininsider.domain

import javax.annotation.Nullable

case class ClusterNode(pubkey: String,
                       gossip: Option[String],
                       tpu: Option[String],
                       rpc: Option[String],
                       version: Option[String],
                       featureSet: Option[String],
                       shredVersion: Option[Long])
