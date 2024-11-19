package co.datainsider.bi.domain

import co.datainsider.bi.domain.GeoZoneLevel.GeoZoneLevel
import co.datainsider.bi.domain.Ids.Geocode
import org.apache.commons.text.similarity.{
  FuzzyScore,
  JaccardSimilarity,
  JaroWinklerSimilarity,
  LongestCommonSubsequence
}

import java.util.Locale

/* Geocode is encoded by code of parent location to children location
 * E.g: Quan Go Vap -> VN-HCM-GV
 *      In this case zoneLvl is 2 (VN: lvl0, HCM: lvl1, GV: lvl2)
 * * NOTE: Geocode of a zone has to have SAME length
 * Geocode is fixed length string, depend on zone lvl of that location
 * Zone lvl 0 -> <2char>       (length = 2)   (country)
 * Zone lvl 1 -> <2char>-<2char>   (length = 5)  (provinces/areas of country)
 * Zone lvl 2 -> <2char>-<2char>-<3chart>   (length = 9)   (cities of province)
 * */
case class Geolocation(
    code: Geocode,
    name: String,
    normalizedName: String,
    geoType: String,
    latitude: Double,
    longitude: Double,
    properties: String
)

case class GeoArea(
    name: String,
    displayName: String,
    codePrefix: String,
    zoneLvl: GeoZoneLevel,
    mapUrl: String
)

object GeoZoneLevel extends Enumeration {
  type GeoZoneLevel = Int
  val Country: GeoZoneLevel = 0
  val Province: GeoZoneLevel = 1
  val City: GeoZoneLevel = 2
  val Ward: GeoZoneLevel = 3

  def toCodeLength(zone: GeoZoneLevel): Int = {
    zone match {
      case Country  => 2
      case Province => 5
      case City     => 9
      case Ward     => 11
    }
  }
}
