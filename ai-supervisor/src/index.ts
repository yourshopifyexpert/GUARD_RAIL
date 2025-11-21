/**
 * AI Supervisor - Core Engine
 * 
 * A comprehensive AI supervision and memory engine for monitoring AI agent behavior,
 * tracking conversation context, detecting goal deviations, preventing code reversals,
 * and enabling active intervention.
 */

export { SupervisorAPI } from './api/SupervisorAPI';
export { SupervisorDatabase } from './storage/Database';
export { MemoryEngine } from './core/MemoryEngine';
export { GoalTracker } from './core/GoalTracker';
export { DeviationDetector } from './core/DeviationDetector';
export { InterventionManager } from './core/InterventionManager';
export { ModelSwitchHandler } from './core/ModelSwitchHandler';
export { CodeDiffer } from './analysis/CodeDiffer';
export { ReversalDetector } from './analysis/ReversalDetector';
export { ScopeValidator } from './analysis/ScopeValidator';

export * from './types';
