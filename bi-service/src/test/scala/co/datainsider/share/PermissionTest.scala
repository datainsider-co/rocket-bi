package co.datainsider.share

import com.twitter.inject.Test
import co.datainsider.share.service.Permissions.{getAvailablePermissions, buildIncludeAndExcludePermissions, buildPermissions, copyPermissionsToResourceId, getActions}

class PermissionTest extends Test {

  test("build include and exclude permissions") {
    val permissions = Seq("1:directory:view:1", "1:directory:view:2", "1:directory:edit:1")
    val resourceIds = Seq("1", "2", "3")
    val includePermissionsExpected = Seq(
      "1:directory:view:1",
      "1:directory:view:2",
      "1:directory:view:3",
      "1:directory:edit:1",
      "1:directory:edit:2",
      "1:directory:edit:3"
    )
    val excludePermissionsExpected = Seq(
      "1:directory:create:1",
      "1:directory:delete:1",
      "1:directory:share:1",
      "1:directory:copy:1",
      "1:directory:create:2",
      "1:directory:delete:2",
      "1:directory:share:2",
      "1:directory:copy:2",
      "1:directory:create:3",
      "1:directory:delete:3",
      "1:directory:share:3",
      "1:directory:copy:3"
    )
    val result = buildIncludeAndExcludePermissions(1L, permissions, resourceIds, "directory")
    includePermissionsExpected.foreach(permission => assert(result.includePermissions.contains(permission)))
    excludePermissionsExpected.foreach(permission => assert(result.excludePermissions.contains(permission)))
    println("Include permissions: ", result.includePermissions)
    println("Exclude permissions: ", result.excludePermissions)
  }

  test("build include and exclude with none permissions") {
    val permissions = Seq()
    val resourceIds = Seq("1")
    val result = buildIncludeAndExcludePermissions(1L, permissions, resourceIds, "directory")
    assert(result.includePermissions.isEmpty)
    println("Include permissions: ", result.includePermissions)
    println("Exclude permissions: ", result.excludePermissions)
  }

  test("build include and exclude with full permissions") {
    val permissions = Seq("1:directory:view:1", "1:directory:edit:1", "1:directory:create:1", "1:directory:copy:1", "1:directory:delete:1", "1:directory:share:1", "1:directory:*:1")
    val resourceIds = Seq("1")
    val result = buildIncludeAndExcludePermissions(1L, permissions, resourceIds, "directory")
    assert(result.excludePermissions.isEmpty)
    println("Include permissions: ", result.includePermissions)
    println("Exclude permissions: ", result.excludePermissions)
  }

  test("build include and exclude with none resource id") {
    val permissions = Seq("1:directory:view:1")
    val resourceIds = Seq()
    val result = buildIncludeAndExcludePermissions(1L, permissions, resourceIds, "directory")
    assert(result.includePermissions.isEmpty)
    assert(result.excludePermissions.isEmpty)
    println("Include permissions: ", result.includePermissions)
    println("Exclude permissions: ", result.excludePermissions)
  }

  test("build all permissions") {
    val result = getAvailablePermissions(1L, "directory", "1")
    val expected = Seq("1:directory:view:1", "1:directory:edit:1", "1:directory:create:1", "1:directory:delete:1", "1:directory:copy:1", "1:directory:share:1")
    println(result)
    expected.foreach(permission => assert(result.contains(permission)))
  }

  test("build all permissions with wrong resource type") {
    val result = getAvailablePermissions(1L, "wrong", "1")
    val expected = Seq("1:wrong:view:1", "1:wrong:edit:1", "1:wrong:create:1", "1:wrong:delete:1", "1:wrong:copy:1", "1:wrong:share:1", "1:wrong:*:1")
    println(result)
    expected.foreach(permission => assert(result.contains(permission)))
  }

  test("Build permissions") {
    val result = buildPermissions(1L, "directory", Seq("1","2","3"), Seq("edit"))
    assert(result.contains("1:directory:edit:1"))
    assert(result.contains("1:directory:edit:2"))
    assert(result.contains("1:directory:edit:3"))
    println(result)
  }

  test("Build permissions with none resource id") {
    val result = buildPermissions(1L, "directory", Seq(), Seq("edit"))
    assert(result.isEmpty)
    println(result)
  }

  test("Build permissions with none action") {
    val result = buildPermissions(1L, "directory", Seq("1","2","3"), Seq())
    assert(result.isEmpty)
    println(result)
  }

  test("Build permissions with wrong resource type") {
    val result = buildPermissions(1L, "wrong", Seq("1","2","3"), Seq("edit"))
    assert(result.contains("1:wrong:edit:1"))
    assert(result.contains("1:wrong:edit:2"))
    assert(result.contains("1:wrong:edit:3"))
    println(result)
  }

  test("Build permissions with wrong action") {
    val result = buildPermissions(1L, "directory", Seq("1","2","3"), Seq("wrong"))
    assert(result.contains("1:directory:wrong:1"))
    assert(result.contains("1:directory:wrong:2"))
    assert(result.contains("1:directory:wrong:3"))
    println(result)
  }

  test("Build permissions from parent") {
    val parentPermissions = Seq("1:directory:view:2", "1:directory:edit:2", "1:directory:*:2")
    val result = copyPermissionsToResourceId(1L, "1", "directory", parentPermissions)
    assert(result.contains("1:directory:view:1"))
    assert(result.contains("1:directory:edit:1"))
    assert(result.contains("1:directory:*:1"))
    println(result)
  }

  test("Build permissions from parent with none parent permissions") {
    val parentPermissions = Seq()
    val result = copyPermissionsToResourceId(1L, "1", "directory", parentPermissions)
    assert(result.isEmpty)
    println(result)
  }

  test("Build permissions from parent with wrong permission") {
    val parentPermissions = Seq("1:directory:view:2", "1:directory:edit:2", "1:directory:*:2", "1:directory:wrong:2")
    val result = copyPermissionsToResourceId(1L, "1", "directory", parentPermissions)
    assert(result.contains("1:directory:view:1"))
    assert(result.contains("1:directory:edit:1"))
    assert(result.contains("1:directory:*:1"))
    assert(result.contains("1:directory:wrong:1"))
    println(result)
  }

  test("Get actions") {
    val permissions = Seq("1:directory:view:1", "1:directory:view:2", "1:directory:edit:1")
    val result = getActions(permissions)
    assert(result.contains("view"))
    assert(result.contains("edit"))
    println(result)
  }

  test("Get actions with none permission") {
    val permissions = Seq()
    val result = getActions(permissions)
    assert(result.isEmpty)
    println(result)
  }

  test("Get actions with wrong action") {
    val permissions = Seq("1:directory:view:1", "1:directory:wrong:2", "1:directory:edit:1")
    val result = getActions(permissions)
    assert(result.contains("view"))
    assert(result.contains("edit"))
    assert(result.contains("wrong"))
    println(result)
  }
}
