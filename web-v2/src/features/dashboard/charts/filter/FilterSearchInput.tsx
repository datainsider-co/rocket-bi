import { SearchOutlined } from '@ant-design/icons';
import { Input } from 'antd';

interface FilterSearchInputProps {
  value: string;
  placeholder: string;
  onChange: (value: string) => void;
}

/** v1 `DiSearchInput` with a border: a search icon inside a 34px box. */
export function FilterSearchInput({ value, placeholder, onChange }: FilterSearchInputProps) {
  return (
    <Input
      className="filter-search"
      aria-label="Search"
      prefix={<SearchOutlined />}
      allowClear
      placeholder={placeholder}
      value={value}
      onChange={event => onChange(event.target.value)}
    />
  );
}
