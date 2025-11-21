'use client'

import Link from 'next/link'
import { Shield, Eye, AlertTriangle, Lock, Zap, Users, CheckCircle, ArrowRight } from 'lucide-react'

export default function Home() {
  return (
    <>
      {/* Hero Section */}
      <section className="relative bg-gradient-to-br from-primary-50 via-white to-accent-50 overflow-hidden">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-20 sm:py-32">
          <div className="text-center">
            <h1 className="text-4xl font-bold tracking-tight text-gray-900 sm:text-6xl animate-fade-in">
              Stop AI From Breaking
              <br />
              <span className="text-primary-600">Your Code</span>
            </h1>
            <p className="mt-6 text-lg sm:text-xl leading-8 text-gray-600 max-w-3xl mx-auto">
              AI Supervisor monitors and validates every change AI coding assistants make to your codebase.
              Prevent hallucinations, catch errors early, and maintain control over your projects.
            </p>
            <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
              <a
                href="https://marketplace.visualstudio.com/items?itemName=ai-supervisor"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center px-8 py-4 border border-transparent text-base font-medium rounded-lg text-white bg-primary-600 hover:bg-primary-700 transition-colors shadow-lg hover:shadow-xl"
              >
                Install Free Extension
                <ArrowRight className="ml-2 h-5 w-5" />
              </a>
              <Link
                href="/docs/getting-started"
                className="inline-flex items-center px-8 py-4 border-2 border-gray-300 text-base font-medium rounded-lg text-gray-700 bg-white hover:bg-gray-50 transition-colors"
              >
                View Documentation
              </Link>
            </div>
            <p className="mt-4 text-sm text-gray-500">
              Free forever. Premium features available for $12/month.
            </p>
          </div>

          {/* Screenshot Placeholder */}
          <div className="mt-16 relative">
            <div className="relative mx-auto max-w-5xl">
              <div className="bg-gray-900 rounded-lg shadow-2xl p-4">
                <div className="bg-gray-800 rounded-t-lg p-2 flex items-center space-x-2">
                  <div className="flex space-x-2">
                    <div className="w-3 h-3 rounded-full bg-red-500"></div>
                    <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
                    <div className="w-3 h-3 rounded-full bg-green-500"></div>
                  </div>
                  <div className="text-sm text-gray-400 ml-4">AI Supervisor - VS Code</div>
                </div>
                <div className="bg-gray-100 rounded-b-lg p-8 flex items-center justify-center h-96">
                  <div className="text-center">
                    <Shield className="h-24 w-24 text-primary-600 mx-auto mb-4 opacity-50" />
                    <p className="text-gray-600 font-medium">Screenshot: AI Supervisor in action</p>
                    <p className="text-sm text-gray-500 mt-2">Replace with actual screenshot at:</p>
                    <code className="text-xs bg-gray-200 px-2 py-1 rounded mt-1 inline-block">
                      /public/screenshots/hero-screenshot.png
                    </code>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="bg-white py-12 border-y border-gray-200">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-center">
            <div>
              <div className="text-4xl font-bold text-primary-600">10,000+</div>
              <div className="text-gray-600 mt-2">Developers Protected</div>
            </div>
            <div>
              <div className="text-4xl font-bold text-primary-600">500K+</div>
              <div className="text-gray-600 mt-2">AI Changes Validated</div>
            </div>
            <div>
              <div className="text-4xl font-bold text-primary-600">99.9%</div>
              <div className="text-gray-600 mt-2">Hallucinations Caught</div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="bg-gray-50 py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
              Complete Control Over AI-Generated Code
            </h2>
            <p className="text-lg text-gray-600 max-w-3xl mx-auto">
              AI Supervisor acts as your safety net, monitoring every AI suggestion and change in real-time.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {/* Feature 1 */}
            <div className="bg-white rounded-lg p-6 shadow-sm hover:shadow-lg transition-shadow">
              <div className="bg-primary-100 rounded-lg w-12 h-12 flex items-center justify-center mb-4">
                <Eye className="h-6 w-6 text-primary-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Real-Time Monitoring</h3>
              <p className="text-gray-600">
                Track every file change, function modification, and code suggestion made by AI assistants in real-time.
              </p>
            </div>

            {/* Feature 2 */}
            <div className="bg-white rounded-lg p-6 shadow-sm hover:shadow-lg transition-shadow">
              <div className="bg-accent-100 rounded-lg w-12 h-12 flex items-center justify-center mb-4">
                <AlertTriangle className="h-6 w-6 text-accent-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Deviation Detection</h3>
              <p className="text-gray-600">
                Automatically detect when AI strays from your project patterns, coding standards, or architectural decisions.
              </p>
            </div>

            {/* Feature 3 */}
            <div className="bg-white rounded-lg p-6 shadow-sm hover:shadow-lg transition-shadow">
              <div className="bg-primary-100 rounded-lg w-12 h-12 flex items-center justify-center mb-4">
                <Lock className="h-6 w-6 text-primary-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Privacy-First Design</h3>
              <p className="text-gray-600">
                All analysis runs locally on your machine. No code is sent to external servers. Your data stays yours.
              </p>
            </div>

            {/* Feature 4 */}
            <div className="bg-white rounded-lg p-6 shadow-sm hover:shadow-lg transition-shadow">
              <div className="bg-accent-100 rounded-lg w-12 h-12 flex items-center justify-center mb-4">
                <Zap className="h-6 w-6 text-accent-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Instant Alerts</h3>
              <p className="text-gray-600">
                Get immediate notifications when AI makes suspicious changes, with one-click rollback capabilities.
              </p>
            </div>

            {/* Feature 5 */}
            <div className="bg-white rounded-lg p-6 shadow-sm hover:shadow-lg transition-shadow">
              <div className="bg-primary-100 rounded-lg w-12 h-12 flex items-center justify-center mb-4">
                <Shield className="h-6 w-6 text-primary-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Custom Guard Rails</h3>
              <p className="text-gray-600">
                Define your own rules and constraints. Prevent AI from modifying critical files or making breaking changes.
              </p>
            </div>

            {/* Feature 6 */}
            <div className="bg-white rounded-lg p-6 shadow-sm hover:shadow-lg transition-shadow">
              <div className="bg-accent-100 rounded-lg w-12 h-12 flex items-center justify-center mb-4">
                <Users className="h-6 w-6 text-accent-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Team Collaboration</h3>
              <p className="text-gray-600">
                Share guard rails and best practices across your team. Ensure consistent AI usage company-wide.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="bg-white py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
              How It Works
            </h2>
            <p className="text-lg text-gray-600 max-w-3xl mx-auto">
              Set up in minutes, protect your code forever.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
            <div className="text-center">
              <div className="bg-primary-600 text-white rounded-full w-12 h-12 flex items-center justify-center text-xl font-bold mx-auto mb-4">
                1
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Install Extension</h3>
              <p className="text-gray-600">
                Add AI Supervisor to VS Code from the marketplace. One-click installation, no configuration required.
              </p>
            </div>

            <div className="text-center">
              <div className="bg-primary-600 text-white rounded-full w-12 h-12 flex items-center justify-center text-xl font-bold mx-auto mb-4">
                2
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Define Your Rules</h3>
              <p className="text-gray-600">
                Set up guard rails, specify protected files, and configure deviation detection for your project.
              </p>
            </div>

            <div className="text-center">
              <div className="bg-primary-600 text-white rounded-full w-12 h-12 flex items-center justify-center text-xl font-bold mx-auto mb-4">
                3
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Code with Confidence</h3>
              <p className="text-gray-600">
                Use any AI coding assistant while AI Supervisor monitors and validates every change in the background.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Social Proof */}
      <section className="bg-gray-50 py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
              Trusted by Developers Worldwide
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="bg-white rounded-lg p-6 shadow-sm">
              <div className="flex items-center mb-4">
                <div className="w-12 h-12 rounded-full bg-primary-100 flex items-center justify-center mr-3">
                  <span className="text-xl font-bold text-primary-600">JD</span>
                </div>
                <div>
                  <div className="font-semibold text-gray-900">John Developer</div>
                  <div className="text-sm text-gray-500">Senior Engineer</div>
                </div>
              </div>
              <p className="text-gray-600 italic">
                "AI Supervisor saved me from a critical bug that Copilot tried to introduce. It caught a breaking change before I even committed it."
              </p>
            </div>

            <div className="bg-white rounded-lg p-6 shadow-sm">
              <div className="flex items-center mb-4">
                <div className="w-12 h-12 rounded-full bg-accent-100 flex items-center justify-center mr-3">
                  <span className="text-xl font-bold text-accent-600">SK</span>
                </div>
                <div>
                  <div className="font-semibold text-gray-900">Sarah Kim</div>
                  <div className="text-sm text-gray-500">Tech Lead</div>
                </div>
              </div>
              <p className="text-gray-600 italic">
                "Finally, I can use AI assistants without worrying about hallucinations. The deviation detection is incredibly accurate."
              </p>
            </div>

            <div className="bg-white rounded-lg p-6 shadow-sm">
              <div className="flex items-center mb-4">
                <div className="w-12 h-12 rounded-full bg-primary-100 flex items-center justify-center mr-3">
                  <span className="text-xl font-bold text-primary-600">MP</span>
                </div>
                <div>
                  <div className="font-semibold text-gray-900">Mike Peterson</div>
                  <div className="text-sm text-gray-500">CTO</div>
                </div>
              </div>
              <p className="text-gray-600 italic">
                "We rolled this out to our entire engineering team. AI Supervisor has become an essential part of our development workflow."
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="bg-gradient-to-r from-primary-600 to-accent-600 py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">
            Ready to Take Control of Your AI?
          </h2>
          <p className="text-xl text-primary-100 mb-8 max-w-2xl mx-auto">
            Start your 14-day free trial of premium features. No credit card required.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <a
              href="https://marketplace.visualstudio.com/items?itemName=ai-supervisor"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center px-8 py-4 border-2 border-white text-base font-medium rounded-lg text-primary-600 bg-white hover:bg-gray-100 transition-colors shadow-lg"
            >
              Install Free Extension
              <ArrowRight className="ml-2 h-5 w-5" />
            </a>
            <Link
              href="/pricing"
              className="inline-flex items-center px-8 py-4 border-2 border-white text-base font-medium rounded-lg text-white hover:bg-white/10 transition-colors"
            >
              View Pricing
            </Link>
          </div>
        </div>
      </section>
    </>
  )
}
