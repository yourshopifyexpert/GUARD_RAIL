# AI Supervisor - Quick Start Guide

Get the licensing system up and running in 30 minutes.

## Prerequisites

- Node.js 18+ installed
- PostgreSQL database (or use free tier from Neon/Supabase)
- Stripe account (use test mode initially)
- Vercel account (free tier works)

## 5-Step Quick Start

### Step 1: Database Setup (5 minutes)

**Option A: Use Neon (Recommended)**

1. Go to [neon.tech](https://neon.tech)
2. Sign up and create a new project
3. Copy the connection string
4. Done!

**Option B: Local PostgreSQL**

```bash
# Install PostgreSQL
brew install postgresql  # macOS
# or
sudo apt install postgresql  # Linux

# Create database
createdb ai_supervisor_licenses
```

### Step 2: Configure Licensing API (10 minutes)

```bash
cd licensing-api

# Install dependencies
npm install

# Create environment file
cp .env.example .env

# Generate secrets
echo "LICENSE_JWT_SECRET=$(openssl rand -base64 32)" >> .env
echo "ADMIN_API_KEY=$(openssl rand -hex 32)" >> .env

# Add your database URL
# Edit .env and set DATABASE_URL
nano .env

# Run database migrations
npx prisma migrate dev --name init

# Generate Prisma client
npx prisma generate
```

### Step 3: Stripe Setup (10 minutes)

1. **Create Stripe Account**
   - Go to [stripe.com](https://stripe.com)
   - Sign up and complete verification
   - Switch to **Test Mode** (toggle in dashboard)

2. **Create Products**
   - Go to Products > Add Product
   - Create "Individual Monthly" - $12/month
   - Create "Individual Annual" - $100/year
   - Copy each Price ID (format: `price_xxxxx`)

3. **Get API Keys**
   - Go to Developers > API Keys
   - Copy "Secret key" (starts with `sk_test_`)
   - Add to `.env` file:

```env
STRIPE_SECRET_KEY=sk_test_...
STRIPE_PRICE_INDIVIDUAL_MONTHLY=price_...
STRIPE_PRICE_INDIVIDUAL_ANNUAL=price_...
```

4. **Create Webhook**
   - We'll do this after deployment (Step 4)

### Step 4: Deploy to Vercel (5 minutes)

```bash
# Install Vercel CLI
npm install -g vercel

# Login to Vercel
vercel login

# Deploy
cd licensing-api
vercel --prod

# Add environment variables
vercel env add DATABASE_URL
vercel env add LICENSE_JWT_SECRET
vercel env add ADMIN_API_KEY
vercel env add STRIPE_SECRET_KEY
vercel env add STRIPE_PRICE_INDIVIDUAL_MONTHLY
vercel env add STRIPE_PRICE_INDIVIDUAL_ANNUAL

# Redeploy with env vars
vercel --prod
```

**Note your deployment URL**: `https://your-project.vercel.app`

### Step 5: Configure Stripe Webhook

1. Go to Stripe Dashboard > Developers > Webhooks
2. Click "Add endpoint"
3. Endpoint URL: `https://your-project.vercel.app/stripe/webhook`
4. Select events:
   - `checkout.session.completed`
   - `customer.subscription.created`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
   - `invoice.payment_succeeded`
   - `invoice.payment_failed`
5. Copy the "Signing secret" (starts with `whsec_`)
6. Add to Vercel:

```bash
vercel env add STRIPE_WEBHOOK_SECRET
# Paste the webhook secret
# Redeploy
vercel --prod
```

## Test Your Setup

### 1. Test Trial Activation

```bash
curl -X POST https://your-project.vercel.app/api/activate-trial \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "machineId": "test-machine-123"
  }'
```

Expected response:
```json
{
  "success": true,
  "message": "Trial activated successfully",
  "license": {
    "key": "eyJhbGc...",
    "type": "trial",
    "status": "active",
    "expiresAt": "2024-...",
    "daysRemaining": 14
  }
}
```

### 2. Test License Validation

```bash
# Use the license key from step 1
curl -X POST https://your-project.vercel.app/api/validate-key \
  -H "Content-Type: application/json" \
  -d '{
    "licenseKey": "YOUR_LICENSE_KEY_HERE",
    "machineId": "test-machine-123"
  }'
```

Expected response:
```json
{
  "valid": true,
  "license": {
    "type": "trial",
    "status": "active",
    ...
  }
}
```

### 3. Test Stripe Checkout

```bash
curl -X POST https://your-project.vercel.app/stripe/create-checkout \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "type": "individual",
    "billingPeriod": "monthly",
    "successUrl": "https://example.com/success",
    "cancelUrl": "https://example.com/cancel"
  }'
```

Expected response:
```json
{
  "success": true,
  "sessionId": "cs_test_...",
  "url": "https://checkout.stripe.com/..."
}
```

Open the URL to test checkout with test card: `4242 4242 4242 4242`

## VS Code Extension Integration

### 1. Update Extension Code

In your VS Code extension, update `src/licensing/LicenseManager.ts`:

```typescript
const LICENSE_API_URL = 'https://your-project.vercel.app';
```

### 2. Test in VS Code

1. Open VS Code
2. Press `F5` to debug extension
3. Open Command Palette (`Cmd+Shift+P`)
4. Run: "AI Supervisor: Show License Panel"
5. Enter your email to activate trial
6. Verify license is activated

## Deploy User Portal (Optional)

```bash
cd user-portal

# Install dependencies
npm install

# Create .env
cp .env.example .env

# Add environment variables
# Edit .env with your values

# Deploy
vercel --prod
```

## Production Checklist

Before going live:

- [ ] Switch Stripe to **Live Mode**
- [ ] Update Stripe API keys in Vercel
- [ ] Create production database
- [ ] Update DATABASE_URL
- [ ] Enable SSL for database
- [ ] Set up database backups
- [ ] Add custom domain (optional)
- [ ] Enable error tracking (Sentry)
- [ ] Test complete purchase flow
- [ ] Set up monitoring
- [ ] Write user documentation
- [ ] Create support email

## Common Issues

### "Database connection failed"

**Fix:** Check DATABASE_URL is correct and database is accessible.

```bash
# Test connection
npx prisma db push
```

### "Stripe webhook verification failed"

**Fix:** Ensure webhook secret matches Stripe Dashboard.

```bash
# Check webhook secret
vercel env pull
cat .env | grep STRIPE_WEBHOOK_SECRET
```

### "License validation always fails"

**Fix:** Ensure JWT secret is the same everywhere.

```bash
# Verify JWT secret
vercel env pull
cat .env | grep LICENSE_JWT_SECRET
```

## Next Steps

1. **Customize Pricing**
   - Add student/team tiers
   - Set up discount codes
   - Configure trial length

2. **Add Features**
   - Email notifications
   - Usage analytics
   - Team management

3. **Marketing**
   - Create landing page
   - Write documentation
   - Launch on Product Hunt

4. **Support**
   - Set up support email
   - Create FAQ
   - Discord community

## Resources

- [Deployment Guide](./DEPLOYMENT.md) - Full deployment instructions
- [License System Overview](./LICENSE-SYSTEM-OVERVIEW.md) - Architecture details
- [API Documentation](./licensing-api/README.md) - API reference
- [Stripe Docs](https://stripe.com/docs) - Payment integration
- [Prisma Docs](https://prisma.io/docs) - Database ORM

## Support

Need help?

- Email: support@ai-supervisor.com
- GitHub Issues: Report bugs or request features
- Documentation: Full guides and tutorials

## Success!

Your licensing system is now live! 🎉

You can now:
- ✅ Accept trial signups
- ✅ Process payments
- ✅ Validate licenses
- ✅ Manage subscriptions

Time to start monetizing your VS Code extension!
