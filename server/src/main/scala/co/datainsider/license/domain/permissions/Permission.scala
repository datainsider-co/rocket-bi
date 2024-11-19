package co.datainsider.license.domain.permissions

import com.fasterxml.jackson.annotation.JsonSubTypes.Type
import com.fasterxml.jackson.annotation.{JsonSubTypes, JsonTypeInfo}
import co.datainsider.license.domain.RangeValue

@JsonTypeInfo(
  use = JsonTypeInfo.Id.NAME,
  include = JsonTypeInfo.As.PROPERTY,
  property = "key"
)
@JsonSubTypes(
  Array(
    new Type(value = classOf[CdpPermission], name = PermissionKeys.Cdp),
    new Type(value = classOf[LakePermission], name = PermissionKeys.Lake),
    new Type(value = classOf[NumUsersPermission], name = PermissionKeys.NumUsers),
    new Type(value = classOf[DataCookPermission], name = PermissionKeys.DataCook),
    new Type(value = classOf[IngestionPermission], name = PermissionKeys.Ingestion),
    new Type(value = classOf[StreamingPermission], name = PermissionKeys.Streaming),
    new Type(value = classOf[UserActivityPermission], name = PermissionKeys.UserActivity),
    new Type(value = classOf[BillingPermission], name = PermissionKeys.Billing),
    new Type(value = classOf[ClickhouseConfigPermission], name = PermissionKeys.ClickhouseConfig),
    new Type(value = classOf[UserManagementPermission], name = PermissionKeys.UserManagement),
    new Type(value = classOf[ApiKeyPermission], name = PermissionKeys.ApiKey),
    new Type(value = classOf[TableRelationshipPermission], name = PermissionKeys.TableRelationship),
    new Type(value = classOf[GoogleOAuthPermission], name = PermissionKeys.GoogleOAuth),
    new Type(value = classOf[LogoAndCompanyNamePermission], name = PermissionKeys.LogoAndCompanyName),
    new Type(value = classOf[PrimarySupportPermission], name = PermissionKeys.PrimarySupport),
    new Type(value = classOf[DashboardPasswordPermission], name = PermissionKeys.DashboardPassword),
    new Type(value = classOf[MySqlIngestionPermission], name = PermissionKeys.MySqlIngestion),
    new Type(value = classOf[MongoIngestionPermission], name = PermissionKeys.MongoIngestion),
    new Type(value = classOf[GenericJdbcIngestionPermission], name = PermissionKeys.GenericJdbcIngestion),
    new Type(value = classOf[OracleIngestionPermission], name = PermissionKeys.OracleIngestion),
    new Type(value = classOf[MsSqlIngestionPermission], name = PermissionKeys.MsSqlIngestion),
    new Type(value = classOf[RedshiftIngestionPermission], name = PermissionKeys.RedshiftIngestion),
    new Type(value = classOf[BigQueryIngestionPermission], name = PermissionKeys.BigQueryIngestion),
    new Type(value = classOf[PostgreIngestionPermission], name = PermissionKeys.PostgreIngestion),
    new Type(value = classOf[GA3IngestionPermission], name = PermissionKeys.GA3Ingestion),
    new Type(value = classOf[GA4IngestionPermission], name = PermissionKeys.GA4Ingestion),
    new Type(value = classOf[GoogleAdsIngestionPermission], name = PermissionKeys.GoogleAdsIngestion),
    new Type(value = classOf[GoogleSheetIngestionPermission], name = PermissionKeys.GoogleSheetIngestion),
    new Type(value = classOf[ShopifyIngestionPermission], name = PermissionKeys.ShopifyIngestion),
    new Type(value = classOf[S3IngestionPermission], name = PermissionKeys.S3Ingestion),
    new Type(value = classOf[NumEditorsPermission], name = PermissionKeys.NumEditors),
    new Type(value = classOf[NumViewersPermission], name = PermissionKeys.NumViewers),
    new Type(value = classOf[SaasPermission], name = PermissionKeys.Saas)
  )
)
abstract class Permission {
  val key: String
  val validTimeRange: RangeValue[Long]

  def verify(usage: Usage): Boolean = {
    if (validTimeRange.isInRange(System.currentTimeMillis())) {
      isPermitted(usage)
    } else false
  }

  def isPermitted(usage: Usage): Boolean

  def customCopy(validTimeRange: RangeValue[Long]): Permission
}

case class CdpPermission(isActive: Boolean, validTimeRange: RangeValue[Long]) extends Permission {
  val key: String = PermissionKeys.Cdp

  override def isPermitted(usage: Usage): Boolean = {
    usage match {
      case _: CdpUsage => isActive
      case _           => false
    }
  }

  override def customCopy(validTimeRange: RangeValue[Long]): Permission = {
    this.copy(validTimeRange = validTimeRange)
  }
}

case class LakePermission(isActive: Boolean, validTimeRange: RangeValue[Long]) extends Permission {
  val key: String = PermissionKeys.Lake

  override def isPermitted(usage: Usage): Boolean = {
    usage match {
      case _: LakeUsage => isActive
      case _            => false
    }
  }

  override def customCopy(validTimeRange: RangeValue[Long]): Permission = {
    this.copy(validTimeRange = validTimeRange)
  }
}

case class DataCookPermission(isActive: Boolean, validTimeRange: RangeValue[Long]) extends Permission {
  val key: String = PermissionKeys.DataCook

  override def isPermitted(usage: Usage): Boolean = {
    usage match {
      case _: DataCookUsage => isActive
      case _                => false
    }
  }

  override def customCopy(validTimeRange: RangeValue[Long]): Permission = {
    this.copy(validTimeRange = validTimeRange)
  }
}

case class IngestionPermission(isActive: Boolean, validTimeRange: RangeValue[Long]) extends Permission {
  val key: String = PermissionKeys.Ingestion

  override def isPermitted(usage: Usage): Boolean = {
    usage match {
      case _: IngestionUsage => isActive
      case _                 => false
    }
  }

  override def customCopy(validTimeRange: RangeValue[Long]): Permission = {
    this.copy(validTimeRange = validTimeRange)
  }
}

case class StreamingPermission(isActive: Boolean, validTimeRange: RangeValue[Long]) extends Permission {
  val key: String = PermissionKeys.Streaming

  override def isPermitted(usage: Usage): Boolean = {
    usage match {
      case _: StreamingUsage => isActive
      case _                 => false
    }
  }

  override def customCopy(validTimeRange: RangeValue[Long]): Permission = {
    this.copy(validTimeRange = validTimeRange)
  }
}

case class UserActivityPermission(isActive: Boolean, validTimeRange: RangeValue[Long]) extends Permission {
  val key: String = PermissionKeys.UserActivity

  override def isPermitted(usage: Usage): Boolean = {
    usage match {
      case _: UserActivityUsage => isActive
      case _                    => false
    }
  }

  override def customCopy(validTimeRange: RangeValue[Long]): Permission = {
    this.copy(validTimeRange = validTimeRange)
  }
}

case class BillingPermission(isActive: Boolean, validTimeRange: RangeValue[Long]) extends Permission {
  val key: String = PermissionKeys.Billing

  override def isPermitted(usage: Usage): Boolean = {
    usage match {
      case _: BillingUsage => isActive
      case _               => false
    }
  }

  override def customCopy(validTimeRange: RangeValue[Long]): Permission = {
    this.copy(validTimeRange = validTimeRange)
  }
}

case class ClickhouseConfigPermission(isActive: Boolean, validTimeRange: RangeValue[Long]) extends Permission {
  val key: String = PermissionKeys.ClickhouseConfig

  override def isPermitted(usage: Usage): Boolean = {
    usage match {
      case _: ClickhouseConfigUsage => isActive
      case _                        => false
    }
  }

  override def customCopy(validTimeRange: RangeValue[Long]): Permission = {
    this.copy(validTimeRange = validTimeRange)
  }
}

case class UserManagementPermission(isActive: Boolean, validTimeRange: RangeValue[Long]) extends Permission {
  val key: String = PermissionKeys.UserManagement

  override def isPermitted(usage: Usage): Boolean = {
    usage match {
      case _: UserManagementUsage => isActive
      case _                      => false
    }
  }

  override def customCopy(validTimeRange: RangeValue[Long]): Permission = {
    this.copy(validTimeRange = validTimeRange)
  }
}

case class ApiKeyPermission(isActive: Boolean, validTimeRange: RangeValue[Long]) extends Permission {
  val key: String = PermissionKeys.ApiKey

  override def isPermitted(usage: Usage): Boolean = {
    usage match {
      case _: ApiKeyUsage => isActive
      case _              => false
    }
  }

  override def customCopy(validTimeRange: RangeValue[Long]): Permission = {
    this.copy(validTimeRange = validTimeRange)
  }
}

case class TableRelationshipPermission(isActive: Boolean, validTimeRange: RangeValue[Long]) extends Permission {
  val key: String = PermissionKeys.TableRelationship

  override def isPermitted(usage: Usage): Boolean = {
    usage match {
      case _: TableRelationshipUsage => isActive
      case _                         => false
    }
  }

  override def customCopy(validTimeRange: RangeValue[Long]): Permission = {
    this.copy(validTimeRange = validTimeRange)
  }
}

case class NumUsersPermission(numUsersAllowed: Int, validTimeRange: RangeValue[Long]) extends Permission {
  val key: String = PermissionKeys.NumUsers

  override def isPermitted(usage: Usage): Boolean = {
    usage match {
      case numUsersUsage: NumUsersUsage => numUsersUsage.numUsers <= numUsersAllowed
      case _                            => false
    }
  }

  override def customCopy(validTimeRange: RangeValue[Long]): Permission = {
    this.copy(validTimeRange = validTimeRange)
  }
}

case class GoogleOAuthPermission(isActive: Boolean, validTimeRange: RangeValue[Long]) extends Permission {
  val key: String = PermissionKeys.GoogleAdsIngestion

  override def isPermitted(usage: Usage): Boolean = {
    usage match {
      case _: GoogleOAuthUsage => isActive
      case _                   => false
    }
  }

  override def customCopy(validTimeRange: RangeValue[Long]): Permission = {
    this.copy(validTimeRange = validTimeRange)
  }
}

case class LogoAndCompanyNamePermission(isActive: Boolean, validTimeRange: RangeValue[Long]) extends Permission {
  val key: String = PermissionKeys.LogoAndCompanyName

  override def isPermitted(usage: Usage): Boolean = {
    usage match {
      case _: LogoAndCompanyNameUsage => isActive
      case _                          => false
    }
  }

  override def customCopy(validTimeRange: RangeValue[Long]): Permission = {
    this.copy(validTimeRange = validTimeRange)
  }
}

case class PrimarySupportPermission(isActive: Boolean, validTimeRange: RangeValue[Long]) extends Permission {
  val key: String = PermissionKeys.PrimarySupport

  override def isPermitted(usage: Usage): Boolean = {
    usage match {
      case _: PrimarySupportUsage => isActive
      case _                      => false
    }
  }

  override def customCopy(validTimeRange: RangeValue[Long]): Permission = {
    this.copy(validTimeRange = validTimeRange)
  }
}

case class DashboardPasswordPermission(isActive: Boolean, validTimeRange: RangeValue[Long]) extends Permission {
  val key: String = PermissionKeys.DashboardPassword

  override def isPermitted(usage: Usage): Boolean = {
    usage match {
      case _: DashboardPasswordUsage => isActive
      case _                         => false
    }
  }

  override def customCopy(validTimeRange: RangeValue[Long]): Permission = {
    this.copy(validTimeRange = validTimeRange)
  }
}

case class MySqlIngestionPermission(isActive: Boolean, validTimeRange: RangeValue[Long]) extends Permission {
  val key: String = PermissionKeys.MySqlIngestion

  override def isPermitted(usage: Usage): Boolean = {
    usage match {
      case _: MySqlIngestionUsage => isActive
      case _                      => false
    }
  }

  override def customCopy(validTimeRange: RangeValue[Long]): Permission = {
    this.copy(validTimeRange = validTimeRange)
  }
}

case class MongoIngestionPermission(isActive: Boolean, validTimeRange: RangeValue[Long]) extends Permission {
  val key: String = PermissionKeys.MongoIngestion

  override def isPermitted(usage: Usage): Boolean = {
    usage match {
      case _: MongoIngestionUsage => isActive
      case _                      => false
    }
  }

  override def customCopy(validTimeRange: RangeValue[Long]): Permission = {
    this.copy(validTimeRange = validTimeRange)
  }
}

case class GenericJdbcIngestionPermission(isActive: Boolean, validTimeRange: RangeValue[Long]) extends Permission {
  val key: String = PermissionKeys.GenericJdbcIngestion

  override def isPermitted(usage: Usage): Boolean = {
    usage match {
      case _: GenericJdbcIngestionUsage => isActive
      case _                            => false
    }
  }

  override def customCopy(validTimeRange: RangeValue[Long]): Permission = {
    this.copy(validTimeRange = validTimeRange)
  }
}

case class OracleIngestionPermission(isActive: Boolean, validTimeRange: RangeValue[Long]) extends Permission {
  val key: String = PermissionKeys.OracleIngestion

  override def isPermitted(usage: Usage): Boolean = {
    usage match {
      case _: OracleIngestionUsage => isActive
      case _                       => false
    }
  }

  override def customCopy(validTimeRange: RangeValue[Long]): Permission = {
    this.copy(validTimeRange = validTimeRange)
  }
}

case class MsSqlIngestionPermission(isActive: Boolean, validTimeRange: RangeValue[Long]) extends Permission {
  val key: String = PermissionKeys.MsSqlIngestion

  override def isPermitted(usage: Usage): Boolean = {
    usage match {
      case _: MsSqlIngestionUsage => isActive
      case _                      => false
    }
  }

  override def customCopy(validTimeRange: RangeValue[Long]): Permission = {
    this.copy(validTimeRange = validTimeRange)
  }
}

case class RedshiftIngestionPermission(isActive: Boolean, validTimeRange: RangeValue[Long]) extends Permission {
  val key: String = PermissionKeys.RedshiftIngestion

  override def isPermitted(usage: Usage): Boolean = {
    usage match {
      case _: RedshiftIngestionUsage => isActive
      case _                         => false
    }
  }

  override def customCopy(validTimeRange: RangeValue[Long]): Permission = {
    this.copy(validTimeRange = validTimeRange)
  }
}

case class BigQueryIngestionPermission(isActive: Boolean, validTimeRange: RangeValue[Long]) extends Permission {
  val key: String = PermissionKeys.BigQueryIngestion

  override def isPermitted(usage: Usage): Boolean = {
    usage match {
      case _: BigQueryIngestionUsage => isActive
      case _                         => false
    }
  }

  override def customCopy(validTimeRange: RangeValue[Long]): Permission = {
    this.copy(validTimeRange = validTimeRange)
  }
}

case class PostgreIngestionPermission(isActive: Boolean, validTimeRange: RangeValue[Long]) extends Permission {
  val key: String = PermissionKeys.PostgreIngestion

  override def isPermitted(usage: Usage): Boolean = {
    usage match {
      case _: PostgreIngestionUsage => isActive
      case _                        => false
    }
  }

  override def customCopy(validTimeRange: RangeValue[Long]): Permission = {
    this.copy(validTimeRange = validTimeRange)
  }
}

case class GA3IngestionPermission(isActive: Boolean, validTimeRange: RangeValue[Long]) extends Permission {
  val key: String = PermissionKeys.GA3Ingestion

  override def isPermitted(usage: Usage): Boolean = {
    usage match {
      case _: GA3IngestionUsage => isActive
      case _                    => false
    }
  }

  override def customCopy(validTimeRange: RangeValue[Long]): Permission = {
    this.copy(validTimeRange = validTimeRange)
  }
}

case class GA4IngestionPermission(isActive: Boolean, validTimeRange: RangeValue[Long]) extends Permission {
  val key: String = PermissionKeys.GA4Ingestion

  override def isPermitted(usage: Usage): Boolean = {
    usage match {
      case _: GA4IngestionUsage => isActive
      case _                    => false
    }
  }

  override def customCopy(validTimeRange: RangeValue[Long]): Permission = {
    this.copy(validTimeRange = validTimeRange)
  }
}

case class GoogleAdsIngestionPermission(isActive: Boolean, validTimeRange: RangeValue[Long]) extends Permission {
  val key: String = PermissionKeys.GoogleAdsIngestion

  override def isPermitted(usage: Usage): Boolean = {
    usage match {
      case _: GoogleAdsIngestionUsage => isActive
      case _                          => false
    }
  }

  override def customCopy(validTimeRange: RangeValue[Long]): Permission = {
    this.copy(validTimeRange = validTimeRange)
  }
}

case class GoogleSheetIngestionPermission(isActive: Boolean, validTimeRange: RangeValue[Long]) extends Permission {
  val key: String = PermissionKeys.GoogleSheetIngestion

  override def isPermitted(usage: Usage): Boolean = {
    usage match {
      case _: GoogleSheetIngestionUsage => isActive
      case _                            => false
    }
  }

  override def customCopy(validTimeRange: RangeValue[Long]): Permission = {
    this.copy(validTimeRange = validTimeRange)
  }
}

case class ShopifyIngestionPermission(isActive: Boolean, validTimeRange: RangeValue[Long]) extends Permission {
  val key: String = PermissionKeys.ShopifyIngestion

  override def isPermitted(usage: Usage): Boolean = {
    usage match {
      case _: ShopifyIngestionUsage => isActive
      case _                        => false
    }
  }

  override def customCopy(validTimeRange: RangeValue[Long]): Permission = {
    this.copy(validTimeRange = validTimeRange)
  }
}

case class S3IngestionPermission(isActive: Boolean, validTimeRange: RangeValue[Long]) extends Permission {
  val key: String = PermissionKeys.S3Ingestion

  override def isPermitted(usage: Usage): Boolean = {
    usage match {
      case _: S3IngestionUsage => isActive
      case _                   => false
    }
  }

  override def customCopy(validTimeRange: RangeValue[Long]): Permission = {
    this.copy(validTimeRange = validTimeRange)
  }
}

case class NumEditorsPermission(maxNumEditors: Int, validTimeRange: RangeValue[Long]) extends Permission {
  val key: String = PermissionKeys.NumEditors

  override def isPermitted(usage: Usage): Boolean = {
    usage match {
      case numEditorUsage: NumEditorsUsage => numEditorUsage.editorsCount <= maxNumEditors
      case _                               => false
    }
  }

  override def customCopy(validTimeRange: RangeValue[Long]): Permission = {
    this.copy(validTimeRange = validTimeRange)
  }
}

case class NumViewersPermission(maxNumViewers: Int, validTimeRange: RangeValue[Long]) extends Permission {
  val key: String = PermissionKeys.NumViewers

  override def isPermitted(usage: Usage): Boolean = {
    usage match {
      case numViewersUsage: NumViewersUsage => numViewersUsage.viewersCount <= maxNumViewers
      case _                                => false
    }
  }

  override def customCopy(validTimeRange: RangeValue[Long]): Permission = {
    this.copy(validTimeRange = validTimeRange)
  }
}

case class SaasPermission(isActive: Boolean, validTimeRange: RangeValue[Long]) extends Permission {
  val key: String = PermissionKeys.Saas

  override def isPermitted(usage: Usage): Boolean = {
    usage match {
      case _: SaasUsage => isActive
      case _            => false
    }
  }

  override def customCopy(validTimeRange: RangeValue[Long]): Permission = {
    this.copy(validTimeRange = validTimeRange)
  }
}
