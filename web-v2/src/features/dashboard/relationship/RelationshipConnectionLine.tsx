import type { ConnectionLineComponentProps } from '@xyflow/react';
import { TABLE_NODE_WIDTH, bezierPath, curvedBezier, rowCenter } from './curvedPath.utils';

/** The line that follows the mouse while the user drags a column onto another table. */
export function RelationshipConnectionLine({ fromX, fromY, toX, toY }: ConnectionLineComponentProps) {
  const from = rowCenter({ x: fromX, y: fromY }, TABLE_NODE_WIDTH);
  return (
    <path
      className="relationship-edge relationship-edge--pending"
      fill="none"
      d={bezierPath(curvedBezier(from, { x: toX, y: toY }, TABLE_NODE_WIDTH, true))}
    />
  );
}
