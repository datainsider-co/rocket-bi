/*
 * @author: tvc12 - Thien Vi
 * @created: 5/25/21, 2:40 PM
 */
const HOOK = Object.freeze({
  toggleOverlap() {
    this._enableOverlap = !this._enableOverlap;
  },
  setEnableOverlap(enableOverlap = false) {
    this._enableOverlap = enableOverlap;
  },
  _fixCollisions(Utils) {
    return function(node) {
      if (this._enableOverlap) return;
      this._sortNodes(-1);

      let nn = node;
      const hasLocked = Boolean(this.nodes.find(n => n.locked));
      if (!this.float && !hasLocked) {
        nn = {
          x: 0,
          y: node.y,
          width: this.column,
          height: node.height
        };
      }
      while (true) {
        const collisionNode = this.nodes.find(n => n !== node && Utils.isIntercepted(n, nn), {
          node: node,
          nn: nn
        });
        if (!collisionNode) {
          return this;
        }
        let moved;
        if (collisionNode.locked) {
          // if colliding with a locked item, move ourself instead
          moved = this.moveNode(node, node.x, collisionNode.y + collisionNode.height, node.width, node.height, true);
        } else {
          moved = this.moveNode(collisionNode, collisionNode.x, node.y + node.height, collisionNode.width, collisionNode.height, true);
        }
        if (!moved) {
          return this;
        } // break inf loop if we couldn't move after all (ex: maxRow, fixed)
      }
    };
  },
  addNode(Utils) {
    return function(node, triggerAddEvent = false) {
      node = this.prepareNode(node);

      if (!this._enableOverlap && node.autoPosition) {
        this._sortNodes();

        for (let i = 0; ; ++i) {
          const x = i % this.column;
          const y = Math.floor(i / this.column);
          if (x + node.width > this.column) {
            continue;
          }
          const box = {
            x: x,
            y: y,
            width: node.width,
            height: node.height
          };
          if (
            !this.nodes.find(n => Utils.isIntercepted(box, n), {
              x: x,
              y: y,
              node: node
            })
          ) {
            node.x = x;
            node.y = y;
            delete node.autoPosition; // found our slot
            break;
          }
        }
      }

      this.nodes.push(node);
      if (triggerAddEvent) {
        this.addedNodes.push(node);
      }

      this._fixCollisions(node);
      this._packNodes();
      this._notify();
      return node;
    };
  },
  init(GridStack) {
    return function(options, element) {
      GridStack.Engine.prototype._enableOverlap = options.enableOverlap ?? false;
      return GridStack.init(options, element);
    };
  }
});

const GridstackOverlapping = function(GridStack) {
  if (!GridStack) return;
  GridStack.customInit = HOOK.init(GridStack);
  GridStack.Engine.prototype.setEnableOverlap = HOOK.setEnableOverlap;
  GridStack.Engine.prototype.toggleOverlap = HOOK.toggleOverlap;
  GridStack.Engine.prototype._fixCollisions = HOOK._fixCollisions(GridStack.Utils);
  GridStack.Engine.prototype.addNode = HOOK.addNode(GridStack.Utils);
};

export default GridstackOverlapping;
