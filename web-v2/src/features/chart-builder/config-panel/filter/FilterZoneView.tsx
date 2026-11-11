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
import '../ConfigPanel.css';

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
 * The Filters zone (v1 `FilterDraggable`): and-groups, each a card, or-ed together. A field dropped on a group joins it
 * ("AND" shows in the card's corner while dragging); dropped anywhere else in the zone, it starts a new group. Unlike
 * v1 the hint stays under the groups, so a group can also be added by click.
 */
export function FilterZoneView({ groups, chipsOf, renderEditor, onRemove, tables, onAddField, onSwapField }: FilterZoneViewProps) {
  return (
    <section className="config-zone" aria-label="Filters">
      <ZoneTitleView title="Filters" optional />
      <FieldDropZone
        zoneId={FILTER_ZONE}
        itemKeys={[]}
        renderItem={() => null}
        placeholder={
          <>
            {groups.length > 0 && (
              <div className="filter-zone__groups">
                {groups.map(([groupId, conditions], index) => (
                  <Fragment key={groupId}>
                    {index > 0 && <div className="filter-zone__or">Or</div>}
                    <fieldset aria-label="AND group" className="filter-zone__group">
                      <span className="filter-zone__and" aria-hidden>
                        AND
                      </span>
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
              </div>
            )}
            <DropHintView tables={tables} accepts={filterableField} onPick={onAddField} />
          </>
        }
      />
    </section>
  );
}
