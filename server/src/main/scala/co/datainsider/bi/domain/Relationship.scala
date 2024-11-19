package co.datainsider.bi.domain

import co.datainsider.bi.domain.query.{Field, QueryView}

import scala.collection.mutable
import scala.collection.mutable.ArrayBuffer

case class Relationship(
    firstView: QueryView,
    secondView: QueryView,
    fieldPairs: Seq[FieldPair]
)

case class FieldPair(firstField: Field, secondField: Field)

case class RelationshipInfo(
    views: Seq[QueryView],
    relationships: Seq[Relationship],
    extraData: Map[String, Any] = Map.empty
)

class RelationshipGraph(relationships: Seq[Relationship]) {
  private val adjacentNodes = mutable.Map[QueryView, mutable.Map[QueryView, Relationship]]()

  relationships.foreach(rls => {
    val firstKey = rls.firstView
    val secondKey = rls.secondView

    adjacentNodes.get(firstKey) match {
      case None => adjacentNodes.put(firstKey, mutable.Map[QueryView, Relationship]())
      case _    =>
    }

    adjacentNodes.get(secondKey) match {
      case None => adjacentNodes.put(secondKey, mutable.Map[QueryView, Relationship]())
      case _    =>
    }

    adjacentNodes(firstKey).put(secondKey, rls)
    adjacentNodes(secondKey).put(firstKey, rls)
  })

  /**
    * depth-first-search from start node to target node
    * @param startNode
    * @param targetNode
    * @return paths as sequence of Relationship from start to target node
    *         return empty seq if target node does not connect with start node
    */
  def findPath(startNode: QueryView, targetNode: QueryView): Seq[Relationship] = {
    bfs(mutable.Queue(startNode), targetNode, mutable.HashMap.empty, mutable.Set.empty)
  }

  def dfs(
      curNode: QueryView,
      targetNode: QueryView,
      curPath: Seq[Relationship],
      visited: Set[QueryView]
  ): Seq[Relationship] = {
    if (curNode == targetNode) {
      return curPath
    }

    adjacentNodes.get(curNode) match {
      case Some(toNodes) =>
        toNodes.foreach(nextNode => {

          if (!visited.contains(nextNode._1)) {
            val foundPath = dfs(nextNode._1, targetNode, curPath :+ nextNode._2, visited + nextNode._1)

            if (foundPath.nonEmpty) {
              return foundPath
            }
          }

        })
      case None =>
    }

    Seq.empty
  }

  def bfs(
      curQueue: mutable.Queue[QueryView],
      targetNode: QueryView,
      parents: mutable.HashMap[QueryView, (QueryView, Relationship)],
      visited: mutable.Set[QueryView]
  ): Seq[Relationship] = {
    if (curQueue.isEmpty) {
      return Seq.empty
    }

    val curNode: QueryView = curQueue.dequeue
    visited += curNode

    if (curNode == targetNode) {
      return getPathFromParents(parents, targetNode)
    }

    adjacentNodes.get(curNode) match {
      case Some(toNodes) =>
        toNodes.foreach(nextNode => {

          if (!visited.contains(nextNode._1)) {
            curQueue.enqueue(nextNode._1)
            parents.getOrElseUpdate(nextNode._1, (curNode, nextNode._2))
          }

        })

      case None =>
    }

    val foundPath: Seq[Relationship] = bfs(curQueue, targetNode, parents, visited)

    if (foundPath.nonEmpty) {
      foundPath
    } else {
      Seq.empty
    }
  }

  private def getPathFromParents(
      parentNodes: mutable.HashMap[QueryView, (QueryView, Relationship)],
      target: QueryView
  ): Seq[Relationship] = {
    var curNode: QueryView = target
    val paths = ArrayBuffer[Relationship]()

    while (parentNodes.contains(curNode)) {
      val (prevNode, relationship) = parentNodes(curNode)

      curNode = prevNode
      paths += relationship
    }

    paths.reverse
  }

}
