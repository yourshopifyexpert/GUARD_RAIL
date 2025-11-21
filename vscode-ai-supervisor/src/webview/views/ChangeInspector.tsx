import React, { useState, useEffect } from 'react';
import ReactDOM from 'react-dom';
import {
  CodeChange,
  MessageType,
} from '../types';
import { vscodeApi } from '../utils/vscode';
import { applyVSCodeStyles } from '../utils/theme';
import { DiffViewer } from '../shared/DiffViewer';
import { Button } from '../shared/Button';
import { VirtualList } from '../shared/VirtualList';
import './ChangeInspector.css';

const ChangeInspector: React.FC = () => {
  const [changes, setChanges] = useState<CodeChange[]>([]);
  const [selectedChange, setSelectedChange] = useState<CodeChange | null>(null);
  const [filterStatus, setFilterStatus] = useState<'all' | 'pending' | 'approved' | 'rejected'>('all');

  useEffect(() => {
    applyVSCodeStyles();
    vscodeApi.postMessage(MessageType.REQUEST_CHANGE_DETAIL);

    const unsubscribe = vscodeApi.onMessage(
      MessageType.CHANGE_DETAIL_RESPONSE,
      (payload: CodeChange[]) => {
        setChanges(payload);
      }
    );

    const unsubscribeUpdate = vscodeApi.onMessage(
      MessageType.CHANGES_UPDATE,
      (payload: CodeChange) => {
        setChanges((prev) => {
          const index = prev.findIndex((c) => c.id === payload.id);
          if (index >= 0) {
            const newChanges = [...prev];
            newChanges[index] = payload;
            return newChanges;
          }
          return [payload, ...prev];
        });
        if (selectedChange?.id === payload.id) {
          setSelectedChange(payload);
        }
      }
    );

    return () => {
      unsubscribe();
      unsubscribeUpdate();
    };
  }, [selectedChange?.id]);

  const handleApprove = (change: CodeChange) => {
    vscodeApi.postMessage(MessageType.APPROVE_CHANGE, { id: change.id });
  };

  const handleReject = (change: CodeChange) => {
    if (confirm(`Are you sure you want to reject changes to ${change.filePath}?`)) {
      vscodeApi.postMessage(MessageType.REJECT_CHANGE, { id: change.id });
    }
  };

  const filteredChanges = changes.filter((change) => {
    if (filterStatus === 'all') return true;
    return change.status === filterStatus;
  });

  const getStatusColor = (status: CodeChange['status']): string => {
    switch (status) {
      case 'approved':
        return 'var(--vscode-testing-iconPassed)';
      case 'rejected':
        return 'var(--vscode-testing-iconFailed)';
      case 'pending':
        return 'var(--vscode-testing-iconQueued)';
      default:
        return 'var(--vscode-foreground)';
    }
  };

  const getChangeTypeIcon = (changeType: CodeChange['changeType']): string => {
    switch (changeType) {
      case 'added':
        return 'add';
      case 'modified':
        return 'edit';
      case 'deleted':
        return 'trash';
      default:
        return 'file';
    }
  };

  const formatTimestamp = (timestamp: number): string => {
    return new Date(timestamp).toLocaleString();
  };

  return (
    <div className="change-inspector">
      <div className="change-inspector__header">
        <h2 className="change-inspector__title">
          <i className="codicon codicon-diff" />
          Change Inspector
        </h2>
        <div className="change-inspector__filters">
          <select
            className="filter-select"
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value as any)}
          >
            <option value="all">All Changes ({changes.length})</option>
            <option value="pending">
              Pending ({changes.filter((c) => c.status === 'pending').length})
            </option>
            <option value="approved">
              Approved ({changes.filter((c) => c.status === 'approved').length})
            </option>
            <option value="rejected">
              Rejected ({changes.filter((c) => c.status === 'rejected').length})
            </option>
          </select>
        </div>
      </div>

      <div className="change-inspector__content">
        <div className="change-list-panel">
          <VirtualList
            items={filteredChanges}
            rowHeight={90}
            renderItem={(change) => (
              <div className="change-list-item">
                <div className="change-list-item__header">
                  <i
                    className={`codicon codicon-${getChangeTypeIcon(change.changeType)}`}
                    style={{ color: getStatusColor(change.status) }}
                  />
                  <span className="change-list-item__file">{change.filePath}</span>
                  {change.isReversal && (
                    <span className="reversal-badge" title="This change reverses previous code">
                      <i className="codicon codicon-debug-reverse-continue" />
                      Reversal
                    </span>
                  )}
                </div>
                <div className="change-list-item__meta">
                  <span className="change-list-item__time">{formatTimestamp(change.timestamp)}</span>
                  <span className="change-list-item__stats">
                    <span className="stat stat--added">+{change.linesAdded}</span>
                    <span className="stat stat--removed">-{change.linesRemoved}</span>
                  </span>
                  {change.aiProvider && (
                    <span className="change-list-item__provider">
                      <i className="codicon codicon-robot" />
                      {change.aiProvider}
                    </span>
                  )}
                </div>
                {change.contradicts && change.contradicts.length > 0 && (
                  <div className="change-list-item__warning">
                    <i className="codicon codicon-warning" />
                    Contradicts {change.contradicts.length} previous change(s)
                  </div>
                )}
                <div className="change-list-item__status">
                  <span
                    className="status-badge"
                    style={{ color: getStatusColor(change.status) }}
                  >
                    {change.status}
                  </span>
                </div>
              </div>
            )}
            onItemClick={(change) => setSelectedChange(change)}
            selectedIndex={filteredChanges.findIndex((c) => c.id === selectedChange?.id)}
            emptyMessage="No changes to display"
          />
        </div>

        <div className="change-detail-panel">
          {selectedChange ? (
            <>
              <div className="change-detail__header">
                <div className="change-detail__title">
                  <i
                    className={`codicon codicon-${getChangeTypeIcon(selectedChange.changeType)}`}
                  />
                  <span>{selectedChange.filePath}</span>
                </div>
                <div className="change-detail__actions">
                  {selectedChange.status === 'pending' && (
                    <>
                      <Button
                        icon="check"
                        variant="primary"
                        onClick={() => handleApprove(selectedChange)}
                      >
                        Approve
                      </Button>
                      <Button
                        icon="close"
                        variant="danger"
                        onClick={() => handleReject(selectedChange)}
                      >
                        Reject
                      </Button>
                    </>
                  )}
                  {selectedChange.status === 'approved' && (
                    <span className="status-text status-text--success">
                      <i className="codicon codicon-check" />
                      Approved
                    </span>
                  )}
                  {selectedChange.status === 'rejected' && (
                    <span className="status-text status-text--error">
                      <i className="codicon codicon-close" />
                      Rejected
                    </span>
                  )}
                </div>
              </div>

              <div className="change-detail__info">
                <div className="info-item">
                  <span className="info-label">Time:</span>
                  <span className="info-value">{formatTimestamp(selectedChange.timestamp)}</span>
                </div>
                <div className="info-item">
                  <span className="info-label">Type:</span>
                  <span className="info-value">{selectedChange.changeType}</span>
                </div>
                <div className="info-item">
                  <span className="info-label">Lines:</span>
                  <span className="info-value">
                    <span className="stat stat--added">+{selectedChange.linesAdded}</span>
                    <span className="stat stat--removed">-{selectedChange.linesRemoved}</span>
                  </span>
                </div>
                {selectedChange.aiProvider && (
                  <div className="info-item">
                    <span className="info-label">AI Provider:</span>
                    <span className="info-value">{selectedChange.aiProvider}</span>
                  </div>
                )}
              </div>

              {selectedChange.conversationContext && (
                <div className="change-detail__context">
                  <h4>
                    <i className="codicon codicon-comment-discussion" />
                    Conversation Context
                  </h4>
                  <div className="context-text">{selectedChange.conversationContext}</div>
                </div>
              )}

              {selectedChange.isReversal && (
                <div className="change-detail__warning">
                  <i className="codicon codicon-warning" />
                  This change reverses previously written code, which may indicate backtracking or
                  uncertainty.
                </div>
              )}

              {selectedChange.contradicts && selectedChange.contradicts.length > 0 && (
                <div className="change-detail__warning">
                  <i className="codicon codicon-warning" />
                  This change contradicts {selectedChange.contradicts.length} previous change(s).
                  Review carefully to ensure consistency.
                </div>
              )}

              <div className="change-detail__diff">
                <DiffViewer hunks={selectedChange.diff} filePath={selectedChange.filePath} />
              </div>
            </>
          ) : (
            <div className="change-detail__empty">
              <i className="codicon codicon-diff" style={{ fontSize: 48, opacity: 0.3 }} />
              <p>Select a change to view details</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

const root = document.getElementById('root');
if (root) {
  ReactDOM.render(<ChangeInspector />, root);
}
