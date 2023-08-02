package co.datainsider.jobworker.hubspot.util

import scala.reflect.runtime.universe._

/**
 * Created by phuonglam on 2/16/17.
 **/
object ReflectionUtil {
  implicit class Reflector(ref: Any) {
    def getV(name: String): Any = ref.getClass.getMethods.find(_.getName == name).get.invoke(ref)
    def setV(name: String, value: Any): Unit = ref.getClass.getMethods.find(_.getName == name).get.invoke(ref, value.asInstanceOf[AnyRef])
  }

  def getFieldsName[T: Manifest]: Iterable[String] = typeOf[T].members.filter(f => {
    f.isTerm && (f.asTerm.isVal || f.asTerm.isVal)
  }).map(_.name.toString.trim)

  def extractProperty[T: Manifest](t: T): Seq[(String, Any)] = {
    val fields = getFieldsName[T].toSeq
    for (f <- fields) yield (f, t.getV(f))
  }
}
