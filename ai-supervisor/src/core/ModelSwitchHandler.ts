import { ModelSwitchSummary, ConversationEntry, CodeChange, Goal } from '../types';
import { SupervisorDatabase } from '../storage/Database';

/**
 * Handles model switching and context preservation
 */
export class ModelSwitchHandler {
  private db: SupervisorDatabase;

  constructor(db: SupervisorDatabase) {
    this.db = db;
  }

  /**
   * Generate a comprehensive summary for model switching
   */
  generateSummary(activeGoals: Goal[]): ModelSwitchSummary {
    const recentConversations = this.db.getConversations(20);
    const recentChanges = this.db.getCodeChanges(undefined, 10);
    
    return {
      timestamp: new Date(),
      activeGoals,
      recentChanges,
      keyDecisions: this.extractKeyDecisions(recentConversations),
      currentContext: this.generateContextSummary(recentConversations, recentChanges),
      conversationSummary: this.summarizeConversations(recentConversations)
    };
  }

  /**
   * Extract key decisions from conversations
   */
  private extractKeyDecisions(conversations: ConversationEntry[]): string[] {
    const decisions: string[] = [];
    
    // Look for decision-related keywords in conversations
    const decisionKeywords = [
      'decided', 'choosing', 'selected', 'will use',
      'approach', 'strategy', 'architecture', 'design'
    ];

    for (const conv of conversations) {
      const content = conv.content.toLowerCase();
      const hasDecisionKeyword = decisionKeywords.some(keyword => 
        content.includes(keyword)
      );

      if (hasDecisionKeyword && conv.role === 'user') {
        // Extract the sentence containing the decision
        const sentences = conv.content.split(/[.!?]+/);
        for (const sentence of sentences) {
          const lower = sentence.toLowerCase();
          if (decisionKeywords.some(keyword => lower.includes(keyword))) {
            decisions.push(sentence.trim());
          }
        }
      }
    }

    return decisions.slice(0, 10); // Return top 10 decisions
  }

  /**
   * Generate a context summary from recent activity
   */
  private generateContextSummary(
    conversations: ConversationEntry[],
    changes: CodeChange[]
  ): string {
    let summary = 'Recent Activity Summary:\n\n';

    // Summarize conversations
    if (conversations.length > 0) {
      const userMessages = conversations.filter(c => c.role === 'user').length;
      const aiMessages = conversations.filter(c => c.role === 'assistant').length;
      summary += 'Conversation: ' + userMessages + ' user messages, ' + aiMessages + ' AI responses\n';
    }

    // Summarize code changes
    if (changes.length > 0) {
      const uniqueFiles = new Set(changes.map(c => c.filePath));
      summary += 'Code Changes: ' + changes.length + ' modifications across ' + uniqueFiles.size + ' files\n';
      summary += 'Modified files:\n';
      uniqueFiles.forEach(file => {
        summary += '  - ' + file + '\n';
      });
    }

    return summary;
  }

  /**
   * Summarize conversations for context preservation
   */
  private summarizeConversations(conversations: ConversationEntry[]): string {
    if (conversations.length === 0) {
      return 'No recent conversation history.';
    }

    let summary = 'Recent Conversation Context:\n\n';
    
    // Get last few exchanges
    const recentExchanges = conversations.slice(0, 10);
    
    for (const conv of recentExchanges) {
      const role = conv.role.toUpperCase();
      const preview = conv.content.substring(0, 150);
      const truncated = conv.content.length > 150 ? '...' : '';
      summary += role + ': ' + preview + truncated + '\n\n';
    }

    return summary;
  }

  /**
   * Export summary as JSON
   */
  exportSummaryJSON(summary: ModelSwitchSummary): string {
    return JSON.stringify(summary, null, 2);
  }

  /**
   * Export summary as markdown
   */
  exportSummaryMarkdown(summary: ModelSwitchSummary): string {
    let md = '# AI Model Switch Summary\n\n';
    md += 'Generated: ' + summary.timestamp.toISOString() + '\n\n';

    md += '## Active Goals\n\n';
    for (const goal of summary.activeGoals) {
      md += '### ' + goal.title + '\n\n';
      md += goal.description + '\n\n';
      if (goal.constraints.length > 0) {
        md += '**Constraints:**\n';
        goal.constraints.forEach(c => md += '- ' + c + '\n');
        md += '\n';
      }
      if (goal.scope.length > 0) {
        md += '**Scope:**\n';
        goal.scope.forEach(s => md += '- ' + s + '\n');
        md += '\n';
      }
    }

    md += '## Key Decisions\n\n';
    summary.keyDecisions.forEach(decision => {
      md += '- ' + decision + '\n';
    });
    md += '\n';

    md += '## Recent Changes\n\n';
    for (const change of summary.recentChanges) {
      md += '### ' + change.filePath + '\n\n';
      if (change.reason) {
        md += '*Reason:* ' + change.reason + '\n\n';
      }
      md += '```diff\n' + change.diff + '\n```\n\n';
    }

    md += '## Current Context\n\n';
    md += summary.currentContext + '\n\n';

    md += '## Conversation Summary\n\n';
    md += summary.conversationSummary + '\n';

    return md;
  }
}
