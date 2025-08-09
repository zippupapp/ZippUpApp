# ZippUp Platform Development Guide

This guide provides everything you need to set up, develop, and contribute to the ZippUp platform.

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- Flutter SDK 3.10+
- PostgreSQL 13+
- Git
- VS Code (recommended) with extensions:
  - Flutter
  - Prisma
  - ES7+ React/Redux/React-Native snippets
  - Tailwind CSS IntelliSense

### 1. Clone & Setup

```bash
# Clone repository
git clone <repository-url>
cd zippup-platform

# Install dependencies
npm install

# Set up environment
cp .env.example .env.local
# Edit .env.local with your local configuration

# Generate Prisma client
npm run prisma:generate

# Run database migrations
npm run prisma:migrate
```

### 2. Start Development Servers

```bash
# Start all services
npm run dev

# Or start individually
npm run dev:web    # Next.js web app on :3000
npm run dev:api    # API server (same as web)
```

### 3. Mobile Development

```bash
cd mobile

# Get dependencies
flutter pub get

# Run on simulator/device
flutter run
```

## 📁 Project Structure

```
zippup-platform/
├── web/                    # Next.js web application
│   ├── src/
│   │   ├── app/            # App Router (Next.js 13+)
│   │   │   ├── api/        # API routes
│   │   │   ├── auth/       # Authentication pages
│   │   │   ├── dashboard/  # User dashboard
│   │   │   └── admin/      # Admin panel
│   │   ├── components/     # React components
│   │   │   ├── ui/         # Reusable UI components
│   │   │   ├── forms/      # Form components
│   │   │   ├── maps/       # Map-related components
│   │   │   └── emergency/  # Emergency features
│   │   ├── lib/            # Utility libraries
│   │   ├── hooks/          # Custom React hooks
│   │   └── utils/          # Helper functions
│   ├── public/             # Static assets
│   └── styles/             # Global styles
├── mobile/                 # Flutter mobile app
│   ├── lib/
│   │   ├── screens/        # App screens
│   │   ├── widgets/        # Reusable widgets
│   │   ├── services/       # API services
│   │   ├── models/         # Data models
│   │   ├── providers/      # State management
│   │   └── utils/          # Utilities
│   └── assets/             # Mobile assets
├── lib/                    # Shared libraries
│   ├── prisma/             # Database schema & client
│   ├── auth/               # Authentication utilities
│   ├── payments/           # Payment processing
│   ├── socket/             # Real-time communication
│   ├── ai/                 # AI/search integration
│   └── notifications/      # Notification services
├── utils/                  # Shared utilities
├── docs/                   # Documentation
└── package.json            # Root package.json
```

## 🔧 Development Workflow

### 1. Feature Development

```bash
# Create feature branch
git checkout -b feature/new-feature-name

# Make changes...

# Test changes
npm run test
npm run lint

# Commit with conventional commits
git commit -m "feat: add new service booking feature"

# Push and create PR
git push origin feature/new-feature-name
```

### 2. Database Changes

```bash
# Edit schema
nano lib/prisma/schema.prisma

# Create migration
npm run prisma:migrate dev --name add_new_table

# Generate client
npm run prisma:generate

# Reset database (if needed)
npm run prisma:reset
```

### 3. API Development

```bash
# Create new API route
touch web/src/app/api/new-endpoint/route.ts

# Test with curl
curl -X POST http://localhost:3000/api/new-endpoint \
  -H "Content-Type: application/json" \
  -d '{"test": "data"}'
```

### 4. Mobile Development

```bash
cd mobile

# Hot reload
flutter run

# Build for testing
flutter build apk --debug

# Run tests
flutter test
```

## 🧪 Testing

### Web Application

```bash
# Run all tests
npm run test

# Run tests in watch mode
npm run test:watch

# Run specific test file
npm run test auth.test.ts

# Run integration tests
npm run test:integration
```

### Mobile Application

```bash
cd mobile

# Unit tests
flutter test

# Integration tests
flutter drive --target=test_driver/app.dart

# Widget tests
flutter test test/widget_test.dart
```

### API Testing

```bash
# Test API endpoints
npm run test:api

# Load testing (optional)
npx artillery quick --count 10 -n 20 http://localhost:3000/api/health
```

## 🎨 UI Development

### Design System

The platform uses a consistent design system:

```scss
// Colors
--primary: #0ea5e9      // ZippUp Blue
--secondary: #64748b    // Slate
--emergency: #ef4444    // Red
--success: #10b981      // Green
--warning: #f59e0b      // Amber

// Typography
--font-primary: Inter, sans-serif
--font-mono: 'Fira Code', monospace

// Spacing (based on 4px grid)
--space-1: 0.25rem    // 4px
--space-2: 0.5rem     // 8px
--space-4: 1rem       // 16px
--space-8: 2rem       // 32px
```

### Component Guidelines

```tsx
// ✅ Good component structure
interface ComponentProps {
  title: string
  isLoading?: boolean
  onAction?: () => void
}

export function Component({ title, isLoading = false, onAction }: ComponentProps) {
  return (
    <div className="component-wrapper">
      <h2 className="text-xl font-semibold">{title}</h2>
      {isLoading ? <Spinner /> : <Content />}
      {onAction && (
        <button onClick={onAction} className="btn-primary">
          Action
        </button>
      )}
    </div>
  )
}
```

### Mobile UI Guidelines

```dart
// Material Design 3 theming
ThemeData appTheme = ThemeData(
  useMaterial3: true,
  colorScheme: ColorScheme.fromSeed(
    seedColor: const Color(0xFF0EA5E9), // ZippUp Blue
  ),
  typography: Typography.material2021(),
);

// Widget structure
class ServiceCard extends StatelessWidget {
  final Service service;
  final VoidCallback? onTap;
  
  const ServiceCard({
    Key? key,
    required this.service,
    this.onTap,
  }) : super(key: key);
  
  @override
  Widget build(BuildContext context) {
    return Card(
      child: ListTile(
        leading: Icon(service.icon),
        title: Text(service.name),
        subtitle: Text(service.description),
        onTap: onTap,
      ),
    );
  }
}
```

## 🔄 State Management

### Web (React)

Using React Context and custom hooks:

```tsx
// Context
const AuthContext = createContext<AuthState | null>(null)

// Hook
export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider')
  }
  return context
}

// Usage
function Component() {
  const { user, login, logout } = useAuth()
  
  return (
    <div>
      {user ? (
        <button onClick={logout}>Logout</button>
      ) : (
        <button onClick={() => login(credentials)}>Login</button>
      )}
    </div>
  )
}
```

### Mobile (Flutter)

Using Provider pattern:

```dart
// Provider
class AuthProvider extends ChangeNotifier {
  User? _user;
  bool _isLoading = false;
  
  User? get user => _user;
  bool get isLoading => _isLoading;
  bool get isAuthenticated => _user != null;
  
  Future<void> login(String email, String password) async {
    _isLoading = true;
    notifyListeners();
    
    try {
      _user = await authService.login(email, password);
    } catch (e) {
      // Handle error
    } finally {
      _isLoading = false;
      notifyListeners();
    }
  }
}

// Usage
class LoginScreen extends StatelessWidget {
  @override
  Widget build(BuildContext context) {
    return Consumer<AuthProvider>(
      builder: (context, auth, child) {
        return Scaffold(
          body: auth.isLoading 
            ? CircularProgressIndicator()
            : LoginForm(),
        );
      },
    );
  }
}
```

## 🔒 Security Best Practices

### Authentication

```typescript
// JWT validation middleware
export function validateAuth(req: NextRequest) {
  const token = req.headers.get('authorization')?.replace('Bearer ', '')
  
  if (!token) {
    throw new Error('No token provided')
  }
  
  try {
    const payload = verifyToken(token)
    return payload
  } catch {
    throw new Error('Invalid token')
  }
}

// Rate limiting
const rateLimiter = new Map()

export function rateLimit(identifier: string, limit = 5, window = 60000) {
  const now = Date.now()
  const userRequests = rateLimiter.get(identifier) || []
  
  // Remove old requests
  const validRequests = userRequests.filter((time: number) => now - time < window)
  
  if (validRequests.length >= limit) {
    throw new Error('Rate limit exceeded')
  }
  
  validRequests.push(now)
  rateLimiter.set(identifier, validRequests)
}
```

### Data Validation

```typescript
import { z } from 'zod'

// Schema validation
const userSchema = z.object({
  email: z.string().email(),
  phone: z.string().regex(/^\+?[1-9]\d{1,14}$/),
  name: z.string().min(2).max(50),
})

// Usage in API route
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const validatedData = userSchema.parse(body)
    
    // Proceed with validated data
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation failed', details: error.errors },
        { status: 400 }
      )
    }
  }
}
```

## 📱 Emergency Features Development

### Panic Button Implementation

```typescript
// Emergency alert API
export async function createEmergencyAlert(location: LocationData) {
  // Validate user permissions
  // Get emergency contacts
  // Send notifications
  // Start location tracking
  // Return tracking ID
}

// Real-time tracking
const emergencySocket = io('/emergency')

emergencySocket.on('location-update', (data) => {
  // Update map with new location
  updateEmergencyMap(data.alertId, data.location)
})
```

### Location Tracking

```dart
// Flutter location service
class LocationService {
  StreamSubscription<Position>? _positionStream;
  
  Stream<Position> get positionStream {
    return Geolocator.getPositionStream(
      locationSettings: LocationSettings(
        accuracy: LocationAccuracy.high,
        distanceFilter: 10, // meters
      ),
    );
  }
  
  Future<void> startEmergencyTracking(String alertId) async {
    _positionStream = positionStream.listen((position) {
      // Send location to server
      emergencyService.updateLocation(alertId, position);
    });
  }
}
```

## 🔄 Real-time Features

### WebSocket Implementation

```typescript
// Server-side (Socket.IO)
import { Server } from 'socket.io'

const io = new Server(server, {
  cors: {
    origin: process.env.ALLOWED_ORIGINS?.split(',') || ['http://localhost:3000'],
  },
})

io.on('connection', (socket) => {
  socket.on('join-booking', (bookingId) => {
    socket.join(`booking-${bookingId}`)
  })
  
  socket.on('send-message', (data) => {
    socket.to(`booking-${data.bookingId}`).emit('new-message', data)
  })
})
```

```dart
// Mobile client
import 'package:socket_io_client/socket_io_client.dart';

class SocketService {
  late IO.Socket socket;
  
  void initialize() {
    socket = IO.io('http://localhost:3001', <String, dynamic>{
      'transports': ['websocket'],
      'autoConnect': false,
    });
    
    socket.connect();
    
    socket.on('new-message', (data) {
      // Handle new message
    });
  }
  
  void sendMessage(String bookingId, String message) {
    socket.emit('send-message', {
      'bookingId': bookingId,
      'message': message,
      'timestamp': DateTime.now().toIso8601String(),
    });
  }
}
```

## 🧪 Debugging

### Web Debugging

```bash
# Enable debug mode
DEBUG=* npm run dev

# Prisma debugging
DEBUG="prisma:*" npm run dev

# API debugging
DEBUG="api:*" npm run dev
```

### Mobile Debugging

```bash
# Flutter inspector
flutter run --debug

# Debug on device
flutter run --debug --device-id <device-id>

# Performance profiling
flutter run --profile
```

### Database Debugging

```bash
# Prisma Studio
npm run prisma:studio

# Query logging
tail -f /var/log/postgresql/postgresql.log

# Connection monitoring
SELECT * FROM pg_stat_activity;
```

## 📊 Performance Optimization

### Web Performance

```typescript
// Image optimization
import Image from 'next/image'

<Image
  src="/hero-image.jpg"
  alt="ZippUp Hero"
  width={800}
  height={600}
  priority
  placeholder="blur"
  blurDataURL="data:image/jpeg;base64,..."
/>

// Code splitting
const LazyComponent = dynamic(() => import('./HeavyComponent'), {
  loading: () => <Spinner />,
  ssr: false,
})

// API caching
export async function GET(request: NextRequest) {
  return NextResponse.json(data, {
    headers: {
      'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=300',
    },
  })
}
```

### Mobile Performance

```dart
// ListView optimization
ListView.builder(
  itemCount: items.length,
  itemBuilder: (context, index) {
    return ServiceCard(service: items[index]);
  },
);

// Image caching
CachedNetworkImage(
  imageUrl: imageUrl,
  placeholder: (context, url) => CircularProgressIndicator(),
  errorWidget: (context, url, error) => Icon(Icons.error),
);

// Background processing
@pragma('vm:entry-point')
void backgroundHandler() {
  // Handle background tasks
}
```

## 🚀 Deployment

### Local Testing

```bash
# Build for production
npm run build
npm run start

# Test mobile builds
flutter build apk --debug
flutter build ios --debug
```

### Staging Deployment

```bash
# Deploy to staging
vercel --target staging

# Run staging tests
npm run test:staging
```

### Production Deployment

```bash
# Deploy to production
vercel --prod

# Monitor deployment
vercel logs --follow
```

## 📝 Code Style

### TypeScript/JavaScript

```typescript
// Use explicit types
interface User {
  id: string
  email: string
  name: string
}

// Prefer async/await
async function fetchUser(id: string): Promise<User> {
  const response = await fetch(`/api/users/${id}`)
  return response.json()
}

// Use meaningful names
const getUserBookings = async (userId: string) => {
  // Implementation
}
```

### Dart/Flutter

```dart
// Follow Dart conventions
class UserService {
  final ApiClient _apiClient;
  
  const UserService(this._apiClient);
  
  Future<User> getUser(String id) async {
    final response = await _apiClient.get('/users/$id');
    return User.fromJson(response.data);
  }
}

// Use meaningful widget names
class BookingListTile extends StatelessWidget {
  final Booking booking;
  final VoidCallback? onTap;
  
  const BookingListTile({
    Key? key,
    required this.booking,
    this.onTap,
  }) : super(key: key);
}
```

## 🤝 Contributing

### Pull Request Process

1. Create feature branch from `main`
2. Make changes following code style guidelines
3. Add/update tests
4. Update documentation if needed
5. Create pull request with clear description
6. Address review feedback
7. Merge after approval

### Commit Convention

```bash
# Format: type(scope): description
feat(auth): add phone number verification
fix(emergency): resolve location tracking issue
docs(api): update endpoint documentation
test(booking): add integration tests
refactor(ui): simplify component structure
```

### Issue Reporting

When reporting issues, include:
- Environment details (OS, browser, Flutter version)
- Steps to reproduce
- Expected vs actual behavior
- Screenshots/logs if applicable
- Minimal reproduction example

---

Happy coding! 🚀