import React, { useState, useEffect } from 'react';
import ReactDOM from 'react-dom';
import {
  ActivityItem,
  ActivityStatus,
  ActivityFilter,
  MessageType,
} from '../types';
import { vscodeApi } from '../utils/vscode';
import { applyVSCodeStyles } from '../utils/theme';
import { VirtualList } from '../shared/VirtualList';
import { Timeline } from '../shared/Timeline';
import { StatusBadge } from '../shared/StatusBadge';
import { Button } from '../shared/Button';
import './ActivityMonitor.css';

type ViewMode = 'timeline' | 'list';

const ActivityMonitor: React.FC = () => {
  const [activities, setActivities] = useState<ActivityItem[]>([]);
  const [viewMode, setViewMode] = useState<ViewMode>('timeline');
  const [filter, setFilter] = useState<ActivityFilter>({});
  const [selectedStatus, setSelectedStatus] = useState<ActivityStatus | 'all'>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Initialize and request activity history
  useEffect(() => {
    applyVSCodeStyles();
    vscodeApi.postMessage(MessageType.REQUEST_ACTIVITY_HISTORY);

    // Listen for activity updates
    const unsubscribe = vscodeApi.onMessage(
      MessageType.ACTIVITY_HISTORY_RESPONSE,
      (payload: ActivityItem[]) => {
        setActivities(payload);
      }
    );

    const unsubscribeUpdate = vscodeApi.onMessage(
      MessageType.ACTIVITY_UPDATE,
      (payload: ActivityItem) => {
        setActivities((prev) => [payload, ...prev]);
      }
    );

    return () => {
      unsubscribe();
      unsubscribeUpdate();
    };
  }, []);

  // Filter activities
  const filteredActivities = activities.filter((activity) => {
    // Status filter
    if (selectedStatus !== 'all' && activity.status !== selectedStatus) {
      return false;
    }

    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      return (
        activity.title.toLowerCase().includes(query) ||
        activity.description.toLowerCase().includes(query) ||
        activity.filePath?.toLowerCase().includes(query)
      );
    }

    return true;
  });

  const handleItemClick = (item: ActivityItem) => {
    // Open change inspector if it's a file change
    if (item.filePath) {
      vscodeApi.postMessage(MessageType.REQUEST_CHANGE_DETAIL, { id: item.id });
    }
  };

  const handleClearHistory = () => {
    if (confirm('Are you sure you want to clear all activity history?')) {
      setActivities([]);
      vscodeApi.postMessage(MessageType.REQUEST_ACTIVITY_HISTORY, { clear: true });
    }
  };

  const statusCounts = activities.reduce(
    (acc, activity) => {
      acc[activity.status] = (acc[activity.status] || 0) + 1;
      return acc;
    },
    {} as Record<ActivityStatus, number>
  );

  return (
    <div className="activity-monitor">
      <div className="activity-monitor__header">
        <h2 className="activity-monitor__title">
          <i className="codicon codicon-pulse" />
          Activity Monitor
        </h2>
        <div className="activity-monitor__actions">
          <Button
            icon={viewMode === 'timeline' ? 'list-unordered' : 'timeline'}
            onClick={() => setViewMode(viewMode === 'timeline' ? 'list' : 'timeline')}
            title={`Switch to ${viewMode === 'timeline' ? 'list' : 'timeline'} view`}
          />
          <Button icon="refresh" onClick={() => vscodeApi.postMessage(MessageType.REQUEST_ACTIVITY_HISTORY)} title="Refresh" />
          <Button icon="clear-all" onClick={handleClearHistory} title="Clear history" />
        </div>
      </div>

      <div className="activity-monitor__filters">
        <div className="activity-monitor__search">
          <i className="codicon codicon-search" />
          <input
            type="text"
            className="activity-monitor__search-input"
            placeholder="Search activities..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        <div className="activity-monitor__status-filters">
          <button
            className={`status-filter ${selectedStatus === 'all' ? 'status-filter--active' : ''}`}
            onClick={() => setSelectedStatus('all')}
          >
            All ({activities.length})
          </button>
          <button
            className={`status-filter ${selectedStatus === ActivityStatus.ON_TRACK ? 'status-filter--active' : ''}`}
            onClick={() => setSelectedStatus(ActivityStatus.ON_TRACK)}
          >
            <StatusBadge status={ActivityStatus.ON_TRACK} />
            ({statusCounts[ActivityStatus.ON_TRACK] || 0})
          </button>
          <button
            className={`status-filter ${selectedStatus === ActivityStatus.MINOR_DEVIATION ? 'status-filter--active' : ''}`}
            onClick={() => setSelectedStatus(ActivityStatus.MINOR_DEVIATION)}
          >
            <StatusBadge status={ActivityStatus.MINOR_DEVIATION} />
            ({statusCounts[ActivityStatus.MINOR_DEVIATION] || 0})
          </button>
          <button
            className={`status-filter ${selectedStatus === ActivityStatus.CRITICAL_ALERT ? 'status-filter--active' : ''}`}
            onClick={() => setSelectedStatus(ActivityStatus.CRITICAL_ALERT)}
          >
            <StatusBadge status={ActivityStatus.CRITICAL_ALERT} />
            ({statusCounts[ActivityStatus.CRITICAL_ALERT] || 0})
          </button>
        </div>
      </div>

      <div className="activity-monitor__content">
        {viewMode === 'timeline' ? (
          <Timeline items={filteredActivities} onItemClick={handleItemClick} />
        ) : (
          <VirtualList
            items={filteredActivities}
            rowHeight={80}
            renderItem={(item) => (
              <div className="activity-list-item">
                <div className="activity-list-item__header">
                  <StatusBadge status={item.status} />
                  <span className="activity-list-item__title">{item.title}</span>
                  <span className="activity-list-item__time">
                    {new Date(item.timestamp).toLocaleString()}
                  </span>
                </div>
                <div className="activity-list-item__description">{item.description}</div>
                {item.filePath && (
                  <div className="activity-list-item__file">
                    <i className="codicon codicon-file" />
                    {item.filePath}
                  </div>
                )}
              </div>
            )}
            onItemClick={handleItemClick}
            emptyMessage="No activity matching your filters"
          />
        )}
      </div>
    </div>
  );
};

// Mount the component
const root = document.getElementById('root');
if (root) {
  ReactDOM.render(<ActivityMonitor />, root);
}
