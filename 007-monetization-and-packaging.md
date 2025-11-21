<objective>
Set up the monetization infrastructure, licensing system, packaging, and go-to-market materials for the AI Supervisor extension. This includes license key validation, premium feature gating, payment integration, and marketplace listing optimization.

Transform the technical product into a revenue-generating business.
</objective>

<context>
With the core engine (prompt 005) and VS Code extension (prompt 006) complete, this prompt focuses on business infrastructure:

**Freemium Model**:
- **Free tier**: Basic memory, simple deviation detection, single project
- **Premium tier**: Advanced AI-powered analysis, multi-project, cloud sync, team features, priority support

**Revenue goals**:
- VS Code Marketplace as primary channel
- Target: Developers using AI assistants (growing market)
- Price point: $10-15/month or $100/year (competitive with GitHub Copilot)

This prompt sets up licensing, payment processing, analytics, and marketing materials.
</context>

<requirements>

## Licensing System

1. **License Key Generation & Validation**
   - Secure license key generation (cryptographic signing)
   - Online validation API (check if key is valid/active)
   - Offline grace period (7 days without internet)
   - Trial system (14-day free trial of premium features)

2. **License Types**
   - Individual license (single user)
   - Team license (5+ users with centralized management)
   - Student/Education discount (50% off with .edu email)
   - Open source contributor (free premium for active OSS devs)

3. **Feature Gating**
   - Runtime checks for premium features
   - Graceful degradation (show "upgrade" prompts, not errors)
   - Easy upgrade flow from within extension

## Payment Integration

4. **Payment Provider Setup**
   - Stripe integration for subscriptions
   - Support monthly and annual billing
   - Automatic renewal with email reminders
   - Refund policy (30-day money-back guarantee)

5. **License Portal**
   - Web dashboard for users to:
     - View active licenses
     - Download license keys
     - Manage billing/subscriptions
     - Access invoices
     - Cancel/upgrade subscriptions

## Analytics & Telemetry

6. **Usage Analytics** (Privacy-respecting)
   - Track: feature usage, DAU/MAU, premium adoption rate
   - NO tracking of user code or conversation content
   - Opt-in telemetry with clear privacy policy
   - Use for product improvements and marketing

7. **Error Reporting**
   - Automated crash reports (Sentry or similar)
   - User feedback collection within extension
   - Bug reporting with diagnostic info

## Marketing & Documentation

8. **Marketplace Listing**
   - Professional README with screenshots, GIFs
   - Feature comparison table (Free vs Premium)
   - Testimonials and social proof (after beta)
   - SEO-optimized description

9. **Website/Landing Page**
   - Product overview and benefits
   - Pricing page with feature comparison
   - Documentation and guides
   - Blog for updates and tutorials
   - Contact/support page

10. **Documentation Suite**
    - Getting started guide
    - Feature deep-dives
    - API documentation (for developers)
    - Troubleshooting and FAQ
    - Video tutorials (optional but recommended)

</requirements>

<implementation>

## Technical Stack

- **Licensing**: Custom Node.js service with JWT-based keys
- **Payment**: Stripe Checkout + Customer Portal
- **Landing page**: Next.js or Astro (fast, SEO-friendly)
- **Hosting**: Vercel or Cloudflare Pages (free/cheap)
- **Analytics**: PostHog (privacy-friendly) or Mixpanel
- **Error tracking**: Sentry
- **Email**: Resend or SendGrid (transactional emails)

## Recommended Structure

```
ai-supervisor-business/
├── licensing/
│   ├── api/                    # License validation API
│   │   ├── generate-key.ts
│   │   ├── validate-key.ts
│   │   └── server.ts
│   ├── stripe/                 # Payment webhooks
│   │   ├── checkout.ts
│   │   └── webhooks.ts
│   └── database/               # License storage (PostgreSQL)
├── website/
│   ├── app/                    # Next.js pages
│   │   ├── page.tsx           # Landing page
│   │   ├── pricing/
│   │   ├── docs/
│   │   └── dashboard/         # User portal
│   ├── components/
│   ├── public/
│   │   ├── screenshots/
│   │   └── demo.gif
│   └── package.json
├── docs/
│   ├── getting-started.md
│   ├── features/
│   ├── api-reference.md
│   └── faq.md
└── marketing/
    ├── marketplace-description.md
    ├── social-media-posts.md
    └── launch-checklist.md
```

## Implementation Steps

1. **Build license validation API**
   - Deploy serverless function (Vercel/Netlify)
   - Generate signed JWT license keys
   - Validate on extension startup

2. **Set up Stripe**
   - Create products: Monthly ($12), Annual ($100)
   - Configure webhooks for subscription events
   - Build checkout flow

3. **Create landing page**
   - Hero section with value proposition
   - Feature showcase with visuals
   - Pricing comparison table
   - CTA buttons to marketplace/checkout

4. **Integrate license checks in extension**
   - Modify extension from prompt 006
   - Add license activation UI
   - Gate premium features behind validation

5. **Set up analytics**
   - Add telemetry to extension (opt-in)
   - Track key metrics: installs, activations, feature usage
   - Create dashboard for monitoring

6. **Write documentation**
   - Comprehensive docs site
   - Video walkthrough (optional)
   - Blog post announcing launch

## What to Avoid

- **Don't** make licensing overly restrictive - one key per user, allow multiple machines
- **Don't** track user code or private data - privacy is critical
- **Don't** spam users with upsell prompts - subtle upgrade nudges only
- **Don't** overcomplicate pricing - simple free/premium is best to start

Why? Developer tools live or die by trust and simplicity. Respect privacy, make licensing fair, and keep pricing transparent.

</implementation>

<output>

Create:

1. **Licensing API**
   - `./licensing-api/` - Complete serverless API with deployment instructions
   - Environment variables documentation
   - Database schema for license storage

2. **Website**
   - `./website/` - Complete Next.js site ready to deploy
   - Pre-filled content for landing page, pricing, docs
   - Stripe integration setup

3. **Documentation**
   - `./docs/` - Full documentation in Markdown
   - Getting started, feature guides, API reference, FAQ
   - Link from extension README

4. **Marketing Materials**
   - `./marketing/marketplace-description.md` - Polished VS Code Marketplace listing
   - `./marketing/launch-plan.md` - Go-to-market strategy
   - `./marketing/social-posts.md` - Pre-written announcement posts
   - `./marketing/feature-comparison.md` - Free vs Premium table

5. **Updated Extension**
   - Modify `vscode-ai-supervisor` from prompt 006
   - Add license activation dialog
   - Integrate validation API calls
   - Add telemetry (opt-in)

</output>

<verification>

Before launch:

1. **Test licensing end-to-end**
   - Generate test license key
   - Activate in extension
   - Verify premium features unlock
   - Test expiration and renewal

2. **Test payment flow**
   - Complete Stripe checkout (test mode)
   - Verify webhook delivers license key
   - Test subscription cancellation

3. **Check website**
   - All links work
   - Responsive on mobile
   - Fast load times (<2s)
   - SEO meta tags present

4. **Review documentation**
   - No broken links
   - Screenshots up to date
   - Code examples work
   - FAQ covers common questions

5. **Dry run marketplace listing**
   - Preview in VS Code Marketplace
   - Get feedback from beta testers
   - Fix any issues

Create a launch checklist documenting these steps.

</verification>

<success_criteria>

- License validation API deployed and functional
- Stripe integration processes payments correctly
- Website live with landing page, pricing, and docs
- VS Code extension includes license activation
- Premium features properly gated
- Analytics tracking key metrics
- Documentation complete and accessible
- Marketplace listing ready with professional materials
- Launch plan with timeline and promotional strategy
- 30-day refund policy clearly stated
- Privacy policy and terms of service published

</success_criteria>

<marketing_strategy>

## Launch Plan

**Pre-launch** (2 weeks before):
- Beta test with 20-50 developers
- Gather testimonials
- Create demo video/GIF
- Build email list via landing page

**Launch day**:
- Publish to VS Code Marketplace
- Post on: Reddit r/vscode, Hacker News, Twitter/X, LinkedIn
- Email beta testers with launch announcement
- Product Hunt submission

**Post-launch** (ongoing):
- Weekly blog posts about AI coding best practices
- Engage with users on social media
- Iterate based on feedback
- Build integrations with popular AI tools
- Expand to other IDEs (JetBrains, etc.)

**Growth tactics**:
- Affiliate program (20% commission for referrals)
- Student/education outreach
- Partnership with AI tool makers
- Conference talks about AI supervision

</marketing_strategy>

<notes>

## Pricing Considerations

Competitor analysis:
- GitHub Copilot: $10/month
- Cursor: $20/month
- Tabnine: $12/month

Suggested pricing:
- **Free**: Core supervision, single project, basic alerts
- **Premium**: $12/month or $100/year
  - Advanced deviation detection
  - Multi-project support
  - Cloud backup
  - Team features
  - Priority support

Consider offering **early adopter discount**: 50% off for first 100 customers.

## Legal Requirements

- Privacy policy (GDPR-compliant)
- Terms of service
- Refund policy
- EULA for software

Consult a lawyer for these documents or use templates from similar products.

</notes>
