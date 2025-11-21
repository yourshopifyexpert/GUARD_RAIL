import Link from 'next/link'
import { Calendar, User, ArrowRight } from 'lucide-react'

export const metadata = {
  title: 'Blog - AI Supervisor',
  description: 'News, updates, and best practices for using AI coding assistants safely.',
}

// Blog posts data (in production, this would come from a CMS or markdown files)
const blogPosts = [
  {
    id: 'introducing-ai-supervisor',
    title: 'Introducing AI Supervisor: Take Control of AI-Generated Code',
    excerpt: 'Learn how AI Supervisor helps developers prevent AI hallucinations and maintain control over their codebase.',
    date: '2024-01-15',
    author: 'AI Supervisor Team',
    category: 'Product',
    readTime: '5 min read',
  },
  {
    id: 'preventing-ai-hallucinations',
    title: '5 Ways to Prevent AI Hallucinations in Your Code',
    excerpt: 'Best practices for using AI coding assistants without compromising code quality.',
    date: '2024-01-10',
    author: 'Sarah Johnson',
    category: 'Best Practices',
    readTime: '8 min read',
  },
  {
    id: 'guard-rails-guide',
    title: 'The Complete Guide to Custom Guard Rails',
    excerpt: 'Learn how to create custom rules to protect your critical code from AI modifications.',
    date: '2024-01-05',
    author: 'Mike Chen',
    category: 'Tutorial',
    readTime: '10 min read',
  },
]

export default function BlogPage() {
  return (
    <div className="bg-white">
      {/* Header */}
      <section className="bg-gradient-to-br from-primary-50 to-white py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <h1 className="text-4xl sm:text-5xl font-bold text-gray-900 mb-4">
            Blog
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl">
            News, updates, and best practices for using AI coding assistants safely.
          </p>
        </div>
      </section>

      {/* Featured Post */}
      <section className="py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="bg-gradient-to-r from-primary-600 to-accent-600 rounded-2xl overflow-hidden shadow-2xl">
            <div className="grid grid-cols-1 lg:grid-cols-2">
              <div className="p-8 lg:p-12 flex flex-col justify-center">
                <div className="text-primary-100 text-sm font-semibold mb-2">FEATURED POST</div>
                <h2 className="text-3xl font-bold text-white mb-4">
                  {blogPosts[0].title}
                </h2>
                <p className="text-primary-100 text-lg mb-6">
                  {blogPosts[0].excerpt}
                </p>
                <div className="flex items-center text-primary-100 mb-6">
                  <Calendar className="h-4 w-4 mr-2" />
                  <span className="text-sm">{new Date(blogPosts[0].date).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</span>
                  <span className="mx-2">•</span>
                  <span className="text-sm">{blogPosts[0].readTime}</span>
                </div>
                <Link
                  href={`/blog/${blogPosts[0].id}`}
                  className="inline-flex items-center px-6 py-3 border-2 border-white text-base font-medium rounded-lg text-white hover:bg-white/10 transition-colors w-fit"
                >
                  Read More
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Link>
              </div>
              <div className="bg-white/10 p-8 lg:p-12 flex items-center justify-center">
                <div className="text-center text-white">
                  <p className="text-sm opacity-75 mb-2">Placeholder for featured image</p>
                  <code className="text-xs bg-white/20 px-2 py-1 rounded">
                    /public/images/blog/featured.png
                  </code>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Recent Posts */}
      <section className="py-16 bg-gray-50">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-gray-900 mb-8">Recent Posts</h2>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {blogPosts.slice(1).map((post) => (
              <article key={post.id} className="bg-white rounded-lg shadow-sm hover:shadow-lg transition-shadow overflow-hidden">
                <div className="h-48 bg-gradient-to-br from-primary-100 to-accent-100 flex items-center justify-center">
                  <div className="text-center text-gray-600">
                    <p className="text-sm mb-2">Placeholder for post image</p>
                    <code className="text-xs bg-gray-200 px-2 py-1 rounded">
                      /public/images/blog/{post.id}.png
                    </code>
                  </div>
                </div>
                <div className="p-6">
                  <div className="text-xs font-semibold text-primary-600 mb-2">{post.category.toUpperCase()}</div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">
                    <Link href={`/blog/${post.id}`} className="hover:text-primary-600 transition-colors">
                      {post.title}
                    </Link>
                  </h3>
                  <p className="text-gray-600 mb-4">{post.excerpt}</p>
                  <div className="flex items-center text-gray-500 text-sm mb-4">
                    <Calendar className="h-4 w-4 mr-2" />
                    <span>{new Date(post.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                    <span className="mx-2">•</span>
                    <span>{post.readTime}</span>
                  </div>
                  <Link
                    href={`/blog/${post.id}`}
                    className="inline-flex items-center text-primary-600 hover:text-primary-700 font-medium"
                  >
                    Read More
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* Categories */}
      <section className="py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-gray-900 mb-8">Browse by Category</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {['Product', 'Best Practices', 'Tutorial', 'Updates'].map((category) => (
              <Link
                key={category}
                href={`/blog/category/${category.toLowerCase().replace(' ', '-')}`}
                className="bg-white border-2 border-gray-200 rounded-lg p-6 text-center hover:border-primary-500 hover:shadow-lg transition-all"
              >
                <div className="font-semibold text-gray-900">{category}</div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Newsletter */}
      <section className="bg-gradient-to-r from-primary-600 to-accent-600 py-16">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-bold text-white mb-4">
            Stay Updated
          </h2>
          <p className="text-xl text-primary-100 mb-8">
            Get the latest updates on AI Supervisor and best practices delivered to your inbox.
          </p>
          <form className="flex flex-col sm:flex-row gap-4 max-w-md mx-auto">
            <input
              type="email"
              placeholder="Enter your email"
              className="flex-1 px-4 py-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-white"
              required
            />
            <button
              type="submit"
              className="px-6 py-3 bg-white text-primary-600 font-medium rounded-lg hover:bg-gray-100 transition-colors"
            >
              Subscribe
            </button>
          </form>
          <p className="text-sm text-primary-100 mt-4">
            We respect your privacy. Unsubscribe anytime.
          </p>
        </div>
      </section>
    </div>
  )
}
