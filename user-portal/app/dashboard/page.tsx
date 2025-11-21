'use client'

import { useEffect, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { Copy, Check, ExternalLink, CreditCard, Download } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'

interface License {
  id: string
  key: string
  type: string
  status: string
  expiresAt: string
  maxActivations: number
  currentActivations: number
  billingPeriod?: string
}

interface User {
  id: string
  email: string
  name?: string
  licenses: License[]
}

export default function DashboardPage() {
  const searchParams = useSearchParams()
  const email = searchParams.get('email')
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [copiedKey, setCopiedKey] = useState<string | null>(null)

  useEffect(() => {
    if (email) {
      fetchUserData(email)
    }
  }, [email])

  const fetchUserData = async (email: string) => {
    try {
      setLoading(true)
      // TODO: Replace with actual API call
      // Mock data for demonstration
      setTimeout(() => {
        setUser({
          id: '1',
          email,
          name: 'John Doe',
          licenses: [
            {
              id: '1',
              key: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
              type: 'individual',
              status: 'active',
              expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
              maxActivations: 3,
              currentActivations: 1,
              billingPeriod: 'monthly'
            }
          ]
        })
        setLoading(false)
      }, 1000)
    } catch (error) {
      console.error('Failed to fetch user data:', error)
      setLoading(false)
    }
  }

  const copyToClipboard = async (text: string, id: string) => {
    await navigator.clipboard.writeText(text)
    setCopiedKey(id)
    setTimeout(() => setCopiedKey(null), 2000)
  }

  const openBillingPortal = async () => {
    try {
      const response = await fetch('/api/stripe/create-portal-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: user?.email,
          returnUrl: window.location.href
        })
      })

      const data = await response.json()
      if (data.url) {
        window.location.href = data.url
      }
    } catch (error) {
      console.error('Failed to open billing portal:', error)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Loading your dashboard...</p>
        </div>
      </div>
    )
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600 dark:text-gray-400">No user data found</p>
        </div>
      </div>
    )
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            Welcome back, {user.name || user.email}
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Manage your AI Supervisor licenses and billing
          </p>
        </div>

        {/* Stats */}
        <div className="grid md:grid-cols-3 gap-6 mb-8">
          <StatCard
            label="Active Licenses"
            value={user.licenses.filter(l => l.status === 'active').length}
            total={user.licenses.length}
          />
          <StatCard
            label="Total Activations"
            value={user.licenses.reduce((sum, l) => sum + l.currentActivations, 0)}
            total={user.licenses.reduce((sum, l) => sum + l.maxActivations, 0)}
          />
          <StatCard
            label="Subscription Status"
            value={user.licenses[0]?.status || 'N/A'}
            isStatus
          />
        </div>

        {/* Licenses */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-6 mb-8">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
              Your Licenses
            </h2>
            <button
              onClick={openBillingPortal}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
            >
              <CreditCard className="w-4 h-4" />
              Manage Billing
            </button>
          </div>

          <div className="space-y-4">
            {user.licenses.map((license) => (
              <LicenseCard
                key={license.id}
                license={license}
                onCopy={(key) => copyToClipboard(key, license.id)}
                copied={copiedKey === license.id}
              />
            ))}
          </div>

          {user.licenses.length === 0 && (
            <div className="text-center py-12">
              <p className="text-gray-600 dark:text-gray-400 mb-4">
                No licenses found
              </p>
              <a
                href="/pricing"
                className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
              >
                Get Started
                <ExternalLink className="w-4 h-4" />
              </a>
            </div>
          )}
        </div>

        {/* Quick Actions */}
        <div className="grid md:grid-cols-2 gap-6">
          <ActionCard
            title="Download Extension"
            description="Install AI Supervisor for VS Code"
            icon={<Download className="w-6 h-6" />}
            action="Download"
            onClick={() => window.open('https://marketplace.visualstudio.com/items?itemName=ai-supervisor', '_blank')}
          />
          <ActionCard
            title="Documentation"
            description="Learn how to use AI Supervisor"
            icon={<ExternalLink className="w-6 h-6" />}
            action="View Docs"
            onClick={() => window.open('/docs', '_blank')}
          />
        </div>
      </div>
    </main>
  )
}

function StatCard({ label, value, total, isStatus }: {
  label: string
  value: number | string
  total?: number
  isStatus?: boolean
}) {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg">
      <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">{label}</p>
      <div className="flex items-baseline gap-2">
        <p className="text-3xl font-bold text-gray-900 dark:text-white">
          {value}
        </p>
        {total !== undefined && !isStatus && (
          <p className="text-lg text-gray-500 dark:text-gray-400">/ {total}</p>
        )}
      </div>
    </div>
  )
}

function LicenseCard({ license, onCopy, copied }: {
  license: License
  onCopy: (key: string) => void
  copied: boolean
}) {
  const statusColor = {
    active: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
    expired: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
    cancelled: 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200',
    suspended: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
  }[license.status] || 'bg-gray-100 text-gray-800'

  const expiresIn = formatDistanceToNow(new Date(license.expiresAt), { addSuffix: true })

  return (
    <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-6">
      <div className="flex justify-between items-start mb-4">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white capitalize">
              {license.type} License
            </h3>
            <span className={`px-3 py-1 rounded-full text-xs font-medium ${statusColor}`}>
              {license.status}
            </span>
          </div>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            {license.billingPeriod ? `${license.billingPeriod} billing` : 'One-time purchase'} • Expires {expiresIn}
          </p>
        </div>
        <div className="text-right">
          <p className="text-sm text-gray-600 dark:text-gray-400">Activations</p>
          <p className="text-lg font-semibold text-gray-900 dark:text-white">
            {license.currentActivations} / {license.maxActivations}
          </p>
        </div>
      </div>

      <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-4">
        <div className="flex items-center justify-between mb-2">
          <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
            License Key
          </label>
          <button
            onClick={() => onCopy(license.key)}
            className="flex items-center gap-2 text-sm text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
          >
            {copied ? (
              <>
                <Check className="w-4 h-4" />
                Copied!
              </>
            ) : (
              <>
                <Copy className="w-4 h-4" />
                Copy
              </>
            )}
          </button>
        </div>
        <code className="block text-sm text-gray-900 dark:text-gray-100 font-mono break-all">
          {license.key}
        </code>
      </div>
    </div>
  )
}

function ActionCard({ title, description, icon, action, onClick }: {
  title: string
  description: string
  icon: React.ReactNode
  action: string
  onClick: () => void
}) {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg">
      <div className="flex items-start gap-4">
        <div className="p-3 bg-blue-100 dark:bg-blue-900 rounded-lg text-blue-600 dark:text-blue-400">
          {icon}
        </div>
        <div className="flex-1">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">
            {title}
          </h3>
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
            {description}
          </p>
          <button
            onClick={onClick}
            className="text-sm text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 font-medium"
          >
            {action} →
          </button>
        </div>
      </div>
    </div>
  )
}
