import { useState } from 'react';
import { RadiusUpleftOutlined } from '@ant-design/icons';
import { Input } from 'antd';
import type { JsonObject } from '@/core/json/json';
import { CORNERS, numberAt, sharedRadius, toPixels, withPath, withRadius, type Corner } from '../dashboardSettings.utils';
import { SettingField } from './SettingField';

const CORNER_LABELS: Record<Corner, string> = {
  top_left: 'Top left corner radius',
  top_right: 'Top right corner radius',
  bottom_right: 'Bottom right corner radius',
  bottom_left: 'Bottom left corner radius'
};

/** The preview turns to the corner being edited (v1 `IndependentCornerInput.rotateDeg`). */
const CORNER_TURN: Record<Corner, number> = { top_left: 0, top_right: 90, bottom_right: 180, bottom_left: 270 };

interface RadiusInputProps {
  draft: JsonObject;
  /** Path of the `radius` object (`top_left`, ...). */
  path: readonly string[];
  onChange: (draft: JsonObject) => void;
}

/**
 * v1 `DiRadiusInput`: one radius for every corner, or, with the toggle, one per corner. Corners that differ show
 * "Mixed" and open with the corners shown.
 */
export function RadiusInput({ draft, path, onChange }: RadiusInputProps) {
  const shared = sharedRadius(draft, path, 20);
  const [independent, setIndependent] = useState(shared === undefined);
  const [focused, setFocused] = useState<Corner>('top_left');
  return (
    <div className="setting-radius">
      <SettingField label="Corner radius (px)" className="setting-radius__all">
        <Input
          aria-label="Corner radius"
          className="setting-input"
          disabled={independent}
          value={shared ?? 'Mixed'}
          onChange={event => onChange(withRadius(draft, path, toPixels(event.target.value)))}
        />
      </SettingField>
      <button
        type="button"
        className="setting-radius__toggle"
        aria-label="Independent corners"
        aria-pressed={independent}
        title="Independent corners"
        onClick={() => setIndependent(on => !on)}
      >
        <i className="di-icon-dashed-stroke" aria-hidden />
      </button>
      <SettingField label="Independent Corner" className={`setting-radius__corners ${independent ? '' : 'invisible'}`}>
        <div className="setting-corners">
          <RadiusUpleftOutlined className="setting-corners__preview" style={{ transform: `rotate(${CORNER_TURN[focused]}deg)` }} aria-hidden />
          {CORNERS.map(corner => (
            <input
              key={corner}
              aria-label={CORNER_LABELS[corner]}
              title={CORNER_LABELS[corner]}
              value={numberAt(draft, [...path, corner], 20)}
              onFocus={() => setFocused(corner)}
              onChange={event => onChange(withPath(draft, [...path, corner], toPixels(event.target.value)))}
            />
          ))}
        </div>
      </SettingField>
    </div>
  );
}
