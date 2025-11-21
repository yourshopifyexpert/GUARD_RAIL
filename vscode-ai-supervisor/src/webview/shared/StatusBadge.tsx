import React from 'react';
import { ActivityStatus } from '../types';
import './StatusBadge.css';

export interface StatusBadgeProps {
  status: ActivityStatus;
  showLabel?: boolean;
}

const STATUS_CONFIG = {
  [ActivityStatus.ON_TRACK]: {
    label: 'On Track',
    icon: 'pass',
    colorVar: '--vscode-testing-iconPassed'
  },
  [ActivityStatus.MINOR_DEVIATION]: {
    label: 'Minor Deviation',
    icon: 'warning',
    colorVar: '--vscode-testing-iconQueued'
  },
  [ActivityStatus.CRITICAL_ALERT]: {
    label: 'Critical Alert',
    icon: 'error',
    colorVar: '--vscode-testing-iconFailed'
  }
};

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status, showLabel = false }) => {
  const config = STATUS_CONFIG[status];

  return (
    <div className="status-badge" style={{ color: `var(${config.colorVar})` }}>
      <i className={`codicon codicon-${config.icon}`} />
      {showLabel && <span className="status-badge__label">{config.label}</span>}
    </div>
  );
};
