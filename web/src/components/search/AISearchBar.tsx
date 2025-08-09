'use client'

import { useState, useEffect, useRef } from 'react'
import { Search, Loader2, Mic } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { apiFetch } from '@/lib/api'

interface SearchResult {
  services: Array<{
    id: string
    name: string
    category: string
    description: string
    basePrice: number
    rating: number
    provider: {
      name: string
      rating: number
      totalJobs: number
    }
  }>
  detectedCategory: string
  priceEstimate: {
    min: number
    max: number
    currency: string
  }
  searchQuery: string
}

export default function AISearchBar() {
  const [query, setQuery] = useState('')
  const [suggestions, setSuggestions] = useState<string[]>([])
  const [showSuggestions, setShowSuggestions] = useState(false)
  const [isSearching, setIsSearching] = useState(false)
  const [results, setResults] = useState<SearchResult | null>(null)
  const [isListening, setIsListening] = useState(false)
  
  const inputRef = useRef<HTMLInputElement>(null)
  const suggestionsRef = useRef<HTMLDivElement>(null)
  const router = useRouter()

  // Fetch suggestions as user types
  useEffect(() => {
    if (query.length > 1) {
      const timer = setTimeout(async () => {
        try {
          const response = await apiFetch('/api/search/suggestions', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ query })
          })
          const data = await response.json()
          setSuggestions(data.suggestions || [])
          setShowSuggestions(true)
        } catch (error) {
          console.error('Failed to fetch suggestions:', error)
        }
      }, 300)
      
      return () => clearTimeout(timer)
    } else {
      setSuggestions([])
      setShowSuggestions(false)
    }
  }, [query])

  // Handle voice search
  const startVoiceSearch = () => {
    if (!('webkitSpeechRecognition' in window)) {
      alert('Voice search is not supported in your browser')
      return
    }

    const recognition = new (window as any).webkitSpeechRecognition()
    recognition.continuous = false
    recognition.interimResults = false
    recognition.lang = 'en-US'

    recognition.onstart = () => {
      setIsListening(true)
    }

    recognition.onresult = (event: any) => {
      const transcript = event.results[0][0].transcript
      setQuery(transcript)
      setIsListening(false)
      // Auto-search after voice input
      setTimeout(() => handleSearch(transcript), 100)
    }

    recognition.onerror = () => {
      setIsListening(false)
      alert('Voice search failed. Please try again.')
    }

    recognition.onend = () => {
      setIsListening(false)
    }

    recognition.start()
  }

  const handleSearch = async (searchQuery = query) => {
    if (!searchQuery.trim()) return
    
    setIsSearching(true)
    setShowSuggestions(false)
    
    try {
      const response = await apiFetch('/api/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: searchQuery })
      })
      
      const data = await response.json()
      
      if (data.success) {
        setResults(data)
      } else {
        throw new Error(data.error || 'Search failed')
      }
    } catch (error) {
      console.error('Search failed:', error)
      alert('Search failed. Please try again.')
    } finally {
      setIsSearching(false)
    }
  }

  const handleSuggestionClick = (suggestion: string) => {
    setQuery(suggestion)
    setShowSuggestions(false)
    handleSearch(suggestion)
  }

  const handleResultClick = (serviceId: string) => {
    router.push(`/book/${serviceId}`)
  }

  return (
    <div className="relative w-full max-w-2xl mx-auto">
      {/* Search Input */}
      <div className="relative">
        <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => setShowSuggestions(suggestions.length > 0)}
          onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
          placeholder="Tell us what you need... (e.g., 'fix my leaking tap', 'haircut at home')"
          className="w-full pl-12 pr-32 py-4 text-lg border border-gray-300 rounded-full focus:ring-2 focus:ring-zippup-500 focus:border-zippup-500 shadow-lg"
          disabled={isSearching}
        />
        <div className="absolute right-2 top-1/2 transform -translate-y-1/2 flex items-center space-x-2">
          <button
            onClick={startVoiceSearch}
            disabled={isSearching || isListening}
            className={`p-3 rounded-full transition-all duration-200 ${
              isListening
                ? 'bg-red-500 text-white shadow-lg animate-pulse'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200 hover:text-gray-800'
            } disabled:opacity-50 disabled:cursor-not-allowed`}
            title={isListening ? 'Listening...' : 'Voice search'}
          >
            <Mic className="h-5 w-5" />
          </button>
          <button
            onClick={() => handleSearch()}
            disabled={isSearching || !query.trim()}
            className="bg-zippup-500 text-white px-6 py-2 rounded-full hover:bg-zippup-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
          >
            {isSearching ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Searching...
              </>
            ) : (
              'Search'
            )}
          </button>
        </div>
      </div>

      {/* Suggestions Dropdown */}
      {showSuggestions && suggestions.length > 0 && (
        <div 
          ref={suggestionsRef}
          className="absolute top-full left-0 right-0 mt-2 bg-white border border-gray-200 rounded-xl shadow-lg z-50 max-h-60 overflow-y-auto"
        >
          {suggestions.map((suggestion, index) => (
            <button
              key={index}
              onClick={() => handleSuggestionClick(suggestion)}
              className="w-full text-left px-4 py-3 hover:bg-gray-50 transition-colors border-b border-gray-100 last:border-b-0"
            >
              <div className="flex items-center">
                <Search className="h-4 w-4 text-gray-400 mr-3" />
                <span className="text-gray-700">{suggestion}</span>
              </div>
            </button>
          ))}
        </div>
      )}

      {/* Search Results */}
      {results && (
        <div className="mt-6 bg-white border border-gray-200 rounded-xl shadow-lg p-6">
          <div className="mb-4">
            <h3 className="text-lg font-semibold text-gray-900">
              Found services for "{results.searchQuery}"
            </h3>
            <p className="text-sm text-gray-600">
              Detected category: {results.detectedCategory.replace('_', ' ')} • 
              Price range: {results.priceEstimate.currency} ${results.priceEstimate.min}-${results.priceEstimate.max}
            </p>
          </div>
          
          <div className="space-y-4">
            {results.services.map((service) => (
              <div
                key={service.id}
                onClick={() => handleResultClick(service.id)}
                className="border border-gray-200 rounded-lg p-4 hover:border-zippup-500 hover:shadow-md transition-all cursor-pointer"
              >
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <h4 className="font-semibold text-gray-900">{service.name}</h4>
                    <p className="text-sm text-gray-600 mt-1">{service.description}</p>
                    <div className="flex items-center mt-2 space-x-4">
                      <span className="text-sm text-gray-500">
                        by {service.provider.name}
                      </span>
                      <span className="text-sm text-yellow-600">
                        ⭐ {service.provider.rating} ({service.provider.totalJobs} jobs)
                      </span>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="text-lg font-bold text-zippup-600">
                      ${service.basePrice}+
                    </span>
                    <div className="text-sm text-gray-500">starting price</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}