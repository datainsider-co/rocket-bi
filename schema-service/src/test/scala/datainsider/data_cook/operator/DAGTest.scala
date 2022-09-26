package datainsider.data_cook.operator
import java.util

import com.twitter.inject.Test
import datainsider.data_cook.dag.DAG

class DAGTest extends Test {

  test("simple DAG topo order") {

    val dag = new DAG(7)

    /**
      *   0 -> 1 -> 4 -> 5 -> 6
      * | \       /      /
      * |  -> 2--  - 3  /
      *
      **/
    dag.addEdge(0, 1)
    dag.addEdge(0, 2)
    dag.addEdge(1, 4)
    dag.addEdge(2, 3)
    dag.addEdge(2, 4)
    dag.addEdge(4, 5)
    dag.addEdge(3, 5)
    dag.addEdge(5, 6)

    assertResult(false)(dag.isCyclic)
    val stack: util.Stack[Int] = dag.topoSort()
    var topoOrder = ""

    while (!stack.empty()) {
      topoOrder += stack.pop()
    }

    val expectTopoOrder = "0231456"
    println(s"Expected Topo Order ${expectTopoOrder}, actual Topo Order ${topoOrder}")
    assertResult(expectTopoOrder)(topoOrder)

  }

  test("complex DAG topo order") {

    val dag = new DAG(7)

    /**
      *   0 -> 1 -> 4 -> 5 -> 6
      * | \       /   /
      * |  -> 2--    /
      *  \          /
      *   -> 3 ----
      *
      *  /
    **/
    dag.addEdge(0, 1)
    dag.addEdge(0, 2)
    dag.addEdge(0, 3)
    dag.addEdge(1, 4)
    dag.addEdge(2, 4)
    dag.addEdge(4, 5)
    dag.addEdge(3, 5)
    dag.addEdge(5, 6)
    assertResult(false)(dag.isCyclic)
    val stack: util.Stack[Int] = dag.topoSort()
    var topoOrder = ""

    while (!stack.empty()) {
      topoOrder += stack.pop()
    }

    val expectTopoOrder = "0321456"
    println(s"Expected Topo Order ${expectTopoOrder}, actual Topo Order ${topoOrder}")
    assertResult(expectTopoOrder)(topoOrder)

  }

  test("assert simple DAG is cyclic ") {

    val dag = new DAG(2)

    /**
      *
      *   0 -> 1 -> 0
      *
      **/
    dag.addEdge(0, 1)
    dag.addEdge(1, 0)

    val isCyclic: Boolean = dag.isCyclic
    assertResult(true)(isCyclic)
    println(s"Expect isCyclic is true, actual value is: ${isCyclic}")

  }

  test("assert simple DAG is cyclic 2 ") {

    val dag = new DAG(4)

    /**
      *
      *   0 -> 1 -> 2 -> 3 -> 1
      *
      **/
    dag.addEdge(0, 1)
    dag.addEdge(1, 2)
    dag.addEdge(2, 3)
    dag.addEdge(3, 1)

    val isCyclic: Boolean = dag.isCyclic
    assertResult(true)(isCyclic)
    println(s"Expect isCyclic is true, actual value is: ${isCyclic}")

  }

  test("assert complex DAG is cyclic ") {

    val dag = new DAG(7)

    /**
      *
      *       -------------
      *       \           /
      *        v
      *   0 -> 1 -> 4 -> 5 -> 6
      * | \       /   /
      * |  -> 2--    /
      *  \          /
      *   -> 3 ----
      *
      *  /
      **/
    dag.addEdge(0, 1)
    dag.addEdge(0, 2)
    dag.addEdge(0, 3)
    dag.addEdge(1, 4)
    dag.addEdge(2, 4)
    dag.addEdge(4, 5)
    dag.addEdge(3, 5)
    dag.addEdge(5, 1)
    dag.addEdge(5, 6)

    val isCyclic: Boolean = dag.isCyclic
    assertResult(true)(isCyclic)
    println(s"Expect isCyclic is true, actual value is: ${isCyclic}")

  }
}
