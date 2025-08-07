import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

const services = [
  // Ride & Moving Services
  {
    name: 'Taxi Service',
    description: 'Professional taxi and ride services',
    category: 'RIDE_MOVING',
    basePrice: 15.00,
    priceRange: { min: 10, max: 50 },
    duration: 30,
    country: 'US'
  },
  {
    name: 'Delivery Service',
    description: 'Fast and reliable delivery',
    category: 'RIDE_MOVING',
    basePrice: 20.00,
    priceRange: { min: 15, max: 100 },
    duration: 45,
    country: 'US'
  },
  {
    name: 'Moving Service',
    description: 'Professional movers for home and office',
    category: 'RIDE_MOVING',
    basePrice: 80.00,
    priceRange: { min: 80, max: 300 },
    duration: 240,
    country: 'US'
  },

  // Personal Care
  {
    name: 'Hair Cut & Styling',
    description: 'Professional hair cutting and styling',
    category: 'PERSONAL_CARE',
    basePrice: 35.00,
    priceRange: { min: 25, max: 100 },
    duration: 60,
    country: 'US'
  },
  {
    name: 'Massage Therapy',
    description: 'Relaxing massage therapy at your location',
    category: 'PERSONAL_CARE',
    basePrice: 80.00,
    priceRange: { min: 60, max: 150 },
    duration: 90,
    country: 'US'
  },
  {
    name: 'Manicure & Pedicure',
    description: 'Professional nail care services',
    category: 'PERSONAL_CARE',
    basePrice: 45.00,
    priceRange: { min: 30, max: 80 },
    duration: 75,
    country: 'US'
  },

  // Tech Services
  {
    name: 'Phone Repair',
    description: 'Smartphone and tablet repair services',
    category: 'TECH_SERVICES',
    basePrice: 50.00,
    priceRange: { min: 30, max: 200 },
    duration: 60,
    country: 'US'
  },
  {
    name: 'Laptop Repair',
    description: 'Computer and laptop repair services',
    category: 'TECH_SERVICES',
    basePrice: 75.00,
    priceRange: { min: 50, max: 300 },
    duration: 120,
    country: 'US'
  },
  {
    name: 'IT Support',
    description: 'Technical support and IT assistance',
    category: 'TECH_SERVICES',
    basePrice: 60.00,
    priceRange: { min: 40, max: 150 },
    duration: 90,
    country: 'US'
  },

  // Construction
  {
    name: 'Carpentry',
    description: 'Professional carpentry and woodwork',
    category: 'CONSTRUCTION',
    basePrice: 85.00,
    priceRange: { min: 60, max: 200 },
    duration: 180,
    country: 'US'
  },
  {
    name: 'Painting Service',
    description: 'Interior and exterior painting',
    category: 'CONSTRUCTION',
    basePrice: 70.00,
    priceRange: { min: 50, max: 300 },
    duration: 240,
    country: 'US'
  },
  {
    name: 'Roofing Service',
    description: 'Roof repair and installation',
    category: 'CONSTRUCTION',
    basePrice: 150.00,
    priceRange: { min: 100, max: 500 },
    duration: 360,
    country: 'US'
  },

  // Home Services
  {
    name: 'Plumbing Service',
    description: 'Professional plumbing repair and installation',
    category: 'HOME_SERVICES',
    basePrice: 65.00,
    priceRange: { min: 50, max: 200 },
    duration: 90,
    country: 'US'
  },
  {
    name: 'House Cleaning',
    description: 'Thorough home cleaning service',
    category: 'HOME_SERVICES',
    basePrice: 55.00,
    priceRange: { min: 40, max: 150 },
    duration: 120,
    country: 'US'
  },
  {
    name: 'Gardening Service',
    description: 'Garden maintenance and landscaping',
    category: 'HOME_SERVICES',
    basePrice: 45.00,
    priceRange: { min: 35, max: 120 },
    duration: 150,
    country: 'US'
  },

  // Automobile
  {
    name: 'Auto Mechanic',
    description: 'Professional car repair and maintenance',
    category: 'AUTOMOBILE',
    basePrice: 85.00,
    priceRange: { min: 50, max: 300 },
    duration: 120,
    country: 'US'
  },
  {
    name: 'Tire Service (Vulcanizer)',
    description: 'Tire repair, replacement and vulcanizing',
    category: 'AUTOMOBILE',
    basePrice: 35.00,
    priceRange: { min: 25, max: 150 },
    duration: 45,
    country: 'US'
  },
  {
    name: 'Car Wash & Detailing',
    description: 'Professional car washing and detailing',
    category: 'AUTOMOBILE',
    basePrice: 30.00,
    priceRange: { min: 20, max: 100 },
    duration: 90,
    country: 'US'
  },

  // Emergency Services
  {
    name: 'Ambulance Service',
    description: 'Emergency medical transportation',
    category: 'EMERGENCY_SERVICES',
    basePrice: 200.00,
    priceRange: { min: 150, max: 500 },
    duration: 30,
    country: 'US'
  },
  {
    name: 'Fire Emergency Response',
    description: 'Emergency fire response services',
    category: 'EMERGENCY_SERVICES',
    basePrice: 250.00,
    priceRange: { min: 200, max: 600 },
    duration: 20,
    country: 'US'
  },
  {
    name: 'Roadside Assistance',
    description: 'Emergency roadside help and towing',
    category: 'EMERGENCY_SERVICES',
    basePrice: 75.00,
    priceRange: { min: 50, max: 200 },
    duration: 45,
    country: 'US'
  },

  // Digital Services
  {
    name: 'Mobile Airtime',
    description: 'Mobile phone credit top-up',
    category: 'DIGITAL_SERVICES',
    basePrice: 10.00,
    priceRange: { min: 5, max: 100 },
    duration: 1,
    country: 'US'
  },
  {
    name: 'Data Plans',
    description: 'Mobile data plan purchases',
    category: 'DIGITAL_SERVICES',
    basePrice: 25.00,
    priceRange: { min: 10, max: 80 },
    duration: 1,
    country: 'US'
  },
  {
    name: 'Bill Payment',
    description: 'Utility and service bill payments',
    category: 'DIGITAL_SERVICES',
    basePrice: 2.00,
    priceRange: { min: 1, max: 1000 },
    duration: 1,
    country: 'US'
  },

  // Others
  {
    name: 'Event Planning',
    description: 'Professional event planning and coordination',
    category: 'OTHERS',
    basePrice: 150.00,
    priceRange: { min: 100, max: 1000 },
    duration: 480,
    country: 'US'
  },
  {
    name: 'Catering Service',
    description: 'Food catering for events and gatherings',
    category: 'OTHERS',
    basePrice: 25.00,
    priceRange: { min: 15, max: 50 },
    duration: 180,
    country: 'US'
  },
  {
    name: 'General Labor',
    description: 'General assistance and labor services',
    category: 'OTHERS',
    basePrice: 20.00,
    priceRange: { min: 15, max: 40 },
    duration: 60,
    country: 'US'
  }
]

async function main() {
  console.log('🌱 Starting database seed...')

  // Create services
  console.log('📋 Creating services...')
  for (const service of services) {
    await prisma.service.upsert({
      where: { name: service.name },
      update: service,
      create: service
    })
  }

  console.log(`✅ Created ${services.length} services`)

  // Create digital services for airtime, data, etc.
  console.log('📱 Creating digital services...')
  const digitalServices = [
    {
      name: 'Mobile Airtime',
      category: 'airtime',
      provider: 'All Networks',
      country: 'US',
      denominations: {
        amounts: [5, 10, 15, 20, 25, 50, 100]
      }
    },
    {
      name: 'Data Packages',
      category: 'data',
      provider: 'All Networks', 
      country: 'US',
      denominations: {
        packages: [
          { amount: 10, data: '1GB', validity: '30 days' },
          { amount: 20, data: '3GB', validity: '30 days' },
          { amount: 35, data: '5GB', validity: '30 days' },
          { amount: 50, data: '10GB', validity: '30 days' }
        ]
      }
    },
    {
      name: 'Electricity Bills',
      category: 'bills',
      provider: 'Utility Companies',
      country: 'US',
      denominations: {
        range: { min: 10, max: 500 }
      }
    }
  ]

  for (const digitalService of digitalServices) {
    await prisma.digitalService.upsert({
      where: { 
        name_category: {
          name: digitalService.name,
          category: digitalService.category
        }
      },
      update: digitalService,
      create: digitalService
    })
  }

  console.log(`✅ Created ${digitalServices.length} digital services`)
  console.log('🎉 Database seeding completed!')
}

main()
  .catch((e) => {
    console.error('❌ Seeding failed:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })