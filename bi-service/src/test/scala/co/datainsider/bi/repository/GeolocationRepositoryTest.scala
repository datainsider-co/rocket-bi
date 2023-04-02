package co.datainsider.bi.repository

import org.scalatest.FunSuite

class GeolocationRepositoryTest extends FunSuite {
  val dataPath = "mapdata"
  val geolocationRepository = new InMemGeolocationRepository(dataPath)

  test("test load data from a folder") {
    geolocationRepository.initData()
  }
}
