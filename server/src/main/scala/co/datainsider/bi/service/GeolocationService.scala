package co.datainsider.bi.service

import co.datainsider.bi.domain.{GeoArea, Geolocation}
import co.datainsider.bi.domain.Ids.Geocode
import co.datainsider.bi.repository.GeolocationRepository
import com.fasterxml.jackson.databind.JsonNode
import com.google.inject.Inject
import com.twitter.util.Future
import co.datainsider.common.client.exception.BadRequestError
import co.datainsider.common.client.util.JsonParser

trait GeolocationService {
  def get(code: Geocode): Future[Option[Geolocation]]

  def insert(geolocation: Geolocation): Future[Boolean]

  def listSupportedAreas(): Future[Seq[GeoArea]]

  def list(geoArea: GeoArea): Future[Seq[Geolocation]]

  def parseGeoArea(json: String): Future[GeoArea]

  def parseGeolocation(json: String): Future[Seq[Geolocation]]

}

class GeolocationServiceImpl @Inject() (geolocationRepository: GeolocationRepository) extends GeolocationService {

  override def insert(location: Geolocation): Future[Boolean] = geolocationRepository.create(location)

  override def get(code: Geocode): Future[Option[Geolocation]] = geolocationRepository.get(code)

  override def list(geoArea: GeoArea): Future[Seq[Geolocation]] = {
    // list children location of this geoArea => childZoneLvl = geoArea.zoneLvl + 1
    geolocationRepository.list(geoArea.codePrefix, geoArea.zoneLvl + 1)
  }

  override def listSupportedAreas(): Future[Seq[GeoArea]] = {
    geolocationRepository.listAreas()
  }

  override def parseGeoArea(json: String): Future[GeoArea] =
    Future {
      val jsonNode = JsonParser.fromJson[JsonNode](json)
      geolocationRepository.parseGeoArea(jsonNode, null)
    }

  override def parseGeolocation(json: String): Future[Seq[Geolocation]] =
    Future {
      try {
        val jsonNode = JsonParser.fromJson[JsonNode](json)
        require(jsonNode.has("features"), "missing 'features' field")
        geolocationRepository.parseGeolocation(jsonNode.get("features"))
      } catch {
        case e: Throwable => throw BadRequestError(s"parse geolocation failed with exception: $e")
      }
    }
}
