package datainsider.data_cook

import com.twitter.inject.Test
import datainsider.data_cook.util.StringUtils

/**
  * @author tvc12 - Thien Vi
  * @created 01/10/2022 - 10:23 AM
  */
class StringTest extends Test {
  test("Normalize text '123text'") {
    val result = StringUtils.normalizeName("123text")
    assertResult("123text")(result)
  }

  test("Normalize text ''") {
    val result = StringUtils.normalizeName("")
    assertResult("null")(result)
  }

  test("Normalize text is null") {
    val result = StringUtils.normalizeName(null)
    assertResult("null")(result)
  }

  test("Normalize text 'text1`23'") {
    val result = StringUtils.normalizeName("text1`23")
    assertResult("text1_23")(result)
  }

  test("Normalize text 'student``34'") {
    val result = StringUtils.normalizeName("student``34")
    assertResult("student_34")(result)
  }

  test("Normalize text 'class new``student``34'") {
    val result = StringUtils.normalizeName("class new``student``34")
    assertResult("class new_student_34")(result)
  }

  test("validate email is correct pattern") {
    assert(StringUtils.isEmailFormat(email = "meomeocf98@gmail.com"))
    assert(StringUtils.isEmailFormat(email = "tvc12@ohmypet.app"))
  }

  test("validate email is incorrect pattern") {
    assertResult(StringUtils.isEmailFormat(email = "@ohmypet.app"))(false)
    assertResult(StringUtils.isEmailFormat(email = "tvc12@app"))(false)
    assertResult(StringUtils.isEmailFormat(email = "tvc12@app,com"))(false)
    assertResult(StringUtils.isEmailFormat(email = "tvc12@"))(false)
    assertResult(StringUtils.isEmailFormat(email = "tvc12"))(false)
  }
}
