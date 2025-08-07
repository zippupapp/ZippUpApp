# ZippUp Platform Deployment Guide

This guide covers the complete deployment process for the ZippUp platform across all components.

## Prerequisites

### Required Software
- Node.js 18+ 
- Flutter SDK 3.10+
- PostgreSQL 13+
- Redis (optional, for real-time features)
- Git

### Required Accounts & API Keys
- [Vercel](https://vercel.com) account for web hosting
- [PostgreSQL](https://www.postgresql.org/) database (Vercel Postgres, Supabase, or self-hosted)
- [Twilio](https://www.twilio.com) for SMS/WhatsApp
- [Stripe](https://stripe.com) for payments
- [OpenAI](https://openai.com) for AI search
- [Google Cloud](https://cloud.google.com) for Maps API
- [Firebase](https://firebase.google.com) for mobile notifications

## 🗄️ Database Setup

### 1. Create PostgreSQL Database

#### Option A: Vercel Postgres (Recommended)
```bash
# Install Vercel CLI
npm i -g vercel

# Login to Vercel
vercel login

# Create database
vercel postgres create zippup-db
```

#### Option B: Supabase
1. Go to [Supabase](https://supabase.com)
2. Create new project
3. Get connection string from Settings > Database

#### Option C: Self-hosted
```bash
# Install PostgreSQL
sudo apt-get install postgresql postgresql-contrib

# Create database
sudo -u postgres createdb zippup
sudo -u postgres createuser zippup_user
sudo -u postgres psql -c "ALTER USER zippup_user PASSWORD 'your_password';"
sudo -u postgres psql -c "GRANT ALL PRIVILEGES ON DATABASE zippup TO zippup_user;"
```

### 2. Run Database Migrations

```bash
# Navigate to project root
cd zippup-platform

# Install dependencies
npm install

# Set up environment variables (see next section)
cp .env.example .env.local

# Generate Prisma client
npm run prisma:generate

# Run migrations
npm run prisma:migrate
```

## 🔧 Environment Configuration

### 1. Create Environment Files

```bash
# Web app environment
cp .env.example web/.env.local

# Mobile app environment (if using backend features)
cp .env.example mobile/.env
```

### 2. Configure Environment Variables

Update `.env.local` with your actual values:

```env
# Database
DATABASE_URL="postgresql://username:password@host:5432/zippup"

# Authentication
JWT_SECRET="your-super-secret-jwt-key-min-32-chars"
NEXTAUTH_SECRET="your-nextauth-secret"
NEXTAUTH_URL="https://your-domain.com"

# Twilio (SMS/WhatsApp)
TWILIO_ACCOUNT_SID="ACxxxxxxxxxxxxx"
TWILIO_AUTH_TOKEN="your-auth-token"
TWILIO_PHONE_NUMBER="+1234567890"

# Stripe
STRIPE_PUBLISHABLE_KEY="pk_live_..."
STRIPE_SECRET_KEY="sk_live_..."
STRIPE_WEBHOOK_SECRET="whsec_..."

# Google Maps
GOOGLE_MAPS_API_KEY="your-google-maps-api-key"

# OpenAI
OPENAI_API_KEY="sk-..."

# App URLs
NEXT_PUBLIC_APP_URL="https://your-domain.com"
NEXT_PUBLIC_API_URL="https://your-domain.com/api"
```

## 🌐 Web Application Deployment

### Deploy to Vercel (Recommended)

1. **Connect Repository**
   ```bash
   # Push to GitHub/GitLab
   git add .
   git commit -m "Initial ZippUp platform setup"
   git push origin main
   ```

2. **Deploy via Vercel Dashboard**
   - Go to [Vercel Dashboard](https://vercel.com/dashboard)
   - Click "New Project"
   - Import your repository
   - Set build settings:
     - Framework Preset: Next.js
     - Root Directory: `web`
     - Build Command: `npm run build`
     - Output Directory: `web/.next`

3. **Configure Environment Variables**
   - In Vercel dashboard, go to Project Settings > Environment Variables
   - Add all variables from your `.env.local`

4. **Deploy**
   ```bash
   vercel --prod
   ```

### Deploy via CLI

```bash
# Install Vercel CLI
npm i -g vercel

# Login
vercel login

# Deploy
cd web
vercel --prod
```

## 📱 Mobile App Deployment

### Android Deployment

1. **Prepare for Release**
   ```bash
   cd mobile
   
   # Generate keystore
   keytool -genkey -v -keystore ~/upload-keystore.jks -keyalg RSA -keysize 2048 -validity 10000 -alias upload
   ```

2. **Configure Signing**
   Create `android/key.properties`:
   ```
   storePassword=your-keystore-password
   keyPassword=your-key-password
   keyAlias=upload
   storeFile=/path/to/upload-keystore.jks
   ```

3. **Build APK/AAB**
   ```bash
   # Build APK
   flutter build apk --release
   
   # Build AAB (recommended for Play Store)
   flutter build appbundle --release
   ```

4. **Deploy to Google Play Store**
   - Go to [Google Play Console](https://play.google.com/console)
   - Create new app
   - Upload AAB file
   - Complete store listing
   - Submit for review

### iOS Deployment

1. **Configure Xcode Project**
   ```bash
   cd mobile
   open ios/Runner.xcworkspace
   ```

2. **Set up Signing & Capabilities**
   - Select Runner target
   - Set Team and Bundle Identifier
   - Enable required capabilities (Location, Push Notifications, etc.)

3. **Build for Release**
   ```bash
   flutter build ios --release
   ```

4. **Deploy to App Store**
   - Archive in Xcode
   - Upload to App Store Connect
   - Complete app information
   - Submit for review

## 🔧 API Configuration

### 1. Set up Webhook Endpoints

Configure webhooks in your service providers:

#### Stripe Webhooks
```bash
# Stripe CLI (for testing)
stripe listen --forward-to localhost:3000/api/webhooks/stripe

# Production webhook URL
https://your-domain.com/api/webhooks/stripe
```

#### Twilio Webhooks
Configure in Twilio Console:
- SMS Status: `https://your-domain.com/api/webhooks/twilio/sms`
- WhatsApp: `https://your-domain.com/api/webhooks/twilio/whatsapp`

### 2. Configure CORS

Update `next.config.js` for production domains:

```javascript
async headers() {
  return [
    {
      source: '/api/:path*',
      headers: [
        { key: 'Access-Control-Allow-Origin', value: 'https://your-domain.com' },
        // ... other headers
      ],
    },
  ];
}
```

## 🔒 Security Configuration

### 1. Environment Security

```bash
# Use Vercel CLI to set secure environment variables
vercel env add JWT_SECRET production
vercel env add DATABASE_URL production
vercel env add STRIPE_SECRET_KEY production
```

### 2. Database Security

```sql
-- Create read-only user for analytics
CREATE USER analytics_user WITH PASSWORD 'secure_password';
GRANT SELECT ON ALL TABLES IN SCHEMA public TO analytics_user;

-- Revoke unnecessary permissions
REVOKE ALL ON SCHEMA public FROM PUBLIC;
```

### 3. Rate Limiting

Enable rate limiting in production:

```javascript
// In your API routes
import rateLimit from 'express-rate-limit'

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100 // limit each IP to 100 requests per windowMs
})
```

## 📊 Monitoring & Analytics

### 1. Error Monitoring

Install Sentry:

```bash
npm install @sentry/nextjs @sentry/flutter
```

Configure:

```javascript
// web/sentry.client.config.js
import * as Sentry from '@sentry/nextjs'

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  environment: process.env.NODE_ENV,
})
```

### 2. Performance Monitoring

Add to `vercel.json`:

```json
{
  "functions": {
    "web/src/app/api/**/*.ts": {
      "runtime": "nodejs18.x",
      "maxDuration": 10
    }
  }
}
```

### 3. Database Monitoring

```sql
-- Enable query logging
ALTER SYSTEM SET log_statement = 'all';
ALTER SYSTEM SET log_min_duration_statement = 1000;
SELECT pg_reload_conf();
```

## 🚀 Production Checklist

### Pre-deployment
- [ ] All environment variables set
- [ ] Database migrations run
- [ ] SSL certificates configured
- [ ] Webhooks endpoints tested
- [ ] Error monitoring setup
- [ ] Backup strategy implemented

### Security
- [ ] JWT secrets are strong (32+ characters)
- [ ] Database credentials secured
- [ ] API rate limiting enabled
- [ ] CORS properly configured
- [ ] Sensitive data encrypted

### Performance
- [ ] Database indexes optimized
- [ ] Image optimization enabled
- [ ] CDN configured for static assets
- [ ] Caching strategy implemented
- [ ] Bundle size optimized

### Mobile
- [ ] App signing configured
- [ ] Push notifications tested
- [ ] App permissions minimal
- [ ] Offline functionality tested
- [ ] Store listings complete

### Emergency Features
- [ ] SMS/WhatsApp integration tested
- [ ] Emergency contacts system working
- [ ] Location tracking functional
- [ ] Admin dashboard accessible
- [ ] Panic button thoroughly tested

## 🛠️ Maintenance

### Regular Tasks

```bash
# Update dependencies
npm audit fix
flutter pub upgrade

# Database maintenance
npm run prisma:migrate deploy

# Monitor logs
vercel logs
```

### Backup Strategy

```bash
# Daily database backup
pg_dump $DATABASE_URL > backup_$(date +%Y%m%d).sql

# Weekly full backup with compression
pg_dump $DATABASE_URL | gzip > backup_$(date +%Y%m%d).sql.gz
```

### Health Checks

Create monitoring endpoints:

```typescript
// web/src/app/api/health/route.ts
export async function GET() {
  // Check database connection
  // Check external services
  // Return health status
}
```

## 🆘 Troubleshooting

### Common Issues

1. **Database Connection Issues**
   ```bash
   # Test connection
   psql $DATABASE_URL -c "SELECT 1"
   
   # Check connection pool
   npm run prisma:studio
   ```

2. **Build Failures**
   ```bash
   # Clear cache
   rm -rf .next node_modules
   npm install
   npm run build
   ```

3. **Mobile Build Issues**
   ```bash
   # Flutter clean
   flutter clean
   flutter pub get
   flutter build apk
   ```

### Support Resources

- [Next.js Documentation](https://nextjs.org/docs)
- [Flutter Documentation](https://flutter.dev/docs)
- [Prisma Documentation](https://www.prisma.io/docs)
- [Vercel Documentation](https://vercel.com/docs)

## 📈 Scaling Considerations

### Database Scaling
- Implement read replicas for analytics
- Use connection pooling (PgBouncer)
- Consider database sharding for large datasets

### Application Scaling
- Enable Vercel Pro for better performance
- Implement Redis for session storage
- Use CDN for static assets

### Mobile Scaling
- Implement offline-first architecture
- Use background sync for data
- Optimize for low-bandwidth connections

---

For additional support, contact the ZippUp development team or create an issue in the repository.