import { memo } from 'react';
import { BaseEdge, type EdgeProps } from '@xyflow/react';
import { TABLE_NODE_WIDTH, bezierPath, curvedBezier, rowCenter } from './curvedPath.utils';
import type { RelationshipEdge } from './relationshipGraph.utils';

/** v1's curved connector between two column rows. Clicks are handled by the canvas (`onEdgeClick`). */
function RelationshipEdgeViewImpl({ id, sourceX, sourceY, targetX, targetY }: EdgeProps<RelationshipEdge>) {
  const from = rowCenter({ x: sourceX, y: sourceY }, TABLE_NODE_WIDTH);
  const to = rowCenter({ x: targetX, y: targetY }, TABLE_NODE_WIDTH);
  return (
    <BaseEdge
      id={id}
      path={bezierPath(curvedBezier(from, to, TABLE_NODE_WIDTH))}
      className="relationship-edge"
      interactionWidth={12}
    />
  );
}

export const RelationshipEdgeView = memo(RelationshipEdgeViewImpl);
