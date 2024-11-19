package co.datainsider.bi.repository

import co.datainsider.bi.domain.GeoZoneLevel.GeoZoneLevel
import co.datainsider.bi.domain.{GeoArea, Geolocation}
import co.datainsider.bi.domain.Ids.Geocode
import co.datainsider.bi.util.{StringUtils, ZConfig}
import com.fasterxml.jackson.databind.JsonNode
import com.twitter.inject.Logging
import com.twitter.util.Future
import co.datainsider.common.client.util.JsonParser

import java.io.File
import java.nio.file.Files
import scala.collection.mutable.ArrayBuffer

class InMemGeolocationRepository(dataPath: String) extends GeolocationRepository with Logging {
  private val GEOAREAS_STORE = ArrayBuffer[GeoArea]()
  private val GEOLOCATIONS_STORE = ArrayBuffer[Geolocation]()

  override def get(code: Geocode): Future[Option[Geolocation]] = ???

  override def listAreas(): Future[Seq[GeoArea]] =
    Future {
      GEOAREAS_STORE
    }

  override def list(codePrefix: Geocode, zoneLvl: GeoZoneLevel): Future[Seq[Geolocation]] =
    Future {
      GEOLOCATIONS_STORE.filter(geolocation => isTargetGeolocation(geolocation.code, codePrefix, zoneLvl))
    }

  override def create(geolocation: Geolocation): Future[Boolean] = ???

  def initData(): Unit = {
    GEOAREAS_STORE.clear()
    GEOLOCATIONS_STORE.clear()

    loadData(dataPath)

    logger.info(
      s"finish load map data from '$dataPath' - GeoAreas: ${GEOAREAS_STORE.length} items, Geolocations: ${GEOLOCATIONS_STORE.length} items."
    )
  }

  private def loadData(path: String): Unit = {
    try {
      val folder = new File(path)

      if (folder == null || !folder.isDirectory) {
        throw new Exception("invalid data folder")
      }

      folder
        .listFiles()
        .foreach(file => {
          if (file.isDirectory) {
            loadData(file.getPath)
          } else {
            if (file.getName.endsWith(".geojson")) {
              val jsonStr = new String(Files.readAllBytes(file.toPath))
              val jsonNode = JsonParser.fromJson[JsonNode](jsonStr)
              val geoArea = parseGeoArea(jsonNode, file.getPath)
              GEOAREAS_STORE += geoArea

              val geolocations: Seq[Geolocation] = parseGeolocation(jsonNode.get("features"))
              GEOLOCATIONS_STORE ++= geolocations
            }
          }
        })
    } catch {
      case e: Throwable =>
        logger.info(s"${this.getClass.getSimpleName}::load data from file $path, message: ${e.getMessage}", e)
    }
  }

  override def parseGeoArea(json: JsonNode, filePath: String): GeoArea = {
    require(json.has("name"), "missing 'name' field")
    require(json.has("display_name"), "missing 'display_name' field")
    require(json.has("code_prefix"), "missing 'code_prefix' field")

    val name = json.get("name").textValue()
    val displayName = json.get("display_name").textValue()
    val codePrefix = json.get("code_prefix").textValue()
    val mapUrl = filePath

    GeoArea(
      name = name,
      displayName = displayName,
      codePrefix = codePrefix,
      zoneLvl = getZoneLvl(codePrefix),
      mapUrl = mapUrl
    )
  }

  override def parseGeolocation(jsonNode: JsonNode): Seq[Geolocation] = {
    val geolocations = ArrayBuffer[Geolocation]()

    jsonNode
      .iterator()
      .forEachRemaining(json => {
        val name = json.at("/properties/name").textValue()
        val code = json.at("/properties/hc-key").textValue()

        if (name == null) {
          throw new Exception("missing '/properties/name' field")
        }

        if (code == null) {
          throw new Exception("missing '/properties/hc-key' field")
        }

        val geolocation = Geolocation(
          code = code,
          name = name,
          normalizedName = StringUtils.normalizeVietnamese(name),
          geoType = getZoneLvl(code).toString,
          latitude = 0,
          longitude = 0,
          properties = ""
        )

        geolocations += geolocation
      })

    geolocations
  }

  private def getZoneLvl(code: String): Int = {
    if (code == null || code.isEmpty) {
      0
    } else {
      code.split('-').length
    }
  }

  private def isTargetGeolocation(code: String, targetPrefix: String, targetZoneLvl: Int): Boolean = {
    getZoneLvl(code) == targetZoneLvl && code.startsWith(targetPrefix)
  }

  Future {
    initData()
  }
}
