package co.datainsider.datacook.dag

import java.util

class DAG(totalVertices: Int) {

  /** *
    * List of pointer for each vertex
    * 1 -> 2 -> 3
    * 2 -> 4
    * 3 -> 4
    * 4 ->
    */
  private val adjacency = new util.ArrayList[util.ArrayList[Integer]](totalVertices)
  for (_ <- 0 until totalVertices) {
    adjacency.add(new util.ArrayList(totalVertices))
  }

  /** *
    *
    * Using DFS to check if there is a cycle in graph
    * @param vertex vertex to check
    * @param visited flag-array whether vertex is already visited
    * @param stack if stack[vertex] == true, vertex is in stack
    * @return true if detect any cycle in current vertex
    */
  private def isCyclic(vertex: Int, visited: Array[Boolean], stack: Array[Boolean]): Boolean = {

    if (stack(vertex)) return true

    if (visited(vertex)) return false

    visited(vertex) = true
    stack(vertex) = true

    adjacency
      .get(vertex)
      .forEach(v => {
        if (isCyclic(v, visited, stack)) return true
      })

    stack(vertex) = false

    return false

  }
  def isCyclic: Boolean = {
    val visited: Array[Boolean] = Array.fill[Boolean](totalVertices)(false)
    val stack: Array[Boolean] = Array.fill[Boolean](totalVertices)(false)

    for (i <- 0 until totalVertices) {
      if (isCyclic(i, visited, stack)) return true
    }
    return false
  }

  def addEdge(fromVertex: Int, toVertex: Int): Unit = {
    adjacency.get(fromVertex).add(toVertex)
  }

  /** *
    * @Required: Need to check isCyclic() first.
    *
    * @return stack contain the reverse-order of topological sort
    *         using stack.pop() to get the topo-order.
    */
  def topoSort(): util.Stack[Int] = {
    val stack = new util.Stack[Int]
    val visited = Array.fill[Boolean](totalVertices)(false)

    for (vertex <- 0 until totalVertices) {
      if (!visited(vertex)) {
        topoSort(vertex, visited, stack)
      }
    }
    return stack
  }

  private def topoSort(vertex: Int, visited: Array[Boolean], stack: util.Stack[Int]): Unit = {
    visited(vertex) = true
    adjacency
      .get(vertex)
      .forEach(v => {
        if (!visited(v)) topoSort(v, visited, stack)
      })
    stack.push(vertex)
  }
}
