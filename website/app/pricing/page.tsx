import { Check, X, Shield, Zap, Users, Cloud, HeadphonesIcon } from 'lucide-react'
import Link from 'next/link'

export const metadata = {
  title: 'Pricing - AI Supervisor',
  description: 'Choose the perfect plan for your needs. Free forever or premium features starting at $12/month.',
}

export default function Pricing() {
  return (
    <div className="bg-white">
      {/* Header */}
      <section className="bg-gradient-to-br from-primary-50 to-white py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-4xl sm:text-5xl font-bold text-gray-900 mb-4">
            Simple, Transparent Pricing
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Start free, upgrade when you need advanced features. No hidden fees, cancel anytime.
          </p>
        </div>
      </section>

      {/* Pricing Cards */}
      <section className="py-20 -mt-10">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-5xl mx-auto">
            {/* Free Plan */}
            <div className="bg-white rounded-2xl shadow-lg border-2 border-gray-200 p-8">
              <div className="text-center mb-8">
                <h3 className="text-2xl font-bold text-gray-900 mb-2">Free</h3>
                <div className="text-5xl font-bold text-gray-900 mb-2">$0</div>
                <p className="text-gray-600">Forever free</p>
              </div>

              <ul className="space-y-4 mb-8">
                <li className="flex items-start">
                  <Check className="h-6 w-6 text-green-500 mr-3 flex-shrink-0" />
                  <span className="text-gray-700">Real-time monitoring of AI changes</span>
                </li>
                <li className="flex items-start">
                  <Check className="h-6 w-6 text-green-500 mr-3 flex-shrink-0" />
                  <span className="text-gray-700">Basic deviation detection</span>
                </li>
                <li className="flex items-start">
                  <Check className="h-6 w-6 text-green-500 mr-3 flex-shrink-0" />
                  <span className="text-gray-700">Single project support</span>
                </li>
                <li className="flex items-start">
                  <Check className="h-6 w-6 text-green-500 mr-3 flex-shrink-0" />
                  <span className="text-gray-700">Local memory (30-day history)</span>
                </li>
                <li className="flex items-start">
                  <Check className="h-6 w-6 text-green-500 mr-3 flex-shrink-0" />
                  <span className="text-gray-700">Manual rollback</span>
                </li>
                <li className="flex items-start">
                  <Check className="h-6 w-6 text-green-500 mr-3 flex-shrink-0" />
                  <span className="text-gray-700">Community support</span>
                </li>
                <li className="flex items-start">
                  <X className="h-6 w-6 text-gray-300 mr-3 flex-shrink-0" />
                  <span className="text-gray-400">AI-powered analysis</span>
                </li>
                <li className="flex items-start">
                  <X className="h-6 w-6 text-gray-300 mr-3 flex-shrink-0" />
                  <span className="text-gray-400">Multi-project support</span>
                </li>
                <li className="flex items-start">
                  <X className="h-6 w-6 text-gray-300 mr-3 flex-shrink-0" />
                  <span className="text-gray-400">Cloud sync & backup</span>
                </li>
              </ul>

              <a
                href="https://marketplace.visualstudio.com/items?itemName=ai-supervisor"
                target="_blank"
                rel="noopener noreferrer"
                className="block w-full text-center px-6 py-3 border-2 border-gray-300 text-base font-medium rounded-lg text-gray-700 bg-white hover:bg-gray-50 transition-colors"
              >
                Get Started Free
              </a>
            </div>

            {/* Premium Plan */}
            <div className="bg-gradient-to-br from-primary-600 to-accent-600 rounded-2xl shadow-2xl border-2 border-primary-600 p-8 relative">
              <div className="absolute top-0 right-8 transform -translate-y-1/2">
                <span className="bg-accent-500 text-white px-4 py-1 rounded-full text-sm font-semibold">
                  POPULAR
                </span>
              </div>

              <div className="text-center mb-8">
                <h3 className="text-2xl font-bold text-white mb-2">Premium</h3>
                <div className="text-5xl font-bold text-white mb-2">$12</div>
                <p className="text-primary-100">per month</p>
                <p className="text-sm text-primary-100 mt-2">or $100/year (save 30%)</p>
              </div>

              <ul className="space-y-4 mb-8">
                <li className="flex items-start">
                  <Check className="h-6 w-6 text-white mr-3 flex-shrink-0" />
                  <span className="text-white font-medium">Everything in Free, plus:</span>
                </li>
                <li className="flex items-start">
                  <Shield className="h-6 w-6 text-white mr-3 flex-shrink-0" />
                  <span className="text-white">Advanced AI-powered deviation detection</span>
                </li>
                <li className="flex items-start">
                  <Zap className="h-6 w-6 text-white mr-3 flex-shrink-0" />
                  <span className="text-white">Unlimited projects</span>
                </li>
                <li className="flex items-start">
                  <Cloud className="h-6 w-6 text-white mr-3 flex-shrink-0" />
                  <span className="text-white">Cloud sync & backup (unlimited history)</span>
                </li>
                <li className="flex items-start">
                  <Users className="h-6 w-6 text-white mr-3 flex-shrink-0" />
                  <span className="text-white">Team collaboration features</span>
                </li>
                <li className="flex items-start">
                  <Check className="h-6 w-6 text-white mr-3 flex-shrink-0" />
                  <span className="text-white">Custom guard rails & rules</span>
                </li>
                <li className="flex items-start">
                  <Check className="h-6 w-6 text-white mr-3 flex-shrink-0" />
                  <span className="text-white">Automatic rollback on critical issues</span>
                </li>
                <li className="flex items-start">
                  <Check className="h-6 w-6 text-white mr-3 flex-shrink-0" />
                  <span className="text-white">Advanced analytics dashboard</span>
                </li>
                <li className="flex items-start">
                  <HeadphonesIcon className="h-6 w-6 text-white mr-3 flex-shrink-0" />
                  <span className="text-white">Priority support (24/7)</span>
                </li>
              </ul>

              <a
                href="https://ai-supervisor.dev/checkout"
                className="block w-full text-center px-6 py-3 text-base font-medium rounded-lg text-primary-600 bg-white hover:bg-gray-100 transition-colors shadow-lg"
              >
                Start 14-Day Free Trial
              </a>
              <p className="text-center text-sm text-primary-100 mt-3">
                No credit card required
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Feature Comparison Table */}
      <section className="bg-gray-50 py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-center text-gray-900 mb-12">
            Feature Comparison
          </h2>

          <div className="bg-white rounded-lg shadow-lg overflow-hidden">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">
                    Feature
                  </th>
                  <th className="px-6 py-4 text-center text-sm font-semibold text-gray-900">
                    Free
                  </th>
                  <th className="px-6 py-4 text-center text-sm font-semibold text-gray-900 bg-primary-50">
                    Premium
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                <tr>
                  <td className="px-6 py-4 text-sm text-gray-900">Real-time monitoring</td>
                  <td className="px-6 py-4 text-center">
                    <Check className="h-5 w-5 text-green-500 mx-auto" />
                  </td>
                  <td className="px-6 py-4 text-center bg-primary-50">
                    <Check className="h-5 w-5 text-green-500 mx-auto" />
                  </td>
                </tr>
                <tr>
                  <td className="px-6 py-4 text-sm text-gray-900">Deviation detection</td>
                  <td className="px-6 py-4 text-center text-sm text-gray-500">Basic</td>
                  <td className="px-6 py-4 text-center bg-primary-50 text-sm text-gray-900 font-medium">
                    AI-Powered
                  </td>
                </tr>
                <tr>
                  <td className="px-6 py-4 text-sm text-gray-900">Number of projects</td>
                  <td className="px-6 py-4 text-center text-sm text-gray-500">1</td>
                  <td className="px-6 py-4 text-center bg-primary-50 text-sm text-gray-900 font-medium">
                    Unlimited
                  </td>
                </tr>
                <tr>
                  <td className="px-6 py-4 text-sm text-gray-900">Memory history</td>
                  <td className="px-6 py-4 text-center text-sm text-gray-500">30 days</td>
                  <td className="px-6 py-4 text-center bg-primary-50 text-sm text-gray-900 font-medium">
                    Unlimited
                  </td>
                </tr>
                <tr>
                  <td className="px-6 py-4 text-sm text-gray-900">Cloud sync & backup</td>
                  <td className="px-6 py-4 text-center">
                    <X className="h-5 w-5 text-gray-300 mx-auto" />
                  </td>
                  <td className="px-6 py-4 text-center bg-primary-50">
                    <Check className="h-5 w-5 text-green-500 mx-auto" />
                  </td>
                </tr>
                <tr>
                  <td className="px-6 py-4 text-sm text-gray-900">Team collaboration</td>
                  <td className="px-6 py-4 text-center">
                    <X className="h-5 w-5 text-gray-300 mx-auto" />
                  </td>
                  <td className="px-6 py-4 text-center bg-primary-50">
                    <Check className="h-5 w-5 text-green-500 mx-auto" />
                  </td>
                </tr>
                <tr>
                  <td className="px-6 py-4 text-sm text-gray-900">Custom guard rails</td>
                  <td className="px-6 py-4 text-center">
                    <X className="h-5 w-5 text-gray-300 mx-auto" />
                  </td>
                  <td className="px-6 py-4 text-center bg-primary-50">
                    <Check className="h-5 w-5 text-green-500 mx-auto" />
                  </td>
                </tr>
                <tr>
                  <td className="px-6 py-4 text-sm text-gray-900">Automatic rollback</td>
                  <td className="px-6 py-4 text-center">
                    <X className="h-5 w-5 text-gray-300 mx-auto" />
                  </td>
                  <td className="px-6 py-4 text-center bg-primary-50">
                    <Check className="h-5 w-5 text-green-500 mx-auto" />
                  </td>
                </tr>
                <tr>
                  <td className="px-6 py-4 text-sm text-gray-900">Analytics dashboard</td>
                  <td className="px-6 py-4 text-center">
                    <X className="h-5 w-5 text-gray-300 mx-auto" />
                  </td>
                  <td className="px-6 py-4 text-center bg-primary-50">
                    <Check className="h-5 w-5 text-green-500 mx-auto" />
                  </td>
                </tr>
                <tr>
                  <td className="px-6 py-4 text-sm text-gray-900">Support</td>
                  <td className="px-6 py-4 text-center text-sm text-gray-500">Community</td>
                  <td className="px-6 py-4 text-center bg-primary-50 text-sm text-gray-900 font-medium">
                    Priority 24/7
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* FAQs */}
      <section className="py-20">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-center text-gray-900 mb-12">
            Frequently Asked Questions
          </h2>

          <div className="space-y-8">
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                How does the 14-day free trial work?
              </h3>
              <p className="text-gray-600">
                You get full access to all premium features for 14 days, no credit card required. After the trial, you can choose to upgrade or continue using the free tier.
              </p>
            </div>

            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Can I cancel anytime?
              </h3>
              <p className="text-gray-600">
                Yes! Cancel your subscription at any time from your account dashboard. You'll continue to have access until the end of your billing period.
              </p>
            </div>

            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                What's your refund policy?
              </h3>
              <p className="text-gray-600">
                We offer a 30-day money-back guarantee. If you're not satisfied for any reason, contact us within 30 days of purchase for a full refund.
              </p>
            </div>

            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Do you offer student discounts?
              </h3>
              <p className="text-gray-600">
                Yes! Students and educators with a .edu email get 50% off premium plans. Contact us at students@ai-supervisor.dev to verify your eligibility.
              </p>
            </div>

            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                What payment methods do you accept?
              </h3>
              <p className="text-gray-600">
                We accept all major credit cards (Visa, MasterCard, American Express) and PayPal through our secure Stripe payment processor.
              </p>
            </div>

            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Can I use one license on multiple machines?
              </h3>
              <p className="text-gray-600">
                Yes! Your premium license can be activated on up to 3 machines. For larger teams, contact us about our team plans.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="bg-gradient-to-r from-primary-600 to-accent-600 py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-bold text-white mb-4">
            Ready to Get Started?
          </h2>
          <p className="text-xl text-primary-100 mb-8">
            Install AI Supervisor today and take control of your AI-generated code.
          </p>
          <a
            href="https://marketplace.visualstudio.com/items?itemName=ai-supervisor"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center px-8 py-4 border-2 border-white text-base font-medium rounded-lg text-primary-600 bg-white hover:bg-gray-100 transition-colors shadow-lg"
          >
            Install Free Extension
          </a>
        </div>
      </section>
    </div>
  )
}
