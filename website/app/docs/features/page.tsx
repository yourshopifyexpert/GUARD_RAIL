import Link from 'next/link'

export const metadata = {
  title: 'Features - AI Supervisor Documentation',
  description: 'Complete guide to all AI Supervisor features and capabilities.',
}

export default function FeaturesPage() {
  return (
    <div className="bg-white">
      {/* Header */}
      <section className="bg-gradient-to-br from-primary-50 to-white py-16">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
          <Link href="/docs" className="text-primary-600 hover:underline mb-4 inline-block">
            ← Back to Documentation
          </Link>
          <h1 className="text-4xl sm:text-5xl font-bold text-gray-900 mb-4">
            Features
          </h1>
          <p className="text-xl text-gray-600">
            Deep dive into all AI Supervisor features and capabilities.
          </p>
        </div>
      </section>

      {/* Content */}
      <section className="py-16">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
          <div className="prose prose-lg max-w-none space-y-16">
            {/* Real-Time Monitoring */}
            <div id="monitoring">
              <h2 className="text-3xl font-bold text-gray-900 mb-6">Real-Time Monitoring</h2>
              <p className="text-gray-700 mb-4">
                AI Supervisor continuously monitors all changes made by AI coding assistants in your workspace.
              </p>

              <h3 className="text-2xl font-semibold text-gray-900 mb-4">What Gets Monitored</h3>
              <ul className="space-y-2 text-gray-700 list-disc list-inside mb-6">
                <li>File creations, modifications, and deletions</li>
                <li>Code suggestions and completions</li>
                <li>Refactoring operations</li>
                <li>Package and dependency changes</li>
                <li>Configuration file updates</li>
              </ul>

              <h3 className="text-2xl font-semibold text-gray-900 mb-4">Monitoring Panel</h3>
              <p className="text-gray-700 mb-4">
                The monitoring panel shows a real-time feed of all AI activity:
              </p>
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-6 mb-6">
                <ul className="space-y-2 text-gray-700 list-disc list-inside">
                  <li>Timestamp of each change</li>
                  <li>File path affected</li>
                  <li>Type of change (create, modify, delete)</li>
                  <li>Lines added/removed/modified</li>
                  <li>Risk level (low, medium, high)</li>
                </ul>
              </div>

              <h3 className="text-2xl font-semibold text-gray-900 mb-4">Configuration</h3>
              <div className="bg-gray-900 text-gray-100 p-4 rounded-lg overflow-x-auto mb-6">
                <pre><code>{`{
  "monitoring": {
    "enabled": true,
    "realTime": true,
    "trackFileChanges": true,
    "trackSuggestions": true,
    "ignorePatterns": [
      "**/node_modules/**",
      "**/.git/**",
      "**/dist/**"
    ]
  }
}`}</code></pre>
              </div>
            </div>

            {/* Deviation Detection */}
            <div id="deviation">
              <h2 className="text-3xl font-bold text-gray-900 mb-6">Deviation Detection</h2>
              <p className="text-gray-700 mb-4">
                AI Supervisor learns your project's patterns and detects when AI suggestions deviate from established norms.
              </p>

              <h3 className="text-2xl font-semibold text-gray-900 mb-4">How It Works</h3>
              <ol className="space-y-4 list-decimal list-inside text-gray-700 mb-6">
                <li><strong>Learning Phase:</strong> AI Supervisor analyzes your existing codebase to understand patterns, coding style, and architecture</li>
                <li><strong>Pattern Matching:</strong> Each AI suggestion is compared against learned patterns</li>
                <li><strong>Deviation Scoring:</strong> Changes are scored based on how much they deviate (0-100 scale)</li>
                <li><strong>Smart Alerts:</strong> High-deviation changes trigger alerts for review</li>
              </ol>

              <h3 className="text-2xl font-semibold text-gray-900 mb-4">What Gets Detected</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                  <h4 className="font-semibold text-red-900 mb-2">High-Risk Deviations</h4>
                  <ul className="text-sm text-red-800 space-y-1 list-disc list-inside">
                    <li>Breaking API changes</li>
                    <li>Security vulnerabilities</li>
                    <li>Architectural violations</li>
                    <li>Critical file modifications</li>
                  </ul>
                </div>
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                  <h4 className="font-semibold text-yellow-900 mb-2">Medium-Risk Deviations</h4>
                  <ul className="text-sm text-yellow-800 space-y-1 list-disc list-inside">
                    <li>Coding style inconsistencies</li>
                    <li>Naming convention changes</li>
                    <li>Dependency updates</li>
                    <li>New pattern introductions</li>
                  </ul>
                </div>
              </div>

              <h3 className="text-2xl font-semibold text-gray-900 mb-4">Premium: AI-Powered Detection</h3>
              <p className="text-gray-700 mb-4">
                Premium tier uses advanced AI to detect semantic deviations:
              </p>
              <ul className="space-y-2 text-gray-700 list-disc list-inside mb-6">
                <li>Intent analysis (is this change doing what it claims?)</li>
                <li>Side-effect detection (unintended consequences)</li>
                <li>Cross-file impact analysis</li>
                <li>Historical pattern learning</li>
              </ul>
            </div>

            {/* Guard Rails */}
            <div id="guard-rails">
              <h2 className="text-3xl font-bold text-gray-900 mb-6">Custom Guard Rails</h2>
              <p className="text-gray-700 mb-4">
                Define rules and constraints to prevent AI from making certain types of changes.
              </p>

              <h3 className="text-2xl font-semibold text-gray-900 mb-4">Protected Files</h3>
              <p className="text-gray-700 mb-4">
                Prevent AI from modifying critical files without explicit approval:
              </p>
              <div className="bg-gray-900 text-gray-100 p-4 rounded-lg overflow-x-auto mb-6">
                <pre><code>{`{
  "guardRails": {
    "protectedFiles": [
      "package.json",
      "package-lock.json",
      "tsconfig.json",
      ".env*",
      "docker-compose.yml",
      "Dockerfile"
    ],
    "requireApproval": true,
    "allowRead": true
  }
}`}</code></pre>
              </div>

              <h3 className="text-2xl font-semibold text-gray-900 mb-4">Custom Rules</h3>
              <p className="text-gray-700 mb-4">
                Create custom rules using simple JavaScript expressions:
              </p>
              <div className="bg-gray-900 text-gray-100 p-4 rounded-lg overflow-x-auto mb-6">
                <pre><code>{`{
  "guardRails": {
    "customRules": [
      {
        "name": "No console.log in production",
        "pattern": "console\\\\.log",
        "files": ["src/**/*.ts", "src/**/*.js"],
        "severity": "error",
        "message": "Remove console.log before committing"
      },
      {
        "name": "Require tests for new features",
        "condition": "newFile && !file.includes('.test.')",
        "severity": "warning",
        "message": "Consider adding tests for this new file"
      }
    ]
  }
}`}</code></pre>
              </div>
            </div>

            {/* Automatic Rollback */}
            <div id="rollback">
              <h2 className="text-3xl font-bold text-gray-900 mb-6">Automatic Rollback (Premium)</h2>
              <p className="text-gray-700 mb-4">
                Automatically undo AI changes that violate guard rails or exceed deviation thresholds.
              </p>

              <h3 className="text-2xl font-semibold text-gray-900 mb-4">Rollback Triggers</h3>
              <ul className="space-y-2 text-gray-700 list-disc list-inside mb-6">
                <li>Deviation score exceeds configured threshold (default: 80)</li>
                <li>Protected file modification without approval</li>
                <li>Custom rule violation marked as "error"</li>
                <li>Syntax errors introduced</li>
                <li>Breaking test failures</li>
              </ul>

              <h3 className="text-2xl font-semibold text-gray-900 mb-4">Configuration</h3>
              <div className="bg-gray-900 text-gray-100 p-4 rounded-lg overflow-x-auto mb-6">
                <pre><code>{`{
  "rollback": {
    "automatic": true,
    "deviationThreshold": 80,
    "confirmBeforeRollback": true,
    "createBackup": true,
    "notifyUser": true
  }
}`}</code></pre>
              </div>
            </div>

            {/* Memory & History */}
            <div id="memory">
              <h2 className="text-3xl font-bold text-gray-900 mb-6">Memory & History</h2>
              <p className="text-gray-700 mb-4">
                AI Supervisor maintains a detailed history of all AI interactions and changes.
              </p>

              <h3 className="text-2xl font-semibold text-gray-900 mb-4">Free Tier</h3>
              <ul className="space-y-2 text-gray-700 list-disc list-inside mb-6">
                <li>30-day local history</li>
                <li>Single project support</li>
                <li>Basic search and filtering</li>
              </ul>

              <h3 className="text-2xl font-semibold text-gray-900 mb-4">Premium Tier</h3>
              <ul className="space-y-2 text-gray-700 list-disc list-inside mb-6">
                <li>Unlimited cloud-synced history</li>
                <li>Multi-project support</li>
                <li>Advanced search and analytics</li>
                <li>Export to JSON, CSV, or PDF</li>
                <li>Time-travel debugging (view project state at any point)</li>
              </ul>
            </div>

            {/* Analytics */}
            <div id="analytics">
              <h2 className="text-3xl font-bold text-gray-900 mb-6">Analytics Dashboard (Premium)</h2>
              <p className="text-gray-700 mb-4">
                Gain insights into AI usage patterns and code quality trends.
              </p>

              <h3 className="text-2xl font-semibold text-gray-900 mb-4">Metrics Tracked</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                <div className="bg-primary-50 border border-primary-200 rounded-lg p-4">
                  <h4 className="font-semibold text-primary-900 mb-2">Usage Metrics</h4>
                  <ul className="text-sm text-primary-800 space-y-1 list-disc list-inside">
                    <li>AI suggestions per day/week/month</li>
                    <li>Acceptance vs rejection rate</li>
                    <li>Most active files/directories</li>
                    <li>Peak usage times</li>
                  </ul>
                </div>
                <div className="bg-accent-50 border border-accent-200 rounded-lg p-4">
                  <h4 className="font-semibold text-accent-900 mb-2">Quality Metrics</h4>
                  <ul className="text-sm text-accent-800 space-y-1 list-disc list-inside">
                    <li>Average deviation scores</li>
                    <li>Hallucinations caught</li>
                    <li>Rollbacks performed</li>
                    <li>Code quality trends</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}
