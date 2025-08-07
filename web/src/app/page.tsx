'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { 
  Car, 
  Scissors, 
  Wrench, 
  Hammer, 
  Home, 
  Phone, 
  ShoppingCart, 
  Smartphone,
  Settings,
  MoreHorizontal,
  Search,
  MapPin,
  User,
  Bell
} from 'lucide-react'
import EmergencyButton from '@/components/emergency/EmergencyButton'

const serviceCategories = [
  {
    id: 'ride-moving',
    name: 'Ride & Moving',
    description: 'Transportation and moving services',
    examples: ['Taxi', 'Delivery', 'Movers', 'etc'],
    icon: Car,
    color: 'bg-blue-500',
    priceRange: '$15-$50',
    href: '/services/ride-moving'
  },
  {
    id: 'personal-care',
    name: 'Personal Care',
    description: 'Hair, massage, beauty services',
    examples: ['Haircut', 'Massage', 'Manicure', 'etc'],
    icon: Scissors,
    color: 'bg-pink-500',
    priceRange: '$25-$100',
    href: '/services/personal-care'
  },
  {
    id: 'tech-services',
    name: 'Tech Services',
    description: 'Device repair & tech support',
    examples: ['Phone Repair', 'Laptop Fix', 'IT Support', 'etc'],
    icon: Wrench,
    color: 'bg-green-500',
    priceRange: '$30-$150',
    href: '/services/tech-services'
  },
  {
    id: 'construction',
    name: 'Construction',
    description: 'Builders, carpenters, contractors',
    examples: ['Carpentry', 'Painting', 'Roofing', 'etc'],
    icon: Hammer,
    color: 'bg-orange-500',
    priceRange: '$50-$300',
    href: '/services/construction'
  },
  {
    id: 'home-services',
    name: 'Home Services',
    description: 'Plumbers, cleaners, maintenance',
    examples: ['Plumbing', 'Cleaning', 'Gardening', 'etc'],
    icon: Home,
    color: 'bg-purple-500',
    priceRange: '$40-$200',
    href: '/services/home-services'
  },
  {
    id: 'automobile',
    name: 'Automobile',
    description: 'Car repair and maintenance',
    examples: ['Mechanics', 'Vulcanizer', 'Car Wash', 'etc'],
    icon: Settings,
    color: 'bg-slate-500',
    priceRange: '$30-$250',
    href: '/services/automobile'
  },
  {
    id: 'emergency-services',
    name: 'Emergency Services',
    description: 'Ambulance, fire, roadside assistance',
    examples: ['Ambulance', 'Fire Service', 'Roadside', 'etc'],
    icon: Phone,
    color: 'bg-red-500',
    priceRange: '$100-$500',
    href: '/services/emergency-services'
  },
  {
    id: 'marketplace',
    name: 'Marketplace',
    description: 'Buy and sell goods',
    examples: ['Electronics', 'Fashion', 'Groceries', 'etc'],
    icon: ShoppingCart,
    color: 'bg-indigo-500',
    priceRange: '$5-$1000+',
    href: '/marketplace'
  },
  {
    id: 'digital-services',
    name: 'Digital Services',
    description: 'Airtime, data, bill payments',
    examples: ['Airtime', 'Data Plans', 'Bill Pay', 'etc'],
    icon: Smartphone,
    color: 'bg-teal-500',
    priceRange: '$1-$100',
    href: '/services/digital-services'
  },
  {
    id: 'others',
    name: 'Others',
    description: 'Events, catering & general services',
    examples: ['Events', 'Catering', 'General', 'etc'],
    icon: MoreHorizontal,
    color: 'bg-gray-500',
    priceRange: '$20-$500',
    href: '/services/others'
  }
]

export default function HomePage() {
  const [searchQuery, setSearchQuery] = useState('')
  const [userLocation, setUserLocation] = useState<string>('Getting location...')

  useEffect(() => {
    // Get user's location
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          // This would normally reverse geocode to get city name
          setUserLocation('Current Location')
        },
        () => {
          setUserLocation('Location not available')
        }
      )
    }
  }, [])

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    if (searchQuery.trim()) {
      // Navigate to search results
      window.location.href = `/search?q=${encodeURIComponent(searchQuery)}`
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <h1 className="text-2xl font-bold text-zippup-600">ZippUp</h1>
            </div>
            
            <div className="flex items-center space-x-4">
              <div className="flex items-center text-sm text-gray-600">
                <MapPin className="h-4 w-4 mr-1" />
                {userLocation}
              </div>
              
              <button className="p-2 text-gray-600 hover:text-gray-900">
                <Bell className="h-5 w-5" />
              </button>
              
              <Link href="/auth/login" className="p-2 text-gray-600 hover:text-gray-900">
                <User className="h-5 w-5" />
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="gradient-bg text-white py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-4xl md:text-6xl font-bold mb-6">
            Your All-in-One
            <br />
            <span className="text-yellow-300">Service Platform</span>
          </h2>
          <p className="text-xl md:text-2xl mb-8 text-blue-100">
            From rides to repairs, emergencies to marketplace - we've got you covered!
          </p>
          
          {/* AI-Powered Search */}
          <form onSubmit={handleSearch} className="max-w-2xl mx-auto">
            <div className="relative">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="What do you need? (e.g., 'fix my tap', 'haircut', 'ride to airport')"
                className="w-full pl-12 pr-4 py-4 text-lg rounded-full border-0 text-gray-900 placeholder-gray-500 focus:ring-4 focus:ring-white/20"
              />
              <button
                type="submit"
                className="absolute right-2 top-1/2 transform -translate-y-1/2 bg-zippup-600 text-white px-6 py-2 rounded-full hover:bg-zippup-700 transition-colors"
              >
                Search
              </button>
            </div>
          </form>
        </div>
      </section>

      {/* Service Categories */}
      <section className="py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h3 className="text-3xl font-bold text-center mb-12 text-gray-900">
            Choose Your Service
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {serviceCategories.map((category) => {
              const IconComponent = category.icon
              return (
                <Link
                  key={category.id}
                  href={category.href}
                  className="service-card group"
                >
                  <div className={`${category.color} w-16 h-16 rounded-full flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}>
                    <IconComponent className="h-8 w-8 text-white" />
                  </div>
                  
                  <h4 className="text-xl font-semibold mb-2 text-gray-900">
                    {category.name}
                  </h4>
                  
                  <p className="text-gray-600 mb-3 text-sm">
                    {category.description}
                  </p>
                  
                  {/* Service Examples */}
                  <div className="mb-4 flex-grow">
                    <div className="flex flex-wrap gap-1 text-xs">
                      {category.examples.map((example, index) => {
                        const isEtc = example === 'etc'
                        const tagColor = isEtc 
                          ? 'bg-gray-400' 
                          : category.color.replace('-500', '-400')
                        
                        return (
                          <span 
                            key={index}
                            className={`inline-block px-2 py-1 rounded-full text-white text-xs ${tagColor}`}
                          >
                            {example}
                          </span>
                        )
                      })}
                    </div>
                  </div>
                  
                  <div className="text-sm font-medium text-zippup-600 mt-auto">
                    {category.priceRange}
                  </div>
                </Link>
              )
            })}
          </div>
        </div>
      </section>

      {/* Emergency Button - Fixed Position */}
      <EmergencyButton />

      {/* Features Section */}
      <section className="bg-gray-100 py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h3 className="text-3xl font-bold text-gray-900 mb-4">
              Why Choose ZippUp?
            </h3>
            <p className="text-xl text-gray-600">
              More than just services - your safety and convenience partner
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="bg-zippup-500 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <Phone className="h-8 w-8 text-white" />
              </div>
              <h4 className="text-xl font-semibold mb-2">Emergency Ready</h4>
              <p className="text-gray-600">
                Panic button with live tracking and instant alerts to emergency contacts and authorities.
              </p>
            </div>
            
            <div className="text-center">
              <div className="bg-green-500 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <Search className="h-8 w-8 text-white" />
              </div>
              <h4 className="text-xl font-semibold mb-2">AI-Powered Search</h4>
              <p className="text-gray-600">
                Simply describe what you need in natural language and we'll find the perfect service.
              </p>
            </div>
            
            <div className="text-center">
              <div className="bg-purple-500 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <ShoppingCart className="h-8 w-8 text-white" />
              </div>
              <h4 className="text-xl font-semibold mb-2">Secure Payments</h4>
              <p className="text-gray-600">
                Integrated wallet with escrow system ensures safe transactions for all parties.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div>
              <h5 className="text-lg font-semibold mb-4">ZippUp</h5>
              <p className="text-gray-400">
                Your trusted partner for on-demand services and emergency assistance.
              </p>
            </div>
            
            <div>
              <h6 className="font-semibold mb-4">Services</h6>
              <ul className="space-y-2 text-gray-400">
                <li><Link href="/services" className="hover:text-white">All Services</Link></li>
                <li><Link href="/marketplace" className="hover:text-white">Marketplace</Link></li>
                <li><Link href="/emergency" className="hover:text-white">Emergency</Link></li>
              </ul>
            </div>
            
            <div>
              <h6 className="font-semibold mb-4">Support</h6>
              <ul className="space-y-2 text-gray-400">
                <li><Link href="/help" className="hover:text-white">Help Center</Link></li>
                <li><Link href="/contact" className="hover:text-white">Contact Us</Link></li>
                <li><Link href="/safety" className="hover:text-white">Safety</Link></li>
              </ul>
            </div>
            
            <div>
              <h6 className="font-semibold mb-4">Company</h6>
              <ul className="space-y-2 text-gray-400">
                <li><Link href="/about" className="hover:text-white">About</Link></li>
                <li><Link href="/careers" className="hover:text-white">Careers</Link></li>
                <li><Link href="/privacy" className="hover:text-white">Privacy</Link></li>
              </ul>
            </div>
          </div>
          
          <div className="border-t border-gray-800 mt-8 pt-8 text-center text-gray-400">
            <p>&copy; 2024 ZippUp. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  )
}