# ZippUp - On-Demand Service Super App Platform

ZippUp is a comprehensive, cross-platform on-demand service platform similar to Gojek or Grab, featuring emergency services, marketplace, digital utilities, wallet system, and real-time tracking.

## 🚀 Features

### Core Services
- **Ride & Moving Services** - Fixed price transportation and moving
- **Personal Care** - Hair, massage, beauty services
- **Tech Services** - Device repair and technical support
- **Construction** - Builders, carpenters, contractors
- **Home Services** - Plumbers, cleaners, maintenance
- **Emergency Services** - Ambulance, fire, roadside assistance
- **Marketplace** - Buy and sell goods with escrow system
- **Digital Services** - Airtime, data, bill payments

### Key Features
- 🤖 **AI-Powered Search** - Natural language intent detection
- 📱 **Panic Button** - Emergency alert system with live tracking
- 💰 **Integrated Wallet** - Multi-payment gateway support
- 🔄 **Real-time Communication** - Chat and location sharing
- 🛡️ **Escrow System** - Secure payment processing
- 👥 **Multi-Role Support** - Customer, Provider, Vendor, Admin
- 🌍 **Cross-Platform** - Web, iOS, and Android

## 🛠️ Tech Stack

### Frontend
- **Mobile**: Flutter (iOS & Android)
- **Web**: React + Next.js
- **Admin Panel**: React + Next.js

### Backend
- **API**: Next.js API Routes (Vercel)
- **Database**: PostgreSQL with Prisma ORM
- **Real-time**: Socket.IO/WebSockets
- **Search**: Algolia/Elasticsearch + OpenAI API

### Integrations
- **Maps**: Google Maps SDK/API
- **Payments**: Stripe, Flutterwave, Paystack, PayPal
- **Auth**: JWT + OTP (Twilio/MessageBird)
- **Notifications**: FCM, WhatsApp API

## 📁 Project Structure

```
zippup-platform/
├── web/                 # Next.js web app & admin panel
├── api/                 # Next.js API routes
├── mobile/              # Flutter mobile app
├── lib/                 # Shared libraries (Prisma, utilities)
├── utils/               # Helper functions
└── docs/                # Documentation
```

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- Flutter SDK
- PostgreSQL
- Redis (for real-time features)

### Installation

1. **Clone and install dependencies**
```bash
git clone <repository-url>
cd zippup-platform
npm install
```

2. **Set up environment variables**
```bash
cp .env.example .env.local
# Configure your database, API keys, and other settings
```

3. **Set up database**
```bash
npm run prisma:migrate
npm run prisma:generate
```

4. **Start development servers**
```bash
npm run dev
```

## 🔧 Environment Setup

Create `.env.local` with:

```env
# Database
DATABASE_URL="postgresql://username:password@localhost:5432/zippup"

# Authentication
JWT_SECRET="your-jwt-secret"
TWILIO_ACCOUNT_SID="your-twilio-sid"
TWILIO_AUTH_TOKEN="your-twilio-token"

# Payment Gateways
STRIPE_SECRET_KEY="sk_test_..."
FLUTTERWAVE_SECRET_KEY="FLWSECK_TEST-..."
PAYSTACK_SECRET_KEY="sk_test_..."

# Maps & Location
GOOGLE_MAPS_API_KEY="your-google-maps-key"

# AI & Search
OPENAI_API_KEY="sk-..."
ALGOLIA_APP_ID="your-algolia-app-id"
ALGOLIA_API_KEY="your-algolia-api-key"

# External Services
SOCKET_IO_URL="http://localhost:3001"
```

## 📱 Mobile App Setup

```bash
cd mobile
flutter pub get
flutter run
```

## 🌐 Deployment

### Vercel (Recommended)
```bash
npm run build
vercel --prod
```

### Manual Deployment
```bash
npm run build:web
npm run build:api
# Deploy build artifacts to your hosting provider
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Create a Pull Request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🆘 Support

For support, email support@zippup.com or join our Slack channel.