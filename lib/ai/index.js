const { Configuration, OpenAIApi } = require('openai');

const configuration = new Configuration({
  apiKey: process.env.OPENAI_API_KEY,
});
const openai = new OpenAIApi(configuration);

// Service categories with examples
const SERVICE_CATEGORIES = {
  'RIDE_MOVING': ['transport', 'taxi', 'uber', 'moving', 'delivery', 'ride'],
  'PERSONAL_CARE': ['hair', 'barber', 'salon', 'massage', 'beauty', 'manicure', 'pedicure'],
  'TECH_SERVICES': ['computer', 'laptop', 'phone', 'repair', 'tech', 'IT', 'software'],
  'CONSTRUCTION': ['building', 'construction', 'renovation', 'contractor', 'builder'],
  'HOME_SERVICES': ['plumber', 'electrician', 'cleaner', 'cleaning', 'handyman', 'painter'],
  'EMERGENCY_SERVICES': ['ambulance', 'fire', 'police', 'emergency', 'medical', 'rescue'],
  'AUTOMOBILE': ['mechanic', 'car', 'auto', 'vehicle', 'tire', 'vulcanizer', 'battery'],
  'OTHERS': ['event', 'catering', 'photographer', 'DJ', 'general', 'miscellaneous']
};

// Price ranges by category (in USD)
const PRICE_RANGES = {
  'RIDE_MOVING': { min: 5, max: 200 },
  'PERSONAL_CARE': { min: 10, max: 150 },
  'TECH_SERVICES': { min: 25, max: 500 },
  'CONSTRUCTION': { min: 100, max: 5000 },
  'HOME_SERVICES': { min: 30, max: 300 },
  'EMERGENCY_SERVICES': { min: 50, max: 1000 },
  'AUTOMOBILE': { min: 20, max: 800 },
  'OTHERS': { min: 15, max: 1000 }
};

/**
 * Detect service intent from natural language using OpenAI
 */
async function detectServiceIntent(query) {
  try {
    const prompt = `Analyze this service request and identify the most appropriate service category:

Query: "${query}"

Available categories:
- RIDE_MOVING: Transportation, taxi, moving services
- PERSONAL_CARE: Hair, beauty, massage, salon services
- TECH_SERVICES: Computer, phone, tech repairs
- CONSTRUCTION: Building, renovation, contractors
- HOME_SERVICES: Plumbing, electrical, cleaning, handyman
- EMERGENCY_SERVICES: Medical, fire, police emergencies
- AUTOMOBILE: Car repairs, mechanics, tire services
- OTHERS: Events, catering, general services

Respond with ONLY the category name (e.g., "HOME_SERVICES").`;

    const response = await openai.createCompletion({
      model: "text-davinci-003",
      prompt: prompt,
      max_tokens: 20,
      temperature: 0.1,
    });

    const category = response.data.choices[0].text.trim().toUpperCase();
    
    // Validate category
    if (Object.keys(SERVICE_CATEGORIES).includes(category)) {
      return category;
    }
    
    // Fallback to keyword matching
    return detectIntentByKeywords(query);
  } catch (error) {
    console.error('OpenAI API error:', error);
    // Fallback to keyword matching
    return detectIntentByKeywords(query);
  }
}

/**
 * Fallback intent detection using keywords
 */
function detectIntentByKeywords(query) {
  const lowercaseQuery = query.toLowerCase();
  
  for (const [category, keywords] of Object.entries(SERVICE_CATEGORIES)) {
    for (const keyword of keywords) {
      if (lowercaseQuery.includes(keyword)) {
        return category;
      }
    }
  }
  
  return 'OTHERS'; // Default category
}

/**
 * Perform AI-powered search for services
 */
async function aiPoweredSearch(query, filters = {}) {
  try {
    // Detect intent
    const detectedCategory = await detectServiceIntent(query);
    
    // Apply category filter if detected
    const searchFilters = {
      ...filters,
      category: filters.category || detectedCategory
    };
    
    // Get price estimate
    const priceEstimate = estimateServicePrice(detectedCategory, query);
    
    // Mock service results (in production, this would query your database)
    const mockServices = [
      {
        id: '1',
        name: `${getCategoryDisplayName(detectedCategory)} Service`,
        category: detectedCategory,
        description: `Professional ${getCategoryDisplayName(detectedCategory).toLowerCase()} service`,
        basePrice: priceEstimate.min,
        rating: 4.5,
        provider: {
          name: 'John Doe',
          rating: 4.8,
          totalJobs: 150
        }
      }
    ];
    
    return {
      services: mockServices,
      detectedCategory,
      priceEstimate,
      searchQuery: query,
      filters: searchFilters
    };
  } catch (error) {
    console.error('AI search error:', error);
    throw error;
  }
}

/**
 * Estimate service price based on category and query
 */
function estimateServicePrice(category, query) {
  const range = PRICE_RANGES[category] || PRICE_RANGES['OTHERS'];
  
  // Basic price estimation logic
  let multiplier = 1;
  
  if (query.toLowerCase().includes('urgent') || query.toLowerCase().includes('emergency')) {
    multiplier = 1.5;
  }
  
  if (query.toLowerCase().includes('premium') || query.toLowerCase().includes('luxury')) {
    multiplier = 2;
  }
  
  return {
    min: Math.round(range.min * multiplier),
    max: Math.round(range.max * multiplier),
    currency: 'USD'
  };
}

/**
 * Get display name for category
 */
function getCategoryDisplayName(category) {
  const displayNames = {
    'RIDE_MOVING': 'Transportation',
    'PERSONAL_CARE': 'Personal Care',
    'TECH_SERVICES': 'Tech Services',
    'CONSTRUCTION': 'Construction',
    'HOME_SERVICES': 'Home Services',
    'EMERGENCY_SERVICES': 'Emergency Services',
    'AUTOMOBILE': 'Automobile',
    'OTHERS': 'Other Services'
  };
  
  return displayNames[category] || 'Service';
}

/**
 * Generate search suggestions
 */
async function getSearchSuggestions(query) {
  const suggestions = [
    'Fix leaking tap',
    'Haircut at home',
    'Computer repair',
    'House cleaning',
    'Car mechanic near me',
    'Emergency plumber',
    'Moving service',
    'Massage therapy'
  ];
  
  // Filter suggestions based on query
  if (query.length > 0) {
    return suggestions.filter(s => 
      s.toLowerCase().includes(query.toLowerCase())
    ).slice(0, 5);
  }
  
  return suggestions.slice(0, 5);
}

/**
 * Get AI recommendations based on user history
 */
async function getAIRecommendations(userId, location) {
  // Mock recommendations (in production, analyze user history)
  return [
    {
      id: '1',
      name: 'Home Cleaning Service',
      category: 'HOME_SERVICES',
      reason: 'Popular in your area',
      price: '$50-120'
    },
    {
      id: '2',
      name: 'Car Wash & Detail',
      category: 'AUTOMOBILE',
      reason: 'Frequently booked',
      price: '$30-80'
    }
  ];
}

module.exports = {
  detectServiceIntent,
  aiPoweredSearch,
  estimateServicePrice,
  getSearchSuggestions,
  getAIRecommendations,
  SERVICE_CATEGORIES,
  PRICE_RANGES
};