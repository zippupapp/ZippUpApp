#!/bin/bash

# ZippUp Production Setup Script
# This script helps set up the production environment for ZippUp platform

set -e

echo "🚀 ZippUp Production Setup Script"
echo "=================================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if required tools are installed
check_dependencies() {
    print_status "Checking dependencies..."
    
    if ! command -v node &> /dev/null; then
        print_error "Node.js is not installed. Please install Node.js 18+ first."
        exit 1
    fi
    
    if ! command -v npm &> /dev/null; then
        print_error "npm is not installed. Please install npm first."
        exit 1
    fi
    
    if ! command -v npx &> /dev/null; then
        print_error "npx is not installed. Please install npx first."
        exit 1
    fi
    
    print_success "All dependencies are installed"
}

# Setup environment variables
setup_environment() {
    print_status "Setting up environment variables..."
    
    if [ ! -f .env.production ]; then
        print_error ".env.production file not found. Please create it first."
        exit 1
    fi
    
    # Copy production env to local for setup
    cp .env.production .env.local
    
    print_success "Environment variables copied to .env.local"
    print_warning "Please update .env.local with your actual production values"
}

# Install dependencies
install_dependencies() {
    print_status "Installing dependencies..."
    
    # Install root dependencies
    npm install
    
    # Install web dependencies
    cd web
    npm install
    cd ..
    
    # Install lib dependencies
    cd lib
    npm install
    cd ..
    
    print_success "Dependencies installed successfully"
}

# Setup database
setup_database() {
    print_status "Setting up production database..."
    
    # Generate Prisma client
    cd lib
    npx prisma generate
    
    # Run migrations
    print_status "Running database migrations..."
    npx prisma migrate deploy
    
    # Seed database with initial data
    print_status "Seeding database with initial data..."
    npm run prisma:seed
    
    cd ..
    
    print_success "Database setup completed"
}

# Build application
build_application() {
    print_status "Building application..."
    
    # Build web application
    cd web
    npm run build
    cd ..
    
    print_success "Application built successfully"
}

# Setup Stripe webhook
setup_stripe_webhook() {
    print_status "Setting up Stripe webhook..."
    
    echo ""
    echo "To complete Stripe webhook setup:"
    echo "1. Go to https://dashboard.stripe.com/webhooks"
    echo "2. Click 'Add endpoint'"
    echo "3. Set endpoint URL to: https://your-domain.com/api/webhooks/stripe"
    echo "4. Select events: payment_intent.succeeded, payment_intent.payment_failed, charge.dispute.created"
    echo "5. Copy the webhook signing secret to your .env.local file"
    echo ""
    
    read -p "Press Enter when you've completed the Stripe webhook setup..."
}

# Setup monitoring and analytics
setup_monitoring() {
    print_status "Setting up monitoring and analytics..."
    
    echo ""
    echo "Recommended monitoring setup:"
    echo "1. Sentry for error tracking: https://sentry.io"
    echo "2. Google Analytics for web analytics"
    echo "3. Firebase Analytics for mobile analytics"
    echo "4. Uptime monitoring (UptimeRobot, Pingdom)"
    echo ""
    
    read -p "Press Enter when you've completed the monitoring setup..."
}

# Security checklist
security_checklist() {
    print_status "Security checklist..."
    
    echo ""
    echo "🔒 Security Checklist:"
    echo "□ JWT_SECRET is a strong, random 32+ character string"
    echo "□ NEXTAUTH_SECRET is a strong, random 32+ character string"
    echo "□ All API keys are production keys (not test keys)"
    echo "□ HTTPS is enabled on all endpoints"
    echo "□ CORS is properly configured"
    echo "□ Rate limiting is enabled"
    echo "□ Input validation is implemented"
    echo "□ SQL injection protection is in place"
    echo "□ XSS protection is enabled"
    echo "□ CSRF protection is implemented"
    echo ""
    
    read -p "Press Enter when you've completed the security checklist..."
}

# Emergency services setup
setup_emergency_services() {
    print_status "Setting up emergency services..."
    
    echo ""
    echo "🚨 Emergency Services Setup:"
    echo "1. Contact local emergency services for API integration"
    echo "2. Verify compliance with local emergency regulations"
    echo "3. Test emergency alert system end-to-end"
    echo "4. Set up emergency contact verification"
    echo "5. Configure emergency response protocols"
    echo ""
    
    read -p "Press Enter when you've completed the emergency services setup..."
}

# Final verification
final_verification() {
    print_status "Final verification..."
    
    echo ""
    echo "✅ Final Verification Checklist:"
    echo "□ Database is accessible and migrations are applied"
    echo "□ Environment variables are properly set"
    echo "□ Application builds successfully"
    echo "□ API endpoints are responding"
    echo "□ Payment processing is working"
    echo "□ Emergency alert system is functional"
    echo "□ Monitoring and analytics are configured"
    echo "□ Legal documents are uploaded"
    echo "□ Support system is ready"
    echo ""
    
    read -p "Press Enter when you've completed the final verification..."
}

# Main execution
main() {
    echo "Starting ZippUp production setup..."
    echo ""
    
    check_dependencies
    setup_environment
    install_dependencies
    setup_database
    build_application
    setup_stripe_webhook
    setup_monitoring
    security_checklist
    setup_emergency_services
    final_verification
    
    echo ""
    print_success "🎉 ZippUp production setup completed!"
    echo ""
    echo "Next steps:"
    echo "1. Deploy to Vercel: vercel --prod"
    echo "2. Test all functionality in production"
    echo "3. Submit app store applications"
    echo "4. Launch marketing campaign"
    echo "5. Monitor performance and user feedback"
    echo ""
    echo "Good luck with your launch! 🚀"
}

# Run main function
main "$@"