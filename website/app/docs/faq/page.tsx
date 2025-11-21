import Link from 'next/link'

export const metadata = {
  title: 'FAQ - AI Supervisor Documentation',
  description: 'Frequently asked questions about AI Supervisor.',
}

export default function FAQPage() {
  return (
    <div className="bg-white">
      {/* Header */}
      <section className="bg-gradient-to-br from-primary-50 to-white py-16">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
          <Link href="/docs" className="text-primary-600 hover:underline mb-4 inline-block">
            ← Back to Documentation
          </Link>
          <h1 className="text-4xl sm:text-5xl font-bold text-gray-900 mb-4">
            Frequently Asked Questions
          </h1>
          <p className="text-xl text-gray-600">
            Find answers to common questions about AI Supervisor.
          </p>
        </div>
      </section>

      {/* Content */}
      <section className="py-16">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
          <div className="space-y-12">
            {/* General */}
            <div id="general">
              <h2 className="text-3xl font-bold text-gray-900 mb-8">General</h2>
              <div className="space-y-6">
                <div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">
                    What is AI Supervisor?
                  </h3>
                  <p className="text-gray-700">
                    AI Supervisor is a VS Code extension that monitors and validates AI-generated code changes in real-time. It helps prevent AI hallucinations, catches errors early, and gives you complete control over what AI assistants can modify in your codebase.
                  </p>
                </div>

                <div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">
                    Which AI coding assistants does it work with?
                  </h3>
                  <p className="text-gray-700">
                    AI Supervisor works with all major AI coding assistants including:
                  </p>
                  <ul className="list-disc list-inside text-gray-700 mt-2 ml-4">
                    <li>GitHub Copilot</li>
                    <li>Cursor</li>
                    <li>Amazon CodeWhisperer</li>
                    <li>Tabnine</li>
                    <li>Codeium</li>
                    <li>And any other AI tool that modifies VS Code files</li>
                  </ul>
                </div>

                <div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">
                    Is my code data private?
                  </h3>
                  <p className="text-gray-700">
                    Yes, absolutely. AI Supervisor runs entirely locally on your machine. Your code never leaves your computer unless you opt-in to premium cloud sync features (which are encrypted end-to-end). We take privacy seriously and never track or analyze your actual code content.
                  </p>
                </div>

                <div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">
                    Does it slow down my development?
                  </h3>
                  <p className="text-gray-700">
                    No. AI Supervisor runs asynchronously in the background and has minimal performance impact (typically less than 1% CPU usage). The monitoring happens in real-time without blocking your editor or AI assistant.
                  </p>
                </div>
              </div>
            </div>

            {/* Installation & Setup */}
            <div id="installation">
              <h2 className="text-3xl font-bold text-gray-900 mb-8">Installation & Setup</h2>
              <div className="space-y-6">
                <div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">
                    How do I install AI Supervisor?
                  </h3>
                  <p className="text-gray-700">
                    Install from the VS Code Marketplace: search for "AI Supervisor" in the Extensions panel and click Install. See our <Link href="/docs/getting-started" className="text-primary-600 hover:underline">Getting Started guide</Link> for detailed instructions.
                  </p>
                </div>

                <div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">
                    Do I need to configure anything after installation?
                  </h3>
                  <p className="text-gray-700">
                    AI Supervisor works out of the box with default settings. However, we recommend running the initialization wizard (Command: "AI Supervisor: Initialize Project") to customize guard rails for your specific project.
                  </p>
                </div>

                <div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">
                    Can I use it in multiple projects?
                  </h3>
                  <p className="text-gray-700">
                    Yes! Free tier supports one project at a time. Premium tier supports unlimited projects with synced settings across all of them.
                  </p>
                </div>
              </div>
            </div>

            {/* Features */}
            <div id="features">
              <h2 className="text-3xl font-bold text-gray-900 mb-8">Features</h2>
              <div className="space-y-6">
                <div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">
                    What's the difference between basic and AI-powered deviation detection?
                  </h3>
                  <p className="text-gray-700">
                    Basic deviation detection (free tier) uses pattern matching and statistical analysis to find unusual changes. AI-powered detection (premium) uses machine learning to understand semantic meaning, detect subtle hallucinations, and analyze cross-file impacts.
                  </p>
                </div>

                <div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">
                    Can I create custom rules?
                  </h3>
                  <p className="text-gray-700">
                    Yes! Premium users can create unlimited custom guard rails using pattern matching, file globs, and JavaScript conditions. See the <Link href="/docs/features#guard-rails" className="text-primary-600 hover:underline">Guard Rails documentation</Link> for examples.
                  </p>
                </div>

                <div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">
                    How does automatic rollback work?
                  </h3>
                  <p className="text-gray-700">
                    When AI makes a change that violates your guard rails or exceeds deviation thresholds, AI Supervisor can automatically undo the change and restore the previous version. You can configure whether to prompt for confirmation or rollback immediately.
                  </p>
                </div>

                <div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">
                    What happens to my change history if I cancel my subscription?
                  </h3>
                  <p className="text-gray-700">
                    Your local history (30 days) remains accessible. Cloud-synced history will be available for download for 30 days after cancellation. After that, only your local history is retained.
                  </p>
                </div>
              </div>
            </div>

            {/* Common Issues */}
            <div id="common-issues">
              <h2 className="text-3xl font-bold text-gray-900 mb-8">Troubleshooting</h2>
              <div className="space-y-6">
                <div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">
                    AI Supervisor isn't detecting changes
                  </h3>
                  <p className="text-gray-700">
                    Check that:
                  </p>
                  <ul className="list-disc list-inside text-gray-700 mt-2 ml-4">
                    <li>Monitoring is enabled in settings</li>
                    <li>Your AI assistant is properly installed and active</li>
                    <li>The file you're editing isn't in an ignored directory (node_modules, .git, etc.)</li>
                    <li>You've initialized the project (run "AI Supervisor: Initialize Project")</li>
                  </ul>
                </div>

                <div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">
                    I'm getting too many notifications
                  </h3>
                  <p className="text-gray-700">
                    Adjust the notification level in settings: Settings → AI Supervisor → Notification Level. Change from "All" to "Important" or "Critical" to reduce noise.
                  </p>
                </div>

                <div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">
                    License activation failed
                  </h3>
                  <p className="text-gray-700">
                    Ensure you:
                  </p>
                  <ul className="list-disc list-inside text-gray-700 mt-2 ml-4">
                    <li>Have an active internet connection</li>
                    <li>Copied the entire license key (no extra spaces)</li>
                    <li>Haven't exceeded your device limit (3 devices per license)</li>
                    <li>Haven't already activated a trial with this email</li>
                  </ul>
                  <p className="text-gray-700 mt-2">
                    If issues persist, contact <a href="mailto:support@ai-supervisor.dev" className="text-primary-600 hover:underline">support@ai-supervisor.dev</a>
                  </p>
                </div>

                <div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">
                    The extension is using too much memory
                  </h3>
                  <p className="text-gray-700">
                    Try these optimizations:
                  </p>
                  <ul className="list-disc list-inside text-gray-700 mt-2 ml-4">
                    <li>Reduce history retention (Settings → Memory → History Days)</li>
                    <li>Add large directories to ignore patterns (node_modules, dist, etc.)</li>
                    <li>Disable real-time monitoring for non-code files</li>
                    <li>Clear old history: Command "AI Supervisor: Clear History"</li>
                  </ul>
                </div>
              </div>
            </div>

            {/* Performance */}
            <div id="performance">
              <h2 className="text-3xl font-bold text-gray-900 mb-8">Performance</h2>
              <div className="space-y-6">
                <div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">
                    What are the system requirements?
                  </h3>
                  <p className="text-gray-700">
                    Minimum requirements:
                  </p>
                  <ul className="list-disc list-inside text-gray-700 mt-2 ml-4">
                    <li>VS Code 1.75.0 or higher</li>
                    <li>2GB RAM (4GB recommended for premium features)</li>
                    <li>100MB free disk space</li>
                    <li>Internet connection for license validation and cloud sync</li>
                  </ul>
                </div>

                <div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">
                    Does it work with large codebases?
                  </h3>
                  <p className="text-gray-700">
                    Yes! AI Supervisor efficiently handles codebases of any size. We've tested with repositories containing 100,000+ files. Performance is optimized through incremental analysis and intelligent caching.
                  </p>
                </div>

                <div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">
                    Can I use it offline?
                  </h3>
                  <p className="text-gray-700">
                    Free tier works completely offline. Premium tier requires internet for initial license activation but includes a 7-day offline grace period. All core monitoring features work offline.
                  </p>
                </div>
              </div>
            </div>

            {/* Compatibility */}
            <div id="compatibility">
              <h2 className="text-3xl font-bold text-gray-900 mb-8">Compatibility</h2>
              <div className="space-y-6">
                <div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">
                    Which operating systems are supported?
                  </h3>
                  <p className="text-gray-700">
                    AI Supervisor works on Windows, macOS, and Linux - anywhere VS Code runs.
                  </p>
                </div>

                <div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">
                    Does it work with remote development (SSH, WSL, containers)?
                  </h3>
                  <p className="text-gray-700">
                    Yes! AI Supervisor fully supports VS Code's remote development features including SSH, WSL, and Dev Containers.
                  </p>
                </div>

                <div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">
                    Can I use it with other IDEs?
                  </h3>
                  <p className="text-gray-700">
                    Currently, AI Supervisor only supports VS Code. Support for JetBrains IDEs (IntelliJ, WebStorm, PyCharm) is planned for Q2 2024.
                  </p>
                </div>
              </div>
            </div>

            {/* Support */}
            <div id="support">
              <h2 className="text-3xl font-bold text-gray-900 mb-8">Support</h2>
              <div className="space-y-6">
                <div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">
                    How do I get help?
                  </h3>
                  <p className="text-gray-700">
                    Support options:
                  </p>
                  <ul className="list-disc list-inside text-gray-700 mt-2 ml-4">
                    <li><strong>Community:</strong> <a href="https://github.com/ai-supervisor/discussions" className="text-primary-600 hover:underline">GitHub Discussions</a></li>
                    <li><strong>Email:</strong> <a href="mailto:support@ai-supervisor.dev" className="text-primary-600 hover:underline">support@ai-supervisor.dev</a></li>
                    <li><strong>Premium users:</strong> Priority 24/7 support via live chat</li>
                  </ul>
                </div>

                <div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">
                    How do I report a bug?
                  </h3>
                  <p className="text-gray-700">
                    Report bugs on our <a href="https://github.com/ai-supervisor/issues" className="text-primary-600 hover:underline">GitHub Issues page</a>. Please include:
                  </p>
                  <ul className="list-disc list-inside text-gray-700 mt-2 ml-4">
                    <li>Steps to reproduce</li>
                    <li>Expected vs actual behavior</li>
                    <li>VS Code version and OS</li>
                    <li>AI Supervisor version</li>
                    <li>Extension logs (Command: "AI Supervisor: Export Logs")</li>
                  </ul>
                </div>

                <div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">
                    Can I request new features?
                  </h3>
                  <p className="text-gray-700">
                    Absolutely! Submit feature requests on <a href="https://github.com/ai-supervisor/discussions" className="text-primary-600 hover:underline">GitHub Discussions</a> or email <a href="mailto:features@ai-supervisor.dev" className="text-primary-600 hover:underline">features@ai-supervisor.dev</a>. We actively prioritize features based on community feedback.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Still have questions */}
          <div className="mt-16 bg-gradient-to-r from-primary-50 to-accent-50 rounded-lg p-8 text-center">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Still Have Questions?</h2>
            <p className="text-gray-700 mb-6">
              Can't find what you're looking for? We're here to help.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <a
                href="mailto:support@ai-supervisor.dev"
                className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-lg text-white bg-primary-600 hover:bg-primary-700 transition-colors"
              >
                Contact Support
              </a>
              <a
                href="https://github.com/ai-supervisor/discussions"
                className="inline-flex items-center px-6 py-3 border-2 border-gray-300 text-base font-medium rounded-lg text-gray-700 bg-white hover:bg-gray-50 transition-colors"
              >
                Community Forums
              </a>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}
