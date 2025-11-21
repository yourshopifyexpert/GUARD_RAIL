'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Key, CreditCard, FileText, Settings } from 'lucide-react'

export default function HomePage() {
  const [email, setEmail] = useState('')

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    // TODO: Implement authentication
    window.location.href = `/dashboard?email=${encodeURIComponent(email)}`
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800">
      <div className="container mx-auto px-4 py-16">
        {/* Header */}
        <div className="text-center mb-16">
          <h1 className="text-5xl font-bold text-gray-900 dark:text-white mb-4">
            AI Supervisor
          </h1>
          <p className="text-xl text-gray-600 dark:text-gray-300">
            License Management Portal
          </p>
        </div>

        {/* Login Card */}
        <div className="max-w-md mx-auto">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
              Access Your Dashboard
            </h2>

            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <label
                  htmlFor="email"
                  className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
                >
                  Email Address
                </label>
                <input
                  type="email"
                  id="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                  placeholder="your@email.com"
                />
              </div>

              <button
                type="submit"
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-6 rounded-lg transition-colors"
              >
                Continue
              </button>
            </form>

            <div className="mt-6 text-center text-sm text-gray-600 dark:text-gray-400">
              Don't have a license?{' '}
              <Link href="/pricing" className="text-blue-600 hover:text-blue-700 font-medium">
                View Pricing
              </Link>
            </div>
          </div>
        </div>

        {/* Features */}
        <div className="grid md:grid-cols-4 gap-6 mt-16 max-w-5xl mx-auto">
          <FeatureCard
            icon={<Key className="w-8 h-8" />}
            title="Manage Licenses"
            description="View and activate your license keys"
          />
          <FeatureCard
            icon={<CreditCard className="w-8 h-8" />}
            title="Billing"
            description="Update payment methods and view invoices"
          />
          <FeatureCard
            icon={<FileText className="w-8 h-8" />}
            title="Usage Stats"
            description="Track your activation and usage"
          />
          <FeatureCard
            icon={<Settings className="w-8 h-8" />}
            title="Settings"
            description="Manage your account preferences"
          />
        </div>
      </div>
    </main>
  )
}

function FeatureCard({
  icon,
  title,
  description,
}: {
  icon: React.ReactNode
  title: string
  description: string
}) {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg text-center">
      <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-100 dark:bg-blue-900 rounded-full mb-4 text-blue-600 dark:text-blue-400">
        {icon}
      </div>
      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
        {title}
      </h3>
      <p className="text-sm text-gray-600 dark:text-gray-400">{description}</p>
    </div>
  )
}
