# AI Supervisor - Deployment Guide

Complete guide for deploying the licensing and payment infrastructure for AI Supervisor.

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Database Setup](#database-setup)
3. [Stripe Configuration](#stripe-configuration)
4. [Licensing API Deployment](#licensing-api-deployment)
5. [User Portal Deployment](#user-portal-deployment)
6. [VS Code Extension Configuration](#vs-code-extension-configuration)
7. [Testing](#testing)
8. [Monitoring](#monitoring)

## Prerequisites

- Node.js 18+ installed
- PostgreSQL database (local or cloud)
- Stripe account
- Vercel account (or other serverless platform)
- Git repository access

## Database Setup

### 1. Create PostgreSQL Database

**Option A: Local PostgreSQL**
```bash
createdb ai_supervisor_licenses
```

**Option B: Cloud Database (Recommended)**

Choose one:
- [Neon](https://neon.tech) - Free tier available
- [Supabase](https://supabase.com) - Free tier available
- [Railway](https://railway.app) - Free tier available
- AWS RDS, Google Cloud SQL, or Azure Database

### 2. Configure Database URL

```bash
# Get your connection string in this format:
postgresql://username:password@host:port/database?schema=public
```

### 3. Run Migrations

```bash
cd licensing-api

# Install dependencies
npm install

# Generate Prisma client
npx prisma generate

# Run migrations
npx prisma migrate dev --name init

# (Optional) Seed initial data
npx prisma db seed
```

## Stripe Configuration

### 1. Create Stripe Account

1. Sign up at [stripe.com](https://stripe.com)
2. Complete account verification

### 2. Create Products and Prices

Create the following products in Stripe Dashboard:

**Individual License**
- Monthly: $12/month
- Annual: $100/year (save 2 months)

**Student License**
- Monthly: $6/month (50% off)
- Annual: $50/year

**Team License**
- Monthly: $20/month per seat
- Annual: $180/year per seat

**Copy the Price IDs** (format: `price_xxxxx`)

### 3. Get API Keys

From Stripe Dashboard > Developers > API Keys:
- Copy **Secret Key** (`sk_test_...` for test, `sk_live_...` for production)
- Copy **Publishable Key** (`pk_test_...` or `pk_live_...`)

### 4. Configure Webhooks

1. Go to Stripe Dashboard > Developers > Webhooks
2. Add endpoint: `https://your-api-url.com/stripe/webhook`
3. Select events:
   - `checkout.session.completed`
   - `customer.subscription.created`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
   - `invoice.payment_succeeded`
   - `invoice.payment_failed`
4. Copy **Webhook Secret** (`whsec_...`)

## Licensing API Deployment

### 1. Configure Environment Variables

Create `.env` file in `licensing-api/`:

```bash
cp .env.example .env
```

Edit `.env` with your values:

```env
DATABASE_URL="postgresql://..."
LICENSE_JWT_SECRET="$(openssl rand -base64 32)"
ADMIN_API_KEY="$(openssl rand -hex 32)"
STRIPE_SECRET_KEY="sk_..."
STRIPE_WEBHOOK_SECRET="whsec_..."
STRIPE_PRICE_INDIVIDUAL_MONTHLY="price_..."
STRIPE_PRICE_INDIVIDUAL_ANNUAL="price_..."
STRIPE_PRICE_STUDENT_MONTHLY="price_..."
STRIPE_PRICE_STUDENT_ANNUAL="price_..."
STRIPE_PRICE_TEAM_MONTHLY="price_..."
STRIPE_PRICE_TEAM_ANNUAL="price_..."
NODE_ENV="production"
```

### 2. Deploy to Vercel

**Option A: Vercel CLI**

```bash
cd licensing-api

# Install Vercel CLI
npm install -g vercel

# Login
vercel login

# Deploy
vercel --prod

# Set environment variables
vercel env add DATABASE_URL
vercel env add LICENSE_JWT_SECRET
# ... add all other env vars
```

**Option B: Vercel Dashboard**

1. Connect your GitHub repository
2. Import the `licensing-api` directory
3. Add environment variables in Settings
4. Deploy

### 3. Create vercel.json

```json
{
  "version": 2,
  "builds": [
    {
      "src": "api/**/*.ts",
      "use": "@vercel/node"
    },
    {
      "src": "stripe/**/*.ts",
      "use": "@vercel/node"
    }
  ],
  "routes": [
    {
      "src": "/api/(.*)",
      "dest": "/api/$1"
    },
    {
      "src": "/stripe/(.*)",
      "dest": "/stripe/$1"
    }
  ]
}
```

### 4. Verify Deployment

Test endpoints:

```bash
# Health check
curl https://your-api-url.com/api/health

# Test trial activation (replace with real email)
curl -X POST https://your-api-url.com/api/activate-trial \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","machineId":"test-machine"}'
```

## User Portal Deployment

### 1. Configure Environment Variables

Create `.env` file in `user-portal/`:

```bash
cp .env.example .env
```

Edit `.env`:

```env
DATABASE_URL="postgresql://..."
NEXTAUTH_URL="https://portal.ai-supervisor.com"
NEXTAUTH_SECRET="$(openssl rand -base64 32)"
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY="pk_..."
STRIPE_SECRET_KEY="sk_..."
NEXT_PUBLIC_API_URL="https://api.ai-supervisor.com"
NODE_ENV="production"
```

### 2. Deploy to Vercel

```bash
cd user-portal

# Install dependencies
npm install

# Build
npm run build

# Deploy
vercel --prod
```

### 3. Configure Custom Domain (Optional)

1. In Vercel Dashboard, go to your project
2. Settings > Domains
3. Add domain: `portal.ai-supervisor.com`
4. Configure DNS as instructed

## VS Code Extension Configuration

### 1. Update Extension Configuration

In `vscode-extension/src/licensing/LicenseManager.ts`:

```typescript
const LICENSE_API_URL = 'https://api.ai-supervisor.com';
```

### 2. Build and Package

```bash
cd vscode-extension

# Install dependencies
npm install

# Build
npm run build

# Package extension
vsce package
```

### 3. Publish to VS Code Marketplace

```bash
# Get publisher token from https://dev.azure.com
vsce publish -p <token>
```

## Testing

### 1. Test License Flow

**Activate Trial:**
```bash
curl -X POST https://api.ai-supervisor.com/api/activate-trial \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "machineId": "test-machine-123"
  }'
```

**Validate License:**
```bash
curl -X POST https://api.ai-supervisor.com/api/validate-key \
  -H "Content-Type: application/json" \
  -d '{
    "licenseKey": "eyJhbGc...",
    "machineId": "test-machine-123"
  }'
```

### 2. Test Stripe Integration

1. Use [Stripe test cards](https://stripe.com/docs/testing)
2. Complete checkout with test card: `4242 4242 4242 4242`
3. Verify webhook is called
4. Check that license is created in database

### 3. Test VS Code Extension

1. Install extension in VS Code
2. Open Command Palette (Cmd/Ctrl+Shift+P)
3. Run: "AI Supervisor: Show License Panel"
4. Activate trial or enter license key
5. Verify premium features are unlocked

## Monitoring

### 1. Set Up Error Tracking

**Option A: Sentry**

```bash
npm install @sentry/node

# Add to your API files
import * as Sentry from '@sentry/node';

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  environment: process.env.NODE_ENV
});
```

**Option B: Vercel Analytics**

Enable in Vercel Dashboard > Analytics

### 2. Database Monitoring

Monitor key metrics:
- License activations per day
- Trial conversions
- Subscription renewals
- Failed payments

**Create monitoring queries:**

```sql
-- Active licenses
SELECT type, status, COUNT(*)
FROM "License"
GROUP BY type, status;

-- Trial conversions
SELECT
  COUNT(CASE WHEN type = 'trial' THEN 1 END) as trials,
  COUNT(CASE WHEN type IN ('individual', 'team') THEN 1 END) as paid,
  ROUND(COUNT(CASE WHEN type IN ('individual', 'team') THEN 1 END)::numeric /
        COUNT(CASE WHEN type = 'trial' THEN 1 END) * 100, 2) as conversion_rate
FROM "License";

-- Revenue (approximate)
SELECT
  DATE_TRUNC('month', "issuedAt") as month,
  COUNT(*) as subscriptions,
  SUM(CASE
    WHEN type = 'individual' AND "billingPeriod" = 'monthly' THEN 12
    WHEN type = 'individual' AND "billingPeriod" = 'annual' THEN 100
    WHEN type = 'student' AND "billingPeriod" = 'monthly' THEN 6
    WHEN type = 'student' AND "billingPeriod" = 'annual' THEN 50
    ELSE 0
  END) as mrr
FROM "License"
WHERE status = 'active'
GROUP BY month
ORDER BY month DESC;
```

### 3. Set Up Alerts

Configure alerts for:
- Failed webhook deliveries
- Database connection errors
- High error rates
- Payment failures
- License validation failures

## Security Checklist

- [ ] All environment variables are set correctly
- [ ] JWT secret is cryptographically strong (32+ chars)
- [ ] Admin API key is secure and not exposed
- [ ] Database uses SSL connection
- [ ] Stripe webhook secret is configured
- [ ] CORS is properly configured
- [ ] Rate limiting is enabled
- [ ] Input validation is in place
- [ ] Error messages don't leak sensitive info

## Post-Deployment

1. **Test the complete flow:**
   - User activates trial
   - Trial expires
   - User purchases subscription
   - License is renewed automatically
   - User cancels subscription

2. **Monitor for 24 hours:**
   - Check error logs
   - Verify webhook deliveries
   - Test from different regions

3. **Create documentation:**
   - User guide for license activation
   - FAQ for common issues
   - Support process for license problems

4. **Set up backup:**
   - Database backups (daily)
   - Environment variable backup
   - Disaster recovery plan

## Troubleshooting

### License Validation Fails

1. Check API is accessible
2. Verify JWT secret matches
3. Check database connection
4. Review validation logs

### Stripe Webhook Not Working

1. Verify webhook URL is correct
2. Check webhook secret matches
3. Test webhook in Stripe Dashboard
4. Review webhook logs

### Extension Can't Connect

1. Check API URL in extension
2. Verify CORS settings
3. Test API endpoints manually
4. Check network/firewall settings

## Support

For issues or questions:
- Email: support@ai-supervisor.com
- Documentation: https://ai-supervisor.com/docs
- GitHub Issues: https://github.com/your-org/ai-supervisor/issues

## License

This deployment guide is part of AI Supervisor.
Copyright (c) 2024 AI Supervisor Team.
