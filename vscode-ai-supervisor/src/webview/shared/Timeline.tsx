import React from 'react';
import { ActivityItem, ActivityStatus } from '../types';
import { StatusBadge } from './StatusBadge';
import './Timeline.css';

export interface TimelineProps {
  items: ActivityItem[];
  onItemClick?: (item: ActivityItem) => void;
}

export const Timeline: React.FC<TimelineProps> = ({ items, onItemClick }) => {
  const formatTime = (timestamp: number): string => {
    const date = new Date(timestamp);
    const now = Date.now();
    const diff = now - timestamp;

    // Less than 1 minute
    if (diff < 60000) {
      return 'Just now';
    }
    // Less than 1 hour
    if (diff < 3600000) {
      const minutes = Math.floor(diff / 60000);
      return `${minutes}m ago`;
    }
    // Less than 24 hours
    if (diff < 86400000) {
      const hours = Math.floor(diff / 3600000);
      return `${hours}h ago`;
    }
    // More than 24 hours
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString();
  };

  if (items.length === 0) {
    return (
      <div className="timeline-empty">
        <p>No activity to display</p>
      </div>
    );
  }

  return (
    <div className="timeline">
      {items.map((item, index) => (
        <div
          key={item.id}
          className="timeline-item"
          onClick={() => onItemClick?.(item)}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              onItemClick?.(item);
            }
          }}
        >
          <div className="timeline-item__indicator">
            <StatusBadge status={item.status} />
          </div>
          <div className="timeline-item__content">
            <div className="timeline-item__header">
              <span className="timeline-item__title">{item.title}</span>
              <span className="timeline-item__time">{formatTime(item.timestamp)}</span>
            </div>
            <div className="timeline-item__description">{item.description}</div>
            {item.filePath && (
              <div className="timeline-item__file">
                <i className="codicon codicon-file" />
                <span>{item.filePath}</span>
              </div>
            )}
            {item.changes !== undefined && (
              <div className="timeline-item__changes">
                <i className="codicon codicon-diff" />
                <span>{item.changes} changes</span>
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  );
};
