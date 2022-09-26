package datainsider.data_cook.engine

import com.google.inject.Module
import com.google.inject.util.Modules
import com.twitter.inject.app.TestInjector

/**
  * @author tvc12 - Thien Vi
  * @created 10/06/2021 - 4:54 PM
  */
object DiTestInjector {
  def apply(modules: Module*): TestInjector = new TestInjector(Seq(overrideModule(modules: _*)))

  def overrideModule(modules: Module*): Module = {
    if (modules.size == 1) return modules.head

    var module = modules.head
    modules.tail.foreach(m => {
      module = Modules.`override`(module).`with`(m)
    })
    module
  }
}
