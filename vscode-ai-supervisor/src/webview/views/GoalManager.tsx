import React, { useState, useEffect } from 'react';
import ReactDOM from 'react-dom';
import {
  ProjectGoal,
  GoalStatus,
  GoalTemplate,
  MessageType,
  PremiumStatus,
} from '../types';
import { vscodeApi } from '../utils/vscode';
import { applyVSCodeStyles } from '../utils/theme';
import { Button } from '../shared/Button';
import { VirtualList } from '../shared/VirtualList';
import './GoalManager.css';

const GOAL_TEMPLATES: GoalTemplate[] = [
  {
    id: 'rest-api',
    name: 'Build REST API',
    description: 'Create a RESTful API with proper routing, validation, and error handling',
    defaultPriority: 'high',
    suggestedTags: ['backend', 'api', 'architecture'],
  },
  {
    id: 'refactor-performance',
    name: 'Performance Refactoring',
    description: 'Optimize code for better performance and efficiency',
    defaultPriority: 'medium',
    suggestedTags: ['refactoring', 'performance', 'optimization'],
  },
  {
    id: 'add-tests',
    name: 'Add Unit Tests',
    description: 'Implement comprehensive unit tests with good coverage',
    defaultPriority: 'high',
    suggestedTags: ['testing', 'quality', 'ci-cd'],
  },
  {
    id: 'ui-component',
    name: 'Build UI Component',
    description: 'Create a reusable, accessible UI component',
    defaultPriority: 'medium',
    suggestedTags: ['frontend', 'ui', 'component'],
  },
  {
    id: 'documentation',
    name: 'Write Documentation',
    description: 'Document code, APIs, and usage examples',
    defaultPriority: 'low',
    suggestedTags: ['documentation', 'readme', 'guides'],
  },
];

const GoalManager: React.FC = () => {
  const [goals, setGoals] = useState<ProjectGoal[]>([]);
  const [selectedGoal, setSelectedGoal] = useState<ProjectGoal | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [showTemplates, setShowTemplates] = useState(false);
  const [premiumStatus, setPremiumStatus] = useState<PremiumStatus>({ isActive: false, features: [], tier: 'free' });

  // Form state
  const [formData, setFormData] = useState<Partial<ProjectGoal>>({
    title: '',
    description: '',
    status: GoalStatus.ACTIVE,
    priority: 'medium',
    tags: [],
  });

  useEffect(() => {
    applyVSCodeStyles();
    vscodeApi.postMessage(MessageType.REQUEST_GOALS);

    const unsubscribe = vscodeApi.onMessage(MessageType.GOALS_RESPONSE, (payload: ProjectGoal[]) => {
      setGoals(payload);
    });

    const unsubscribeUpdate = vscodeApi.onMessage(MessageType.GOALS_UPDATE, (payload: ProjectGoal[]) => {
      setGoals(payload);
    });

    const unsubscribePremium = vscodeApi.onMessage(MessageType.PREMIUM_STATUS_UPDATE, (payload: PremiumStatus) => {
      setPremiumStatus(payload);
    });

    return () => {
      unsubscribe();
      unsubscribeUpdate();
      unsubscribePremium();
    };
  }, []);

  const handleAddGoal = () => {
    setIsEditing(true);
    setSelectedGoal(null);
    setFormData({
      title: '',
      description: '',
      status: GoalStatus.ACTIVE,
      priority: 'medium',
      tags: [],
    });
  };

  const handleEditGoal = (goal: ProjectGoal) => {
    setIsEditing(true);
    setSelectedGoal(goal);
    setFormData(goal);
  };

  const handleSaveGoal = () => {
    if (!formData.title?.trim()) {
      alert('Please enter a goal title');
      return;
    }

    const goal: ProjectGoal = {
      id: selectedGoal?.id || `goal-${Date.now()}`,
      title: formData.title,
      description: formData.description || '',
      status: formData.status || GoalStatus.ACTIVE,
      priority: formData.priority || 'medium',
      tags: formData.tags || [],
      createdAt: selectedGoal?.createdAt || Date.now(),
      updatedAt: Date.now(),
    };

    if (selectedGoal) {
      vscodeApi.postMessage(MessageType.UPDATE_GOAL, goal);
    } else {
      vscodeApi.postMessage(MessageType.ADD_GOAL, goal);
    }

    setIsEditing(false);
    setSelectedGoal(null);
  };

  const handleDeleteGoal = (goalId: string) => {
    if (confirm('Are you sure you want to delete this goal?')) {
      vscodeApi.postMessage(MessageType.DELETE_GOAL, { id: goalId });
    }
  };

  const handleUseTemplate = (template: GoalTemplate) => {
    setIsEditing(true);
    setSelectedGoal(null);
    setFormData({
      title: template.name,
      description: template.description,
      status: GoalStatus.ACTIVE,
      priority: template.defaultPriority,
      tags: template.suggestedTags,
    });
    setShowTemplates(false);
  };

  const handleTagInput = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      const input = e.currentTarget;
      const tag = input.value.trim();
      if (tag && !formData.tags?.includes(tag)) {
        setFormData({ ...formData, tags: [...(formData.tags || []), tag] });
        input.value = '';
      }
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setFormData({
      ...formData,
      tags: formData.tags?.filter((tag) => tag !== tagToRemove),
    });
  };

  const getAlignmentColor = (alignment?: number): string => {
    if (!alignment) return 'var(--vscode-descriptionForeground)';
    if (alignment >= 80) return 'var(--vscode-testing-iconPassed)';
    if (alignment >= 60) return 'var(--vscode-testing-iconQueued)';
    return 'var(--vscode-testing-iconFailed)';
  };

  const activeGoals = goals.filter((g) => g.status === GoalStatus.ACTIVE);
  const completedGoals = goals.filter((g) => g.status === GoalStatus.COMPLETED);
  const pausedGoals = goals.filter((g) => g.status === GoalStatus.PAUSED);

  return (
    <div className="goal-manager">
      <div className="goal-manager__header">
        <h2 className="goal-manager__title">
          <i className="codicon codicon-target" />
          Project Goals
        </h2>
        <div className="goal-manager__actions">
          <Button icon="library" onClick={() => setShowTemplates(!showTemplates)}>
            Templates
          </Button>
          <Button icon="add" variant="primary" onClick={handleAddGoal}>
            New Goal
          </Button>
        </div>
      </div>

      {showTemplates && (
        <div className="goal-templates">
          <h3>Quick Start Templates</h3>
          <div className="goal-templates__list">
            {GOAL_TEMPLATES.map((template) => (
              <div key={template.id} className="template-card" onClick={() => handleUseTemplate(template)}>
                <div className="template-card__title">{template.name}</div>
                <div className="template-card__description">{template.description}</div>
                <div className="template-card__tags">
                  {template.suggestedTags.map((tag) => (
                    <span key={tag} className="tag">
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {isEditing ? (
        <div className="goal-editor">
          <div className="goal-editor__header">
            <h3>{selectedGoal ? 'Edit Goal' : 'New Goal'}</h3>
            <Button icon="close" onClick={() => setIsEditing(false)} />
          </div>

          <div className="goal-editor__form">
            <div className="form-group">
              <label htmlFor="goal-title">Title *</label>
              <input
                id="goal-title"
                type="text"
                className="form-input"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="What do you want to achieve?"
                autoFocus
              />
            </div>

            <div className="form-group">
              <label htmlFor="goal-description">Description</label>
              <textarea
                id="goal-description"
                className="form-textarea"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Provide details about this goal..."
                rows={4}
              />
            </div>

            <div className="form-row">
              <div className="form-group">
                <label htmlFor="goal-priority">Priority</label>
                <select
                  id="goal-priority"
                  className="form-select"
                  value={formData.priority}
                  onChange={(e) => setFormData({ ...formData, priority: e.target.value as any })}
                >
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                </select>
              </div>

              <div className="form-group">
                <label htmlFor="goal-status">Status</label>
                <select
                  id="goal-status"
                  className="form-select"
                  value={formData.status}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value as GoalStatus })}
                >
                  <option value={GoalStatus.ACTIVE}>Active</option>
                  <option value={GoalStatus.PAUSED}>Paused</option>
                  <option value={GoalStatus.COMPLETED}>Completed</option>
                </select>
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="goal-tags">Tags</label>
              <div className="tag-input">
                {formData.tags?.map((tag) => (
                  <span key={tag} className="tag tag--removable">
                    {tag}
                    <i className="codicon codicon-close" onClick={() => handleRemoveTag(tag)} />
                  </span>
                ))}
                <input
                  id="goal-tags"
                  type="text"
                  className="tag-input__field"
                  placeholder="Add tags (press Enter)"
                  onKeyDown={handleTagInput}
                />
              </div>
            </div>

            <div className="goal-editor__actions">
              <Button variant="secondary" onClick={() => setIsEditing(false)}>
                Cancel
              </Button>
              <Button variant="primary" onClick={handleSaveGoal}>
                {selectedGoal ? 'Update' : 'Create'} Goal
              </Button>
            </div>
          </div>
        </div>
      ) : (
        <div className="goal-list">
          {activeGoals.length > 0 && (
            <div className="goal-section">
              <h3 className="goal-section__title">
                <i className="codicon codicon-play" />
                Active Goals ({activeGoals.length})
              </h3>
              <div className="goal-cards">
                {activeGoals.map((goal) => (
                  <div key={goal.id} className="goal-card">
                    <div className="goal-card__header">
                      <span className={`priority-badge priority-badge--${goal.priority}`}>
                        {goal.priority}
                      </span>
                      {goal.alignment !== undefined && (
                        <div className="alignment-indicator" style={{ color: getAlignmentColor(goal.alignment) }}>
                          <i className="codicon codicon-target" />
                          {goal.alignment}%
                        </div>
                      )}
                    </div>
                    <h4 className="goal-card__title">{goal.title}</h4>
                    <p className="goal-card__description">{goal.description}</p>
                    {goal.tags && goal.tags.length > 0 && (
                      <div className="goal-card__tags">
                        {goal.tags.map((tag) => (
                          <span key={tag} className="tag">
                            {tag}
                          </span>
                        ))}
                      </div>
                    )}
                    <div className="goal-card__actions">
                      <Button icon="edit" onClick={() => handleEditGoal(goal)}>
                        Edit
                      </Button>
                      <Button icon="trash" variant="danger" onClick={() => handleDeleteGoal(goal.id)}>
                        Delete
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {pausedGoals.length > 0 && (
            <div className="goal-section">
              <h3 className="goal-section__title">
                <i className="codicon codicon-debug-pause" />
                Paused Goals ({pausedGoals.length})
              </h3>
              <div className="goal-cards">
                {pausedGoals.map((goal) => (
                  <div key={goal.id} className="goal-card goal-card--paused">
                    <h4 className="goal-card__title">{goal.title}</h4>
                    <p className="goal-card__description">{goal.description}</p>
                    <div className="goal-card__actions">
                      <Button icon="edit" onClick={() => handleEditGoal(goal)}>
                        Edit
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {completedGoals.length > 0 && (
            <div className="goal-section">
              <h3 className="goal-section__title">
                <i className="codicon codicon-pass" />
                Completed Goals ({completedGoals.length})
              </h3>
              <div className="goal-cards">
                {completedGoals.map((goal) => (
                  <div key={goal.id} className="goal-card goal-card--completed">
                    <h4 className="goal-card__title">{goal.title}</h4>
                    <p className="goal-card__description">{goal.description}</p>
                    <div className="goal-card__actions">
                      <Button icon="trash" variant="danger" onClick={() => handleDeleteGoal(goal.id)}>
                        Delete
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {goals.length === 0 && (
            <div className="goal-list__empty">
              <i className="codicon codicon-target" style={{ fontSize: 48, opacity: 0.3 }} />
              <h3>No goals defined yet</h3>
              <p>Define your project goals to help AI Supervisor detect deviations and keep AI on track.</p>
              <Button icon="add" variant="primary" onClick={handleAddGoal}>
                Create Your First Goal
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

const root = document.getElementById('root');
if (root) {
  ReactDOM.render(<GoalManager />, root);
}
