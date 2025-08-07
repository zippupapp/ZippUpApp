# ZippUp Quick Start Guide

Get ZippUp running in under 10 minutes! This guide will help you set up the development environment and start building your on-demand service super app.

## 🚀 Prerequisites

Make sure you have these installed:
- **Node.js 18+** - [Download here](https://nodejs.org/)
- **Flutter SDK 3.10+** - [Installation guide](https://flutter.dev/docs/get-started/install)
- **PostgreSQL** - [Download here](https://www.postgresql.org/download/) or use cloud service
- **Git** - [Download here](https://git-scm.com/)

## ⚡ 1-Minute Setup

### 1. Clone & Install

```bash
# Clone the repository
git clone <your-repository-url>
cd zippup-platform

# Install dependencies
npm install
```

### 2. Environment Setup

The Google Maps API key is already configured! Just copy the environment file:

```bash
# Copy environment file (Google Maps API already included)
cp web/.env.local.example web/.env.local
```

Your `.env.local` already includes:
```env
# Google Maps (configured)
GOOGLE_MAPS_API_KEY="AIzaSyD6IF-c6Ce0iSpEDITpaUGJ20y7_ZZxHl0"
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY="AIzaSyD6IF-c6Ce0iSpEDITpaUGJ20y7_ZZxHl0"

# Stripe Payments (configured)
STRIPE_PUBLISHABLE_KEY="pk_test_51RsMiZGMO6NwkYaMOEK0rl7KZXpKnYGJYTvXl2iycbSWj0biC7zD51ODQvlfAM1yWCKICPWUhNSs8dunOWxPdhuA00VyFwvHjd"
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY="pk_test_51RsMiZGMO6NwkYaMOEK0rl7KZXpKnYGJYTvXl2iycbSWj0biC7zD51ODQvlfAM1yWCKICPWUhNSs8dunOWxPdhuA00VyFwvHjd"
```

### 3. Database Setup

#### Option A: Quick SQLite (for testing)
```bash
# Update .env.local to use SQLite
echo 'DATABASE_URL="file:./dev.db"' >> web/.env.local

# Generate and migrate
npm run prisma:generate
npm run prisma:migrate dev --name init
```

#### Option B: PostgreSQL
```bash
# Create database
createdb zippup

# Update DATABASE_URL in .env.local
DATABASE_URL="postgresql://username:password@localhost:5432/zippup"

# Generate and migrate
npm run prisma:generate
npm run prisma:migrate dev --name init
```

### 4. Start Development

```bash
# Start the web app (includes API)
npm run dev:web

# In another terminal, start mobile development
cd mobile
flutter pub get
flutter run
```

## 🎯 What You Get Out of the Box

### ✅ **Working Features**
- **Homepage** with service categories
- **Emergency panic button** with Google Maps integration
- **Real-time location tracking**
- **User authentication** (phone/email OTP)
- **Google Maps integration** (already configured!)
- **Stripe payment processing** (test mode ready!)
- **Wallet system** with top-up functionality
- **Database structure** for all features
- **Mobile app foundation**

### 🔗 **URLs to Try**
- **Homepage**: http://localhost:3000
- **Emergency tracking demo**: http://localhost:3000/emergency/track/demo
- **Database admin**: `npm run prisma:studio`

## 🗺️ Google Maps Features Ready to Use

Your Google Maps API key (`AIzaSyD6IF-c6Ce0iSpEDITpaUGJ20y7_ZZxHl0`) is already configured for:

### Emergency Tracking
- Real-time location display
- Address geocoding
- Custom emergency markers
- Location history tracking

### Service Provider Maps
- Provider location discovery
- Route planning
- Delivery tracking
- Service area visualization

### Usage Examples

```javascript
// Basic map component
<GoogleMap
  center={{ lat: 40.7128, lng: -74.0060 }}
  zoom={13}
  markers={[
    {
      position: { lat: 40.7128, lng: -74.0060 },
      title: "Service Provider",
      info: "Available now"
    }
  ]}
/>

// Emergency tracking
<GoogleMap
  center={{ lat: userLat, lng: userLng }}
  trackingMode={true}
  showCurrentLocation={true}
/>
```

## 🎨 Test the Emergency System

1. **Open the app**: http://localhost:3000
2. **Click the red Emergency button** (bottom right)
3. **Confirm the alert** (development mode)
4. **See live tracking**: You'll be redirected to the tracking page
5. **View on Google Maps**: Real location with custom markers

## 📱 Mobile App Testing

```bash
cd mobile

# iOS Simulator
flutter run

# Android Emulator
flutter run

# Physical device
flutter run --device-id <your-device-id>
```

The mobile app includes:
- Google Maps integration
- Emergency panic button
- Real-time location services
- Push notifications (Firebase)
- Cross-platform UI components

## 🔧 Adding More API Keys (Optional)

To enable additional features, add these to `web/.env.local`:

```bash
# SMS notifications (Twilio)
TWILIO_ACCOUNT_SID="your-twilio-sid"
TWILIO_AUTH_TOKEN="your-twilio-token"

# Payments (Stripe)
STRIPE_SECRET_KEY="sk_test_your_stripe_key"

# AI Search (OpenAI)
OPENAI_API_KEY="sk-your-openai-key"
```

## 🚨 Emergency Features Demo

### Test Emergency Alert
```bash
# Send test emergency alert
curl -X POST http://localhost:3000/api/emergency/alert \
  -H "Content-Type: application/json" \
  -d '{
    "latitude": 40.7128,
    "longitude": -74.0060,
    "message": "Test emergency alert"
  }'
```

### View Tracking Page
The API will return a tracking URL that you can share with emergency contacts.

## 🎯 Next Steps

Now that you have ZippUp running:

1. **Customize the UI** - Edit components in `web/src/components/`
2. **Add services** - Extend the service categories
3. **Test mobile features** - Try the Flutter app
4. **Configure notifications** - Set up Twilio/Firebase
5. **Deploy to Vercel** - Use `vercel --prod`

## 📖 Documentation

- **Full Development Guide**: [docs/DEVELOPMENT.md](./DEVELOPMENT.md)
- **Deployment Guide**: [docs/DEPLOYMENT.md](./DEPLOYMENT.md)
- **API Documentation**: Generated via `npm run docs`

## 🆘 Troubleshooting

### Common Issues

**Map not loading?**
- Check that `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY` is set
- Verify the API key has Maps JavaScript API enabled

**Database errors?**
```bash
npm run prisma:reset
npm run prisma:migrate dev --name init
```

**Port already in use?**
```bash
# Use different port
PORT=3001 npm run dev:web
```

### Get Help
- Check the console for error messages
- Review the [Development Guide](./DEVELOPMENT.md)
- Open an issue in the repository

---

**You're ready to build the next generation of on-demand services! 🚀**

The Google Maps integration is already working, emergency features are functional, and you have a solid foundation to build upon.