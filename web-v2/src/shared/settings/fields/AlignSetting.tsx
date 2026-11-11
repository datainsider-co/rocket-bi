import '../Settings.css';

interface AlignSettingProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
}

/** Bootstrap's `text-left`, `text-center` and `text-right` glyphs, which v1 `AlignSetting` used. */
const ALIGNS: readonly { value: string; label: string; path: string }[] = [
  { value: 'left', label: 'Left', path: 'M2 12.5a.5.5 0 0 1 .5-.5h7a.5.5 0 0 1 0 1h-7a.5.5 0 0 1-.5-.5zm0-3a.5.5 0 0 1 .5-.5h11a.5.5 0 0 1 0 1h-11a.5.5 0 0 1-.5-.5zm0-3a.5.5 0 0 1 .5-.5h7a.5.5 0 0 1 0 1h-7a.5.5 0 0 1-.5-.5zm0-3a.5.5 0 0 1 .5-.5h11a.5.5 0 0 1 0 1h-11a.5.5 0 0 1-.5-.5z' },
  { value: 'center', label: 'Center', path: 'M4 12.5a.5.5 0 0 1 .5-.5h7a.5.5 0 0 1 0 1h-7a.5.5 0 0 1-.5-.5zm-2-3a.5.5 0 0 1 .5-.5h11a.5.5 0 0 1 0 1h-11a.5.5 0 0 1-.5-.5zm2-3a.5.5 0 0 1 .5-.5h7a.5.5 0 0 1 0 1h-7a.5.5 0 0 1-.5-.5zm-2-3a.5.5 0 0 1 .5-.5h11a.5.5 0 0 1 0 1h-11a.5.5 0 0 1-.5-.5z' },
  { value: 'right', label: 'Right', path: 'M6 12.5a.5.5 0 0 1 .5-.5h7a.5.5 0 0 1 0 1h-7a.5.5 0 0 1-.5-.5zm-4-3a.5.5 0 0 1 .5-.5h11a.5.5 0 0 1 0 1h-11a.5.5 0 0 1-.5-.5zm4-3a.5.5 0 0 1 .5-.5h7a.5.5 0 0 1 0 1h-7a.5.5 0 0 1-.5-.5zm-4-3a.5.5 0 0 1 .5-.5h11a.5.5 0 0 1 0 1h-11a.5.5 0 0 1-.5-.5z' }
];

/** Left, center or right (v1 `AlignSetting`): three bare glyphs, the picked one in the accent. */
export function AlignSetting({ label, value, onChange }: AlignSettingProps) {
  return (
    <fieldset className="setting-field align-setting">
      <legend className="setting-label">{label}</legend>
      <div className="align-setting__options">
        {ALIGNS.map(align => (
          <button key={align.value} type="button" className="align-setting__option" aria-label={align.label} aria-pressed={value === align.value} onClick={() => onChange(align.value)}>
            <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor" aria-hidden="true">
              <path fillRule="evenodd" d={align.path} />
            </svg>
          </button>
        ))}
      </div>
    </fieldset>
  );
}
