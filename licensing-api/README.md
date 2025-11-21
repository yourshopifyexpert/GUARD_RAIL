# AI Supervisor - Licensing API

Serverless API for license management, validation, and Stripe payment integration.

## Features

- JWT-based license key generation
- Secure license validation with offline grace period
- 14-day free trial system
- Stripe subscription integration
- Webhook handling for subscription events
- License activation tracking
- PostgreSQL database with Prisma ORM

## Project Structure

```
licensing-api/
├── api/                      # API endpoints
│   ├── generate-key.ts      # Generate new license keys
│   ├── validate-key.ts      # Validate license keys
│   └── activate-trial.ts    # Activate free trials
├── stripe/                   # Stripe integration
│   ├── create-checkout.ts   # Create Stripe checkout session
│   ├── webhook.ts           # Handle Stripe webhooks
│   └── create-portal-session.ts  # Customer portal
├── lib/                      # Utilities
│   ├── jwt.ts               # JWT signing/verification
│   ├── db.ts                # Prisma client
│   ├── stripe.ts            # Stripe client
│   └── license-utils.ts     # License helpers
├── database/
│   └── schema.prisma        # Database schema
├── types/
│   └── index.ts             # TypeScript types
└── package.json
```

## API Endpoints

### POST `/api/generate-key`

Generate a new license key (admin only).

**Headers:**
```
Authorization: Bearer <ADMIN_API_KEY>
Content-Type: application/json
```

**Request:**
```json
{
  "email": "user@example.com",
  "name": "John Doe",
  "type": "individual",
  "billingPeriod": "monthly",
  "stripeSubscriptionId": "sub_xxxxx"
}
```

**Response:**
```json
{
  "success": true,
  "license": {
    "id": "abc123",
    "key": "eyJhbGciOiJIUzI1NiIs...",
    "type": "individual",
    "status": "active",
    "expiresAt": "2024-12-31T23:59:59Z",
    "maxActivations": 3
  },
  "user": {
    "id": "user123",
    "email": "user@example.com",
    "name": "John Doe"
  }
}
```

### POST `/api/validate-key`

Validate a license key and optionally activate on a machine.

**Request:**
```json
{
  "licenseKey": "eyJhbGciOiJIUzI1NiIs...",
  "machineId": "machine-uuid-123",
  "metadata": {
    "vscodeVersion": "1.85.0",
    "extensionVersion": "1.0.0",
    "os": "darwin"
  }
}
```

**Response (Valid):**
```json
{
  "valid": true,
  "license": {
    "id": "abc123",
    "type": "individual",
    "status": "active",
    "expiresAt": "2024-12-31T23:59:59Z",
    "maxActivations": 3,
    "currentActivations": 1,
    "email": "user@example.com"
  }
}
```

**Response (Invalid):**
```json
{
  "valid": false,
  "reason": "License expired"
}
```

### POST `/api/activate-trial`

Activate a 14-day free trial.

**Request:**
```json
{
  "email": "user@example.com",
  "name": "John Doe",
  "machineId": "machine-uuid-123",
  "metadata": {
    "vscodeVersion": "1.85.0",
    "extensionVersion": "1.0.0",
    "os": "darwin"
  }
}
```

**Response:**
```json
{
  "success": true,
  "message": "Trial activated successfully",
  "license": {
    "id": "trial123",
    "key": "eyJhbGciOiJIUzI1NiIs...",
    "type": "trial",
    "status": "active",
    "expiresAt": "2024-02-01T00:00:00Z",
    "daysRemaining": 14
  }
}
```

### POST `/stripe/create-checkout`

Create a Stripe checkout session for subscription purchase.

**Request:**
```json
{
  "email": "user@example.com",
  "name": "John Doe",
  "type": "individual",
  "billingPeriod": "monthly",
  "successUrl": "https://ai-supervisor.com/success",
  "cancelUrl": "https://ai-supervisor.com/cancel"
}
```

**Response:**
```json
{
  "success": true,
  "sessionId": "cs_xxxxx",
  "url": "https://checkout.stripe.com/..."
}
```

### POST `/stripe/webhook`

Handle Stripe webhook events (internal endpoint).

**Supported Events:**
- `checkout.session.completed` - Create license after successful checkout
- `customer.subscription.created` - Initialize license on subscription start
- `customer.subscription.updated` - Update license expiration
- `customer.subscription.deleted` - Cancel license
- `invoice.payment_succeeded` - Renew license
- `invoice.payment_failed` - Suspend license

### POST `/stripe/create-portal-session`

Create a Stripe customer portal session for managing subscriptions.

**Request:**
```json
{
  "email": "user@example.com",
  "returnUrl": "https://ai-supervisor.com/dashboard"
}
```

**Response:**
```json
{
  "success": true,
  "url": "https://billing.stripe.com/session/..."
}
```

## License Types

| Type | Description | Max Activations | Duration |
|------|-------------|-----------------|----------|
| `free` | Free tier | N/A | Indefinite |
| `trial` | 14-day trial | 1 | 14 days |
| `individual` | Individual license | 3 | Based on billing |
| `team` | Team license | 25 | Based on billing |
| `student` | Student discount (50% off) | 3 | Based on billing |
| `oss` | Open source contributor | 3 | 1 year (renewable) |

## License States

- `active` - License is valid and active
- `expired` - License has expired
- `cancelled` - Subscription was cancelled
- `suspended` - Payment failed, in grace period
- `grace_period` - Offline validation grace period (7 days)

## Setup

### 1. Install Dependencies

```bash
npm install
```

### 2. Configure Environment

```bash
cp .env.example .env
# Edit .env with your values
```

### 3. Set Up Database

```bash
# Generate Prisma client
npx prisma generate

# Run migrations
npx prisma migrate dev

# (Optional) Open Prisma Studio
npx prisma studio
```

### 4. Development

```bash
# Run locally with Vercel Dev
npm run dev

# Access at http://localhost:3000
```

### 5. Deployment

```bash
# Deploy to Vercel
npm run deploy
```

## Security

### JWT Secret

Generate a strong JWT secret:

```bash
openssl rand -base64 32
```

Store in `LICENSE_JWT_SECRET` environment variable.

### Admin API Key

Generate an admin API key:

```bash
openssl rand -hex 32
```

Store in `ADMIN_API_KEY` environment variable.

### Stripe Webhook Secret

Get from Stripe Dashboard > Developers > Webhooks after creating webhook endpoint.

## Grace Period

The API implements a 7-day offline grace period:

1. License validation happens every 24 hours
2. If validation fails (no internet), license remains valid for 7 days
3. After 7 days without successful validation, license expires
4. Once online, validation resumes immediately

## Rate Limiting

Implement rate limiting for production:

```typescript
import rateLimit from 'express-rate-limit';

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100 // limit each IP to 100 requests per windowMs
});

app.use('/api/', limiter);
```

## Monitoring

### Database Queries

Monitor these metrics:
- Active licenses by type
- Trial conversion rate
- Average activations per license
- Expiring licenses (next 7 days)
- Failed validations

### Stripe Events

Monitor webhook delivery in Stripe Dashboard:
- Successful deliveries
- Failed webhooks
- Retry attempts

## Testing

### Unit Tests

```bash
npm test
```

### Integration Tests

```bash
# Test trial activation
curl -X POST http://localhost:3000/api/activate-trial \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","machineId":"test-123"}'

# Test validation
curl -X POST http://localhost:3000/api/validate-key \
  -H "Content-Type: application/json" \
  -d '{"licenseKey":"YOUR_KEY","machineId":"test-123"}'
```

### Stripe Testing

Use [Stripe test cards](https://stripe.com/docs/testing):

- Success: `4242 4242 4242 4242`
- Decline: `4000 0000 0000 0002`
- Requires auth: `4000 0025 0000 3155`

## Troubleshooting

### License Validation Always Fails

Check:
1. JWT secret matches across all deployments
2. Database connection is working
3. License exists in database
4. License hasn't expired

### Stripe Webhook Not Working

Check:
1. Webhook URL is publicly accessible
2. Webhook secret matches Stripe Dashboard
3. Correct events are selected
4. SSL certificate is valid

### Database Connection Issues

Check:
1. `DATABASE_URL` is correct
2. Database is accessible from serverless function
3. Connection pooling is configured
4. SSL is enabled if required

## License

MIT License - See LICENSE file for details.

## Support

- Email: support@ai-supervisor.com
- Documentation: https://ai-supervisor.com/docs
- Issues: https://github.com/your-org/ai-supervisor/issues
