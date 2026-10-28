import { AlignCenterOutlined, AlignLeftOutlined, AlignRightOutlined } from '@ant-design/icons';
import { Segmented } from 'antd';

interface AlignSettingProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
}

const ALIGNS = [
  { value: 'left', icon: <AlignLeftOutlined aria-label="Left" /> },
  { value: 'center', icon: <AlignCenterOutlined aria-label="Center" /> },
  { value: 'right', icon: <AlignRightOutlined aria-label="Right" /> }
];

/** Left, center or right (v1 `AlignSetting`). */
export function AlignSetting({ label, value, onChange }: AlignSettingProps) {
  return (
    <div className="flex flex-col gap-1">
      <span className="text-xs text-black/65">{label}</span>
      <Segmented aria-label={label} value={value} options={ALIGNS} onChange={onChange} />
    </div>
  );
}
