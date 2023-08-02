import Vue from 'vue';
import { Drag } from 'vue-drag-drop';
import { cloneDeep } from 'lodash';
import { Log } from '@core/utils';

export default Vue.extend({
  components: {
    Drag
  },
  name: 'sl-vue-tree',
  props: {
    value: {
      type: Array,
      default: () => []
    },
    level: {
      type: Number,
      default: 0
    },
    parentInd: {
      type: Number
    }
  },

  data() {
    return {
      rootCursorPosition: null,
      currentValue: this.value
    };
  },

  watch: {
    value: function(newValue) {
      this.currentValue = newValue;
    }
  },

  computed: {
    cursorPosition() {
      if (this.isRoot) return this.rootCursorPosition;
      return this.getParent().cursorPosition;
    },
    nodes() {
      if (this.isRoot) {
        const nodeModels = this.copy(this.currentValue);
        return this.getNodes(nodeModels);
      } else {
        return this.getParent().getNodeAt(this.parentInd).children;
      }
    },
    isRoot() {
      return !this.level;
    }
  },
  methods: {
    handleRightClick(node, event) {
      this.$emit('onRightClick', node, event);
    },
    handleClick(node, event) {
      this.$emit('clickField', node, event);
    },
    handleDragStart() {
      this.$emit('onDragstartitem');
    },
    handleDragEnd() {
      this.$emit('onDragEndItem');
    },
    getNodes(nodes, parentPaths = []) {
      return nodes.map((node, index) => {
        const paths = parentPaths.concat(index);
        return this.getNode(paths, node, nodes);
      });
    },
    getParentNode() {
      if (this.isRoot) {
        return null;
      } else {
        return this.getParent().nodes[this.parentInd];
      }
    },
    getNodeAt(index) {
      return this.nodes[index];
    },

    getNode(paths, currentNode = null, parentNodes = null) {
      if (!currentNode) return null;
      const index = paths.slice(-1)[0];
      const nodeModels = this.currentValue;

      return Object.assign(currentNode, {
        children: currentNode.children ? this.getNodes(currentNode.children, paths) : [],
        data: currentNode.data !== void 0 ? currentNode.data : {},
        path: paths,
        pathStr: JSON.stringify(paths),
        level: paths.length,
        ind: index,
        parent: nodeModels[paths[0]],
        isFirstChild: index == 0,
        isLastChild: index === parentNodes.length - 1
      });
    },

    emitInput(newValue) {
      this.currentValue = newValue;
      this.getRoot().$emit('input', newValue);
    },
    emitToggle(toggledNode, event) {
      this.getRoot().$emit('toggle', toggledNode, event);
    },

    emitNodeClick(node, event) {
      this.getRoot().$emit('nodeclick', node, event);
    },

    emitNodeDblclick(node, event) {
      this.getRoot().$emit('nodedblclick', node, event);
    },

    emitNodeContextmenu(node, event) {
      this.getRoot().$emit('nodecontextmenu', node, event);
    },
    onToggleHandler(event, node) {
      node.isExpanded = !node.isExpanded;
      this.$forceUpdate();
      this.emitToggle(node, event);
      event.stopPropagation();
    },

    getParent() {
      return this.$parent;
    },

    getRoot() {
      if (this.isRoot) return this;
      return this.getParent().getRoot();
    },
    copy(entity) {
      return cloneDeep(entity);
    }
  }
});
