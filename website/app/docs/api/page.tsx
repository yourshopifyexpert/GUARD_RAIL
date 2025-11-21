import Link from 'next/link'

export const metadata = {
  title: 'API Reference - AI Supervisor Documentation',
  description: 'Complete API documentation for AI Supervisor extension developers.',
}

export default function APIPage() {
  return (
    <div className="bg-white">
      {/* Header */}
      <section className="bg-gradient-to-br from-primary-50 to-white py-16">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
          <Link href="/docs" className="text-primary-600 hover:underline mb-4 inline-block">
            ← Back to Documentation
          </Link>
          <h1 className="text-4xl sm:text-5xl font-bold text-gray-900 mb-4">
            API Reference
          </h1>
          <p className="text-xl text-gray-600">
            Complete API documentation for developers building on AI Supervisor.
          </p>
        </div>
      </section>

      {/* Content */}
      <section className="py-16">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
          <div className="prose prose-lg max-w-none space-y-16">
            {/* Configuration API */}
            <div id="configuration">
              <h2 className="text-3xl font-bold text-gray-900 mb-6">Configuration API</h2>

              <h3 className="text-2xl font-semibold text-gray-900 mb-4">getConfiguration()</h3>
              <p className="text-gray-700 mb-4">Get the current AI Supervisor configuration.</p>
              <div className="bg-gray-900 text-gray-100 p-4 rounded-lg overflow-x-auto mb-6">
                <pre><code>{`import { aiSupervisor } from 'ai-supervisor';

const config = await aiSupervisor.getConfiguration();
console.log(config);
// {
//   enabled: true,
//   monitoring: { ... },
//   guardRails: { ... }
// }`}</code></pre>
              </div>

              <h3 className="text-2xl font-semibold text-gray-900 mb-4">updateConfiguration(config)</h3>
              <p className="text-gray-700 mb-4">Update AI Supervisor configuration programmatically.</p>
              <div className="bg-gray-900 text-gray-100 p-4 rounded-lg overflow-x-auto mb-6">
                <pre><code>{`await aiSupervisor.updateConfiguration({
  monitoring: {
    enabled: true,
    notificationLevel: 'important'
  }
});`}</code></pre>
              </div>
            </div>

            {/* Monitoring API */}
            <div id="monitoring-api">
              <h2 className="text-3xl font-bold text-gray-900 mb-6">Monitoring API</h2>

              <h3 className="text-2xl font-semibold text-gray-900 mb-4">onAIChange(callback)</h3>
              <p className="text-gray-700 mb-4">Subscribe to AI change events.</p>
              <div className="bg-gray-900 text-gray-100 p-4 rounded-lg overflow-x-auto mb-6">
                <pre><code>{`aiSupervisor.onAIChange((event) => {
  console.log('AI Change detected:', {
    file: event.file,
    type: event.type, // 'create' | 'modify' | 'delete'
    lines: event.changes,
    deviationScore: event.deviationScore,
    timestamp: event.timestamp
  });
});`}</code></pre>
              </div>

              <h3 className="text-2xl font-semibold text-gray-900 mb-4">getChangeHistory(options)</h3>
              <p className="text-gray-700 mb-4">Retrieve AI change history with optional filtering.</p>
              <div className="bg-gray-900 text-gray-100 p-4 rounded-lg overflow-x-auto mb-6">
                <pre><code>{`const history = await aiSupervisor.getChangeHistory({
  startDate: new Date('2024-01-01'),
  endDate: new Date(),
  file: 'src/app.ts',
  minDeviationScore: 50,
  limit: 100
});`}</code></pre>
              </div>
            </div>

            {/* Guard Rails API */}
            <div id="guardrails-api">
              <h2 className="text-3xl font-bold text-gray-900 mb-6">Guard Rails API</h2>

              <h3 className="text-2xl font-semibold text-gray-900 mb-4">addGuardRail(rule)</h3>
              <p className="text-gray-700 mb-4">Add a custom guard rail rule.</p>
              <div className="bg-gray-900 text-gray-100 p-4 rounded-lg overflow-x-auto mb-6">
                <pre><code>{`await aiSupervisor.addGuardRail({
  name: 'No direct DOM manipulation',
  pattern: 'document\\\\.(getElementById|querySelector)',
  files: ['src/**/*.ts'],
  severity: 'warning',
  message: 'Use React refs instead of direct DOM manipulation'
});`}</code></pre>
              </div>

              <h3 className="text-2xl font-semibold text-gray-900 mb-4">protectFiles(patterns)</h3>
              <p className="text-gray-700 mb-4">Add files to the protected list.</p>
              <div className="bg-gray-900 text-gray-100 p-4 rounded-lg overflow-x-auto mb-6">
                <pre><code>{`await aiSupervisor.protectFiles([
  'package.json',
  'tsconfig.json',
  '.env*'
]);`}</code></pre>
              </div>

              <h3 className="text-2xl font-semibold text-gray-900 mb-4">validateChange(change)</h3>
              <p className="text-gray-700 mb-4">Manually validate a change against guard rails.</p>
              <div className="bg-gray-900 text-gray-100 p-4 rounded-lg overflow-x-auto mb-6">
                <pre><code>{`const result = await aiSupervisor.validateChange({
  file: 'src/config.ts',
  content: 'const API_KEY = "abc123";',
  type: 'modify'
});

if (!result.valid) {
  console.error('Validation failed:', result.violations);
  // result.violations = [
  //   { rule: 'No hardcoded secrets', severity: 'error', ... }
  // ]
}`}</code></pre>
              </div>
            </div>

            {/* Rollback API */}
            <div id="rollback-api">
              <h2 className="text-3xl font-bold text-gray-900 mb-6">Rollback API</h2>

              <h3 className="text-2xl font-semibold text-gray-900 mb-4">rollback(changeId)</h3>
              <p className="text-gray-700 mb-4">Rollback a specific change by ID.</p>
              <div className="bg-gray-900 text-gray-100 p-4 rounded-lg overflow-x-auto mb-6">
                <pre><code>{`await aiSupervisor.rollback('change-abc-123');`}</code></pre>
              </div>

              <h3 className="text-2xl font-semibold text-gray-900 mb-4">rollbackToTime(timestamp)</h3>
              <p className="text-gray-700 mb-4">Rollback all changes to a specific point in time.</p>
              <div className="bg-gray-900 text-gray-100 p-4 rounded-lg overflow-x-auto mb-6">
                <pre><code>{`const timestamp = new Date('2024-01-15T10:00:00Z');
await aiSupervisor.rollbackToTime(timestamp);`}</code></pre>
              </div>
            </div>

            {/* Analytics API */}
            <div id="analytics-api">
              <h2 className="text-3xl font-bold text-gray-900 mb-6">Analytics API (Premium)</h2>

              <h3 className="text-2xl font-semibold text-gray-900 mb-4">getAnalytics(period)</h3>
              <p className="text-gray-700 mb-4">Get analytics for a specified period.</p>
              <div className="bg-gray-900 text-gray-100 p-4 rounded-lg overflow-x-auto mb-6">
                <pre><code>{`const analytics = await aiSupervisor.getAnalytics({
  period: 'last-30-days' // 'today' | 'last-7-days' | 'last-30-days' | 'all-time'
});

console.log(analytics);
// {
//   totalChanges: 1523,
//   acceptanceRate: 0.87,
//   averageDeviationScore: 23.4,
//   topFiles: [...],
//   deviationsDetected: 89,
//   rollbacksPerformed: 12
// }`}</code></pre>
              </div>

              <h3 className="text-2xl font-semibold text-gray-900 mb-4">exportAnalytics(format)</h3>
              <p className="text-gray-700 mb-4">Export analytics data in various formats.</p>
              <div className="bg-gray-900 text-gray-100 p-4 rounded-lg overflow-x-auto mb-6">
                <pre><code>{`const data = await aiSupervisor.exportAnalytics('csv');
// Returns CSV string of analytics data

await aiSupervisor.exportAnalytics('pdf', {
  filename: 'ai-supervisor-report.pdf',
  include: ['usage', 'deviations', 'quality']
});`}</code></pre>
              </div>
            </div>

            {/* Events */}
            <div id="events">
              <h2 className="text-3xl font-bold text-gray-900 mb-6">Event Reference</h2>

              <h3 className="text-2xl font-semibold text-gray-900 mb-4">Available Events</h3>
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-6 mb-6">
                <ul className="space-y-3 text-gray-700">
                  <li><code className="bg-gray-200 px-2 py-1 rounded">ai-change</code> - Fired when AI makes any change</li>
                  <li><code className="bg-gray-200 px-2 py-1 rounded">deviation-detected</code> - Fired when deviation exceeds threshold</li>
                  <li><code className="bg-gray-200 px-2 py-1 rounded">guard-rail-violation</code> - Fired when a guard rail is violated</li>
                  <li><code className="bg-gray-200 px-2 py-1 rounded">rollback-performed</code> - Fired after a rollback</li>
                  <li><code className="bg-gray-200 px-2 py-1 rounded">config-updated</code> - Fired when configuration changes</li>
                </ul>
              </div>

              <h3 className="text-2xl font-semibold text-gray-900 mb-4">Event Subscription</h3>
              <div className="bg-gray-900 text-gray-100 p-4 rounded-lg overflow-x-auto mb-6">
                <pre><code>{`// Subscribe to event
const unsubscribe = aiSupervisor.on('deviation-detected', (event) => {
  console.log('High deviation detected:', event);
  // Send alert, log to analytics, etc.
});

// Unsubscribe later
unsubscribe();`}</code></pre>
              </div>
            </div>

            {/* Types */}
            <div id="types">
              <h2 className="text-3xl font-bold text-gray-900 mb-6">TypeScript Types</h2>
              <div className="bg-gray-900 text-gray-100 p-4 rounded-lg overflow-x-auto mb-6">
                <pre><code>{`interface AIChange {
  id: string;
  file: string;
  type: 'create' | 'modify' | 'delete';
  changes: {
    linesAdded: number;
    linesRemoved: number;
    linesModified: number;
  };
  deviationScore: number;
  timestamp: Date;
  aiAssistant: string;
  approved: boolean;
}

interface GuardRail {
  name: string;
  pattern?: string;
  condition?: string;
  files: string[];
  severity: 'error' | 'warning' | 'info';
  message: string;
}

interface Configuration {
  enabled: boolean;
  monitoring: {
    realTime: boolean;
    deviationDetection: boolean;
    notificationLevel: 'all' | 'important' | 'critical';
  };
  guardRails: {
    protectedFiles: string[];
    protectedDirectories: string[];
    customRules: GuardRail[];
  };
  memory: {
    historyDays: number;
    cloudSync: boolean;
  };
}`}</code></pre>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}
