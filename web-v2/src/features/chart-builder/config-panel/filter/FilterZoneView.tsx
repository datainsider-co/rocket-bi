import { Fragment, type ReactNode } from 'react';
import type { ConditionData } from '@/core/chart-builder/ConditionData';
import { FieldDropZone } from '@/shared/field-dnd/FieldDropZone';
import { FILTER_ZONE, groupZoneId } from '../../dnd/builderDnd.utils';
import type { TableNode } from '../../field-tree/fieldTree.utils';
import type { DroppedField } from '../../state/builderState.utils';
import { DropHintView } from '../DropHintView';
import { filterableField } from '../fieldMenu.utils';
import { ZoneTitleView } from '../ZoneTitleView';
import { ConditionItemView } from './ConditionItemView';

export interface FilterZoneViewProps {
  groups: readonly [groupId: number, conditions: readonly ConditionData[]][];
  chipsOf: (condition: ConditionData) => readonly string[];
  renderEditor: (condition: ConditionData, close: () => void) => ReactNode;
  onRemove: (condition: ConditionData) => void;
  /** Tables to pick a field from by click: a new group ("click here"), another field for a condition (its name). */
  tables: readonly TableNode[];
  onAddField: (field: DroppedField) => void;
  onSwapField: (condition: ConditionData, field: DroppedField) => void;
}

/**
 * The Filters zone (v1 `FilterDraggable`): and-groups, or-ed together. A field dropped on a group joins it; dropped
 * anywhere else in the zone, it starts a new group.
 */
export function FilterZoneView({ groups, chipsOf, renderEditor, onRemove, tables, onAddField, onSwapField }: FilterZoneViewProps) {
  return (
    <section className="flex flex-col gap-1" aria-label="Filters">
      <ZoneTitleView title="Filters" optional />
      <FieldDropZone
        zoneId={FILTER_ZONE}
        itemKeys={[]}
        renderItem={() => null}
        placeholder={
          <div className="flex flex-col gap-1">
            {groups.map(([groupId, conditions], index) => (
              <Fragment key={groupId}>
                {index > 0 && <div className="text-center text-xs text-black/45">OR</div>}
                <fieldset aria-label="AND group" className="m-0 min-w-0 border-0 p-0">
                  <FieldDropZone
                    zoneId={groupZoneId(groupId)}
                    itemKeys={conditions.map(condition => String(condition.id))}
                    renderItem={position => {
                      const condition = conditions[position];
                      return (
                        condition && (
                          <ConditionItemView
                            condition={condition}
                            chips={chipsOf(condition)}
                            tables={tables}
                            onPickField={field => onSwapField(condition, field)}
                            renderEditor={close => renderEditor(condition, close)}
                            onRemove={() => onRemove(condition)}
                          />
                        )
                      );
                    }}
                  />
                </fieldset>
              </Fragment>
            ))}
            <DropHintView tables={tables} accepts={filterableField} onPick={onAddField} />
          </div>
        }
      />
    </section>
  );
}
