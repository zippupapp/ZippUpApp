# 🌐 Frontend Deployment Guide

**Purpose:** Deploy ZippUp frontend to production  
**Last Updated:** [Current Date]

## 🎯 **Overview**

This guide covers deploying your ZippUp frontend application to production using Vercel (recommended) or Netlify.

## 📋 **Prerequisites**

Before starting, ensure you have:
- [ ] Frontend code ready in `zippup-pwa` repository
- [ ] Production environment variables configured
- [ ] Domain name purchased and configured
- [ ] SSL certificates ready
- [ ] Production API endpoints configured

## 🚀 **Section 1: Vercel Deployment (Recommended)**

### 1.1 Create Vercel Account

**Step 1: Sign Up**
1. Go to [vercel.com](https://vercel.com)
2. Sign up with your GitHub account
3. Complete account setup
4. Verify email address

### 1.2 Import Repository

**Step 1: Import Project**
1. Click "New Project"
2. Select "Import Git Repository"
3. Choose your `zippup-pwa` repository
4. Click "Import"

**Step 2: Configure Project**
- **Project Name**: `zippup-frontend`
- **Framework Preset**: Next.js
- **Root Directory**: `./` (or your frontend directory)
- **Build Command**: `npm run build`
- **Output Directory**: `.next`
- **Install Command**: `npm install`

### 1.3 Environment Variables

**Required Variables:**
```env
# App Configuration
NEXT_PUBLIC_APP_URL="https://your-domain.com"
NEXT_PUBLIC_API_URL="https://your-backend-domain.com"

# Payment Integration
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY="pk_live_[YOUR-LIVE-KEY]"

# Maps & Location
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY="[YOUR-GOOGLE-MAPS-KEY]"

# Analytics
NEXT_PUBLIC_GOOGLE_ANALYTICS_ID="GA-[YOUR-ID]"

# Emergency Services
NEXT_PUBLIC_EMERGENCY_ENABLED="true"
NEXT_PUBLIC_EMERGENCY_NUMBER="911"
```

**Set in Vercel:**
1. Go to Project Settings → Environment Variables
2. Add each variable
3. Set environment to "Production"
4. Click "Save"

### 1.4 Custom Domain

**Step 1: Add Domain**
1. Go to Project Settings → Domains
2. Click "Add Domain"
3. Enter your domain: `your-domain.com`
4. Click "Add"

**Step 2: Configure DNS**
Vercel will provide DNS records to add to your domain provider:

```
Type: A
Name: @
Value: 76.76.19.76

Type: CNAME
Name: www
Value: cname.vercel-dns.com
```

**Step 3: Verify Domain**
1. Wait for DNS propagation (up to 48 hours)
2. Vercel will automatically provision SSL certificate
3. Domain status should show "Valid"

### 1.5 Build Configuration

**vercel.json (Optional):**
```json
{
  "version": 2,
  "builds": [
    {
      "src": "package.json",
      "use": "@vercel/next"
    }
  ],
  "routes": [
    {
      "src": "/api/(.*)",
      "dest": "/api/$1"
    }
  ],
  "headers": [
    {
      "source": "/(.*)",
      "headers": [
        {
          "key": "X-Frame-Options",
          "value": "DENY"
        },
        {
          "key": "X-Content-Type-Options",
          "value": "nosniff"
        },
        {
          "key": "Referrer-Policy",
          "value": "strict-origin-when-cross-origin"
        }
      ]
    }
  ]
}
```

## 🌐 **Section 2: Netlify Alternative**

### 2.1 Create Netlify Account

**Step 1: Sign Up**
1. Go to [netlify.com](https://netlify.com)
2. Sign up with your GitHub account
3. Complete account setup

### 2.2 Import Repository

**Step 1: Import Project**
1. Click "New site from Git"
2. Choose GitHub
3. Select your `zippup-pwa` repository
4. Configure build settings

**Step 2: Build Settings**
- **Build command**: `npm run build`
- **Publish directory**: `.next`
- **Node version**: 18.x

### 2.3 Environment Variables

**Set in Netlify:**
1. Go to Site Settings → Environment Variables
2. Add each production environment variable
3. Set environment to "Production"

### 2.4 Custom Domain

**Step 1: Add Domain**
1. Go to Site Settings → Domain Management
2. Click "Add custom domain"
3. Enter your domain
4. Configure DNS records

## 🔧 **Section 3: Build Optimization**

### 3.1 Next.js Configuration

**next.config.js:**
```javascript
/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    appDir: true,
  },
  images: {
    domains: ['your-image-domain.com'],
  },
  env: {
    CUSTOM_KEY: process.env.CUSTOM_KEY,
  },
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
        ],
      },
    ]
  },
}

module.exports = nextConfig
```

### 3.2 Performance Optimization

**Bundle Analysis:**
```bash
# Install bundle analyzer
npm install --save-dev @next/bundle-analyzer

# Add to next.config.js
const withBundleAnalyzer = require('@next/bundle-analyzer')({
  enabled: process.env.ANALYZE === 'true',
})

module.exports = withBundleAnalyzer(nextConfig)
```

**Image Optimization:**
```javascript
// Use Next.js Image component
import Image from 'next/image'

<Image
  src="/hero-image.jpg"
  alt="Hero"
  width={1200}
  height={600}
  priority
  placeholder="blur"
  blurDataURL="data:image/jpeg;base64,..."
/>
```

## 📊 **Section 4: Analytics & Monitoring**

### 4.1 Google Analytics

**Installation:**
```bash
npm install gtag
```

**Configuration:**
```javascript
// pages/_app.js or app/layout.js
import Script from 'next/script'

export default function RootLayout({ children }) {
  return (
    <html>
      <head>
        <Script
          strategy="afterInteractive"
          src={`https://www.googletagmanager.com/gtag/js?id=${process.env.NEXT_PUBLIC_GOOGLE_ANALYTICS_ID}`}
        />
        <Script
          id="gtag-init"
          strategy="afterInteractive"
          dangerouslySetInnerHTML={{
            __html: `
              window.dataLayer = window.dataLayer || [];
              function gtag(){dataLayer.push(arguments);}
              gtag('js', new Date());
              gtag('config', '${process.env.NEXT_PUBLIC_GOOGLE_ANALYTICS_ID}');
            `,
          }}
        />
      </head>
      <body>{children}</body>
    </html>
  )
}
```

### 4.2 Error Tracking (Sentry)

**Installation:**
```bash
npm install @sentry/nextjs
```

**Configuration:**
```javascript
// sentry.client.config.js
import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  tracesSampleRate: 1.0,
});
```

## 🔒 **Section 5: Security Configuration**

### 5.1 Security Headers

**next.config.js:**
```javascript
async headers() {
  return [
    {
      source: '/(.*)',
      headers: [
        {
          key: 'X-Frame-Options',
          value: 'DENY',
        },
        {
          key: 'X-Content-Type-Options',
          value: 'nosniff',
        },
        {
          key: 'Referrer-Policy',
          value: 'strict-origin-when-cross-origin',
        },
        {
          key: 'Permissions-Policy',
          value: 'camera=(), microphone=(), geolocation=()',
        },
      ],
    },
  ]
}
```

### 5.2 Content Security Policy

**Add CSP Header:**
```javascript
{
  key: 'Content-Security-Policy',
  value: `
    default-src 'self';
    script-src 'self' 'unsafe-eval' 'unsafe-inline' https://www.googletagmanager.com;
    style-src 'self' 'unsafe-inline';
    img-src 'self' data: https:;
    font-src 'self';
    connect-src 'self' https://api.your-domain.com;
    frame-src 'none';
    object-src 'none';
  `.replace(/\s{2,}/g, ' ').trim()
}
```

## 🧪 **Section 6: Testing**

### 6.1 Pre-Deployment Testing

**Local Testing:**
```bash
# Build locally
npm run build

# Test production build
npm start

# Run tests
npm test

# Run linting
npm run lint
```

**Performance Testing:**
```bash
# Install Lighthouse CI
npm install -g @lhci/cli

# Run Lighthouse
lhci autorun
```

### 6.2 Post-Deployment Testing

**Functionality Testing:**
- [ ] Home page loads correctly
- [ ] Navigation works
- [ ] Forms submit properly
- [ ] Payment integration works
- [ ] Emergency features functional
- [ ] Mobile responsiveness

**Performance Testing:**
- [ ] Page load times < 3 seconds
- [ ] Core Web Vitals pass
- [ ] Mobile performance good
- [ ] Image optimization working

## 🚀 **Section 7: Deployment Process**

### 7.1 Deployment Checklist

**Pre-Deployment:**
- [ ] Code reviewed and tested
- [ ] Environment variables set
- [ ] Build successful locally
- [ ] Tests passing
- [ ] Performance optimized

**Deployment:**
- [ ] Push to main branch
- [ ] Vercel/Netlify auto-deploys
- [ ] Build successful
- [ ] Domain configured
- [ ] SSL certificate active

**Post-Deployment:**
- [ ] Site accessible
- [ ] All features working
- [ ] Performance monitoring active
- [ ] Error tracking configured
- [ ] Analytics working

### 7.2 Deployment Commands

**Manual Deployment:**
```bash
# Vercel
vercel --prod

# Netlify
netlify deploy --prod
```

**Automated Deployment:**
- Push to main branch triggers auto-deploy
- Configure deployment settings in dashboard
- Set up deployment notifications

## 📱 **Section 8: Mobile Optimization**

### 8.1 PWA Configuration

**next.config.js:**
```javascript
const withPWA = require('next-pwa')({
  dest: 'public',
  register: true,
  skipWaiting: true,
  disable: process.env.NODE_ENV === 'development'
})

module.exports = withPWA(nextConfig)
```

**manifest.json:**
```json
{
  "name": "ZippUp - On-Demand Services & Emergency",
  "short_name": "ZippUp",
  "description": "Your trusted partner for on-demand services and emergency assistance",
  "start_url": "/",
  "display": "standalone",
  "background_color": "#ffffff",
  "theme_color": "#3b82f6",
  "icons": [
    {
      "src": "/icon-192x192.png",
      "sizes": "192x192",
      "type": "image/png"
    },
    {
      "src": "/icon-512x512.png",
      "sizes": "512x512",
      "type": "image/png"
    }
  ]
}
```

### 8.2 Mobile Performance

**Optimizations:**
- [ ] Responsive images
- [ ] Touch-friendly buttons
- [ ] Fast loading on mobile
- [ ] Offline functionality
- [ ] Mobile-first design

## 🔍 **Section 9: Monitoring & Maintenance**

### 9.1 Performance Monitoring

**Tools:**
- Vercel Analytics
- Google PageSpeed Insights
- WebPageTest
- Lighthouse CI
- Real User Monitoring (RUM)

**Key Metrics:**
- [ ] First Contentful Paint (FCP) < 1.8s
- [ ] Largest Contentful Paint (LCP) < 2.5s
- [ ] First Input Delay (FID) < 100ms
- [ ] Cumulative Layout Shift (CLS) < 0.1

### 9.2 Error Monitoring

**Sentry Dashboard:**
- Monitor error rates
- Track performance issues
- Set up alerts
- Review error trends
- Fix critical issues

### 9.3 Regular Maintenance

**Weekly:**
- [ ] Review performance metrics
- [ ] Check error rates
- [ ] Monitor user feedback
- [ ] Review analytics

**Monthly:**
- [ ] Performance optimization
- [ ] Security updates
- [ ] Dependency updates
- [ ] User experience improvements

## 🆘 **Section 10: Troubleshooting**

### 10.1 Common Issues

**Build Failures:**
- Check environment variables
- Verify dependencies
- Review build logs
- Check Node.js version

**Deployment Issues:**
- Verify domain configuration
- Check DNS settings
- Review SSL certificate
- Check build output

**Performance Issues:**
- Analyze bundle size
- Optimize images
- Review third-party scripts
- Check Core Web Vitals

### 10.2 Support Resources

**Vercel Support:**
- [Vercel Documentation](https://vercel.com/docs)
- [Vercel Support](https://vercel.com/support)
- [Vercel Community](https://github.com/vercel/vercel/discussions)

**Next.js Support:**
- [Next.js Documentation](https://nextjs.org/docs)
- [Next.js GitHub](https://github.com/vercel/next.js)
- [Next.js Community](https://github.com/vercel/next.js/discussions)

## 🎯 **Next Steps**

1. **Complete Frontend Setup**
   - Follow this deployment guide
   - Configure all environment variables
   - Test thoroughly

2. **Deploy to Production**
   - Choose Vercel or Netlify
   - Configure custom domain
   - Set up SSL certificate

3. **Monitor & Optimize**
   - Set up analytics
   - Monitor performance
   - Track user feedback
   - Continuous improvement

---

**💡 Pro Tip:** Start with Vercel for the easiest deployment experience and excellent Next.js integration.

**Good luck with your frontend deployment! 🚀**