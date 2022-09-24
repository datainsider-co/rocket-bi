package co.datainsider.bi.repository

import co.datainsider.bi.client.JdbcClient
import co.datainsider.bi.domain.GeoZoneLevel.GeoZoneLevel
import co.datainsider.bi.domain.{GeoArea, GeoZoneLevel, Geolocation}
import co.datainsider.bi.domain.Ids.Geocode
import com.google.inject.Inject
import com.google.inject.name.Named
import com.twitter.util.Future

import java.sql.ResultSet
import scala.collection.mutable.ArrayBuffer

trait GeolocationRepository {
  def get(code: Geocode): Future[Option[Geolocation]]

  def list(codePrefix: Geocode, zoneLvl: GeoZoneLevel): Future[Array[Geolocation]]

  def create(geolocation: Geolocation): Future[Boolean]

}

class MySqlGeolocationRepository @Inject() (@Named("mysql") client: JdbcClient, dbName: String, tblName: String)
    extends GeolocationRepository {

  override def get(code: Geocode): Future[Option[Geolocation]] =
    Future {
      val query =
        s"""
         |select * from $dbName.$tblName
         |where code = ?;
         |""".stripMargin
      client.executeQuery(query, code)(rs => if (rs.next()) Some(toGeolocation(rs)) else None)
    }

  override def list(codePrefix: Geocode, zoneLvl: GeoZoneLevel): Future[Array[Geolocation]] =
    Future {
      val prefixCondition = s"lower(substring(code,1,${codePrefix.length})) = lower('$codePrefix')"
      val lengthCondition = s"length(code) = ${GeoZoneLevel.toCodeLength(zoneLvl)}"
      val query =
        s"""
         |select * from $dbName.$tblName
         |where $lengthCondition && $prefixCondition;
         |""".stripMargin

      client.executeQuery(query)(toGeolocations)
    }

  override def create(geolocation: Geolocation): Future[Boolean] =
    Future {
      val query =
        s"""
         |insert into $dbName.$tblName
         |(code, name, normalized_name, type, longitude, latitude, properties)
         |values(?, ?, ?, ?, ?, ?, ?);
         |""".stripMargin
      client.executeUpdate(
        query,
        geolocation.code,
        geolocation.name,
        geolocation.normalizedName,
        geolocation.geoType,
        geolocation.latitude,
        geolocation.longitude,
        geolocation.properties
      ) > 0
    }

  private def toGeolocation(rs: ResultSet): Geolocation = {
    val code = rs.getString("code")
    val name = rs.getString("name")
    val normalizedName = rs.getString("normalized_name")
    val geoType = rs.getString("type")
    val lat = rs.getDouble("latitude")
    val lng = rs.getDouble("longitude")
    val props = rs.getString("properties")
    Geolocation(code, name, normalizedName, geoType, lat, lng, props)
  }

  private def toGeolocations(rs: ResultSet): Array[Geolocation] = {
    val locations = ArrayBuffer.empty[Geolocation]
    while (rs.next()) locations += toGeolocation(rs)
    locations.toArray
  }

}
