import React from 'react';
import type { DesignStatus } from '../../types';

interface StatusDropdownProps {
  value: DesignStatus;
  disabled?: boolean;
  onChange: (next: DesignStatus) => void;
}

const statuses: DesignStatus[] = ['pending', 'printing', 'completed'];

const StatusDropdown: React.FC<StatusDropdownProps> = ({
  value,
  disabled,
  onChange,
}) => {
  return (
    <select
      value={value}
      disabled={disabled}
      onChange={(e) => onChange(e.target.value as DesignStatus)}
      className="text-xs border border-slate-200 rounded-md px-2 py-1 bg-white disabled:opacity-60 disabled:cursor-not-allowed"
    >
      {statuses.map((s) => (
        <option key={s} value={s}>
          {s.charAt(0).toUpperCase() + s.slice(1)}
        </option>
      ))}
    </select>
  );
};

export default StatusDropdown;
