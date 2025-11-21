import Link from 'next/link'
import { BookOpen, Rocket, Code, HelpCircle, Shield, Zap, AlertTriangle, Settings } from 'lucide-react'

export const metadata = {
  title: 'Documentation - AI Supervisor',
  description: 'Complete documentation for AI Supervisor - installation, features, API reference, and more.',
}

export default function DocsPage() {
  return (
    <div className="bg-white">
      {/* Header */}
      <section className="bg-gradient-to-br from-primary-50 to-white py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <h1 className="text-4xl sm:text-5xl font-bold text-gray-900 mb-4">
            Documentation
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl">
            Everything you need to know about installing, configuring, and using AI Supervisor.
          </p>
        </div>
      </section>

      {/* Quick Start */}
      <section className="py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Link
              href="/docs/getting-started"
              className="bg-white border-2 border-gray-200 rounded-lg p-6 hover:border-primary-500 hover:shadow-lg transition-all"
            >
              <Rocket className="h-10 w-10 text-primary-600 mb-4" />
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Getting Started</h3>
              <p className="text-gray-600 text-sm">
                Install and configure AI Supervisor in minutes.
              </p>
            </Link>

            <Link
              href="/docs/features"
              className="bg-white border-2 border-gray-200 rounded-lg p-6 hover:border-primary-500 hover:shadow-lg transition-all"
            >
              <Shield className="h-10 w-10 text-primary-600 mb-4" />
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Features</h3>
              <p className="text-gray-600 text-sm">
                Deep dive into all features and capabilities.
              </p>
            </Link>

            <Link
              href="/docs/api"
              className="bg-white border-2 border-gray-200 rounded-lg p-6 hover:border-primary-500 hover:shadow-lg transition-all"
            >
              <Code className="h-10 w-10 text-primary-600 mb-4" />
              <h3 className="text-xl font-semibold text-gray-900 mb-2">API Reference</h3>
              <p className="text-gray-600 text-sm">
                Complete API documentation for developers.
              </p>
            </Link>

            <Link
              href="/docs/faq"
              className="bg-white border-2 border-gray-200 rounded-lg p-6 hover:border-primary-500 hover:shadow-lg transition-all"
            >
              <HelpCircle className="h-10 w-10 text-primary-600 mb-4" />
              <h3 className="text-xl font-semibold text-gray-900 mb-2">FAQ</h3>
              <p className="text-gray-600 text-sm">
                Answers to frequently asked questions.
              </p>
            </Link>
          </div>
        </div>
      </section>

      {/* Detailed Topics */}
      <section className="bg-gray-50 py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-gray-900 mb-8">Documentation Topics</h2>

          <div className="space-y-8">
            {/* Installation & Setup */}
            <div className="bg-white rounded-lg p-6 shadow-sm">
              <h3 className="text-2xl font-semibold text-gray-900 mb-4 flex items-center">
                <Rocket className="h-6 w-6 text-primary-600 mr-2" />
                Installation & Setup
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Link href="/docs/getting-started#installation" className="text-primary-600 hover:underline">
                  Installing the Extension
                </Link>
                <Link href="/docs/getting-started#configuration" className="text-primary-600 hover:underline">
                  Initial Configuration
                </Link>
                <Link href="/docs/getting-started#activation" className="text-primary-600 hover:underline">
                  Activating Premium Features
                </Link>
                <Link href="/docs/getting-started#first-project" className="text-primary-600 hover:underline">
                  Setting Up Your First Project
                </Link>
              </div>
            </div>

            {/* Core Features */}
            <div className="bg-white rounded-lg p-6 shadow-sm">
              <h3 className="text-2xl font-semibold text-gray-900 mb-4 flex items-center">
                <Shield className="h-6 w-6 text-primary-600 mr-2" />
                Core Features
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Link href="/docs/features#monitoring" className="text-primary-600 hover:underline">
                  Real-Time Monitoring
                </Link>
                <Link href="/docs/features#deviation" className="text-primary-600 hover:underline">
                  Deviation Detection
                </Link>
                <Link href="/docs/features#guard-rails" className="text-primary-600 hover:underline">
                  Custom Guard Rails
                </Link>
                <Link href="/docs/features#rollback" className="text-primary-600 hover:underline">
                  Automatic Rollback
                </Link>
                <Link href="/docs/features#memory" className="text-primary-600 hover:underline">
                  Memory & History
                </Link>
                <Link href="/docs/features#analytics" className="text-primary-600 hover:underline">
                  Analytics Dashboard
                </Link>
              </div>
            </div>

            {/* Advanced Configuration */}
            <div className="bg-white rounded-lg p-6 shadow-sm">
              <h3 className="text-2xl font-semibold text-gray-900 mb-4 flex items-center">
                <Settings className="h-6 w-6 text-primary-600 mr-2" />
                Advanced Configuration
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Link href="/docs/features#custom-rules" className="text-primary-600 hover:underline">
                  Creating Custom Rules
                </Link>
                <Link href="/docs/features#file-protection" className="text-primary-600 hover:underline">
                  Protected Files & Directories
                </Link>
                <Link href="/docs/features#team-settings" className="text-primary-600 hover:underline">
                  Team Collaboration Settings
                </Link>
                <Link href="/docs/features#integrations" className="text-primary-600 hover:underline">
                  AI Assistant Integrations
                </Link>
              </div>
            </div>

            {/* Troubleshooting */}
            <div className="bg-white rounded-lg p-6 shadow-sm">
              <h3 className="text-2xl font-semibold text-gray-900 mb-4 flex items-center">
                <AlertTriangle className="h-6 w-6 text-primary-600 mr-2" />
                Troubleshooting
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Link href="/docs/faq#common-issues" className="text-primary-600 hover:underline">
                  Common Issues
                </Link>
                <Link href="/docs/faq#performance" className="text-primary-600 hover:underline">
                  Performance Optimization
                </Link>
                <Link href="/docs/faq#compatibility" className="text-primary-600 hover:underline">
                  Compatibility Issues
                </Link>
                <Link href="/docs/faq#support" className="text-primary-600 hover:underline">
                  Getting Support
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Need Help */}
      <section className="py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">Need Help?</h2>
          <p className="text-xl text-gray-600 mb-8">
            Can't find what you're looking for? We're here to help.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              href="/docs/faq"
              className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-lg text-white bg-primary-600 hover:bg-primary-700 transition-colors"
            >
              View FAQ
            </Link>
            <a
              href="mailto:support@ai-supervisor.dev"
              className="inline-flex items-center px-6 py-3 border-2 border-gray-300 text-base font-medium rounded-lg text-gray-700 bg-white hover:bg-gray-50 transition-colors"
            >
              Contact Support
            </a>
          </div>
        </div>
      </section>
    </div>
  )
}
