import Link from 'next/link'
import { CheckCircle, Terminal, Settings, Shield } from 'lucide-react'

export const metadata = {
  title: 'Getting Started - AI Supervisor Documentation',
  description: 'Learn how to install and configure AI Supervisor for VS Code in minutes.',
}

export default function GettingStarted() {
  return (
    <div className="bg-white">
      {/* Header */}
      <section className="bg-gradient-to-br from-primary-50 to-white py-16">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
          <Link href="/docs" className="text-primary-600 hover:underline mb-4 inline-block">
            ← Back to Documentation
          </Link>
          <h1 className="text-4xl sm:text-5xl font-bold text-gray-900 mb-4">
            Getting Started
          </h1>
          <p className="text-xl text-gray-600">
            Install and configure AI Supervisor in less than 5 minutes.
          </p>
        </div>
      </section>

      {/* Content */}
      <section className="py-16">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
          <div className="prose prose-lg max-w-none">
            {/* Installation */}
            <div id="installation" className="mb-16">
              <h2 className="text-3xl font-bold text-gray-900 mb-6 flex items-center">
                <Terminal className="h-8 w-8 text-primary-600 mr-3" />
                Installation
              </h2>

              <h3 className="text-2xl font-semibold text-gray-900 mb-4">Method 1: VS Code Marketplace (Recommended)</h3>
              <ol className="space-y-4 list-decimal list-inside text-gray-700">
                <li>Open VS Code</li>
                <li>Click on the Extensions icon in the sidebar (or press <code>Ctrl+Shift+X</code>)</li>
                <li>Search for "AI Supervisor"</li>
                <li>Click "Install" on the AI Supervisor extension</li>
                <li>Reload VS Code when prompted</li>
              </ol>

              <h3 className="text-2xl font-semibold text-gray-900 mb-4 mt-8">Method 2: Command Line</h3>
              <div className="bg-gray-900 text-gray-100 p-4 rounded-lg overflow-x-auto">
                <pre><code>code --install-extension ai-supervisor</code></pre>
              </div>

              <h3 className="text-2xl font-semibold text-gray-900 mb-4 mt-8">Method 3: Manual Installation</h3>
              <ol className="space-y-4 list-decimal list-inside text-gray-700">
                <li>Download the latest <code>.vsix</code> file from the <a href="https://github.com/ai-supervisor/releases" className="text-primary-600 hover:underline">GitHub releases page</a></li>
                <li>Open VS Code</li>
                <li>Go to Extensions → More Actions (⋯) → Install from VSIX</li>
                <li>Select the downloaded <code>.vsix</code> file</li>
              </ol>
            </div>

            {/* Initial Configuration */}
            <div id="configuration" className="mb-16">
              <h2 className="text-3xl font-bold text-gray-900 mb-6 flex items-center">
                <Settings className="h-8 w-8 text-primary-600 mr-3" />
                Initial Configuration
              </h2>

              <p className="text-gray-700 mb-6">
                After installation, AI Supervisor will automatically detect your AI coding assistants. Here's how to configure it:
              </p>

              <h3 className="text-2xl font-semibold text-gray-900 mb-4">1. Open Settings</h3>
              <p className="text-gray-700 mb-4">
                Press <code>Ctrl+,</code> (or <code>Cmd+,</code> on Mac) to open VS Code settings, then search for "AI Supervisor".
              </p>

              <h3 className="text-2xl font-semibold text-gray-900 mb-4">2. Configure Basic Settings</h3>
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-6 mb-6">
                <ul className="space-y-4 text-gray-700">
                  <li className="flex items-start">
                    <CheckCircle className="h-5 w-5 text-green-500 mr-2 mt-1 flex-shrink-0" />
                    <div>
                      <strong>Enable Monitoring:</strong> Turn on real-time AI monitoring (enabled by default)
                    </div>
                  </li>
                  <li className="flex items-start">
                    <CheckCircle className="h-5 w-5 text-green-500 mr-2 mt-1 flex-shrink-0" />
                    <div>
                      <strong>Notification Level:</strong> Choose when to show alerts (All, Important, Critical)
                    </div>
                  </li>
                  <li className="flex items-start">
                    <CheckCircle className="h-5 w-5 text-green-500 mr-2 mt-1 flex-shrink-0" />
                    <div>
                      <strong>Auto-Rollback:</strong> Enable automatic rollback on critical issues (Premium only)
                    </div>
                  </li>
                </ul>
              </div>

              <h3 className="text-2xl font-semibold text-gray-900 mb-4">3. Create Configuration File (Optional)</h3>
              <p className="text-gray-700 mb-4">
                For advanced configuration, create a <code>.aisupervisor.json</code> file in your project root:
              </p>
              <div className="bg-gray-900 text-gray-100 p-4 rounded-lg overflow-x-auto mb-6">
                <pre><code>{`{
  "enabled": true,
  "monitoring": {
    "realTime": true,
    "deviationDetection": true,
    "notificationLevel": "important"
  },
  "guardRails": {
    "protectedFiles": [
      "package.json",
      "tsconfig.json",
      ".env*"
    ],
    "protectedDirectories": [
      "node_modules/",
      ".git/"
    ]
  },
  "memory": {
    "historyDays": 30,
    "cloudSync": false
  }
}`}</code></pre>
              </div>
            </div>

            {/* Activation */}
            <div id="activation" className="mb-16">
              <h2 className="text-3xl font-bold text-gray-900 mb-6 flex items-center">
                <Shield className="h-8 w-8 text-primary-600 mr-3" />
                Activating Premium Features
              </h2>

              <p className="text-gray-700 mb-6">
                AI Supervisor is free to use with basic features. To unlock premium features:
              </p>

              <h3 className="text-2xl font-semibold text-gray-900 mb-4">Start Free Trial</h3>
              <ol className="space-y-4 list-decimal list-inside text-gray-700 mb-6">
                <li>Click the AI Supervisor icon in the VS Code sidebar</li>
                <li>Click "Start Premium Trial" button</li>
                <li>Sign in with your email (no credit card required)</li>
                <li>Enjoy 14 days of premium features</li>
              </ol>

              <h3 className="text-2xl font-semibold text-gray-900 mb-4">Activate License Key</h3>
              <p className="text-gray-700 mb-4">
                If you've purchased a premium license:
              </p>
              <ol className="space-y-4 list-decimal list-inside text-gray-700 mb-6">
                <li>Open the Command Palette (<code>Ctrl+Shift+P</code> or <code>Cmd+Shift+P</code>)</li>
                <li>Type "AI Supervisor: Activate License"</li>
                <li>Paste your license key</li>
                <li>Click "Activate"</li>
              </ol>

              <div className="bg-primary-50 border border-primary-200 rounded-lg p-6">
                <p className="text-primary-900">
                  <strong>Note:</strong> Your license can be activated on up to 3 machines. For team licenses, contact us at <a href="mailto:team@ai-supervisor.dev" className="text-primary-600 hover:underline">team@ai-supervisor.dev</a>
                </p>
              </div>
            </div>

            {/* First Project */}
            <div id="first-project" className="mb-16">
              <h2 className="text-3xl font-bold text-gray-900 mb-6">
                Setting Up Your First Project
              </h2>

              <h3 className="text-2xl font-semibold text-gray-900 mb-4">Step 1: Open Your Project</h3>
              <p className="text-gray-700 mb-6">
                Open any project in VS Code where you use AI coding assistants (GitHub Copilot, Cursor, etc.)
              </p>

              <h3 className="text-2xl font-semibold text-gray-900 mb-4">Step 2: Initialize AI Supervisor</h3>
              <ol className="space-y-4 list-decimal list-inside text-gray-700 mb-6">
                <li>Open the Command Palette (<code>Ctrl+Shift+P</code>)</li>
                <li>Type "AI Supervisor: Initialize Project"</li>
                <li>Follow the setup wizard to configure guard rails</li>
                <li>Choose files/directories to protect</li>
              </ol>

              <h3 className="text-2xl font-semibold text-gray-900 mb-4">Step 3: Test It Out</h3>
              <p className="text-gray-700 mb-4">
                Try using your AI assistant to make a change. You should see:
              </p>
              <ul className="space-y-2 list-disc list-inside text-gray-700 mb-6">
                <li>AI Supervisor monitoring panel showing the change</li>
                <li>Deviation analysis (if the change is unusual)</li>
                <li>Option to approve, reject, or modify the change</li>
              </ul>

              <div className="bg-gray-50 border border-gray-200 rounded-lg p-6">
                <p className="text-gray-700">
                  <strong>Pro Tip:</strong> Try making a change to a protected file (like package.json). AI Supervisor should alert you and ask for confirmation before allowing the change.
                </p>
              </div>
            </div>

            {/* Next Steps */}
            <div className="bg-gradient-to-r from-primary-50 to-accent-50 rounded-lg p-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Next Steps</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Link href="/docs/features" className="block p-4 bg-white rounded-lg hover:shadow-lg transition-shadow">
                  <h3 className="font-semibold text-gray-900 mb-2">Explore Features</h3>
                  <p className="text-sm text-gray-600">Learn about all features and capabilities</p>
                </Link>
                <Link href="/docs/api" className="block p-4 bg-white rounded-lg hover:shadow-lg transition-shadow">
                  <h3 className="font-semibold text-gray-900 mb-2">API Reference</h3>
                  <p className="text-sm text-gray-600">Dive into the technical documentation</p>
                </Link>
                <Link href="/docs/faq" className="block p-4 bg-white rounded-lg hover:shadow-lg transition-shadow">
                  <h3 className="font-semibold text-gray-900 mb-2">FAQ</h3>
                  <p className="text-sm text-gray-600">Find answers to common questions</p>
                </Link>
                <a href="https://github.com/ai-supervisor/examples" className="block p-4 bg-white rounded-lg hover:shadow-lg transition-shadow">
                  <h3 className="font-semibold text-gray-900 mb-2">Examples</h3>
                  <p className="text-sm text-gray-600">Check out example configurations</p>
                </a>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}
