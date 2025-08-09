'use client'

import { useEffect, useRef, useState } from 'react'
import { Loader } from '@googlemaps/js-api-loader'

interface GoogleMapProps {
  center?: { lat: number; lng: number }
  zoom?: number
  markers?: Array<{
    position: { lat: number; lng: number }
    title?: string
    info?: string
    icon?: string
  }>
  onMapClick?: (lat: number, lng: number) => void
  onMarkerClick?: (marker: any) => void
  className?: string
  showCurrentLocation?: boolean
  trackingMode?: boolean
}

export default function GoogleMap({
  center = { lat: 40.7128, lng: -74.0060 }, // Default to NYC
  zoom = 13,
  markers = [],
  onMapClick,
  onMarkerClick,
  className = 'w-full h-96',
  showCurrentLocation = true,
  trackingMode = false
}: GoogleMapProps) {
  const mapRef = useRef<HTMLDivElement>(null)
  // @ts-ignore - google namespace provided by Maps JS API at runtime
  const [map, setMap] = useState<google.maps.Map | null>(null)
  // @ts-ignore - google namespace provided by Maps JS API at runtime
  const [currentLocationMarker, setCurrentLocationMarker] = useState<google.maps.Marker | null>(null)
  const [isLoaded, setIsLoaded] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Initialize Google Maps
  useEffect(() => {
    const initMap = async () => {
      try {
        const loader = new Loader({
          apiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY!,
          version: 'weekly',
          libraries: ['places', 'geometry']
        })

        await loader.load()

        if (mapRef.current) {
          // @ts-ignore - google namespace provided at runtime
          const mapInstance = new google.maps.Map(mapRef.current, {
            center,
            zoom,
            // @ts-ignore - google namespace provided at runtime
            mapTypeId: google.maps.MapTypeId.ROADMAP,
            zoomControl: true,
            mapTypeControl: false,
            scaleControl: true,
            streetViewControl: false,
            rotateControl: false,
            fullscreenControl: true,
            styles: [
              {
                featureType: 'poi',
                elementType: 'labels',
                stylers: [{ visibility: 'off' }]
              }
            ]
          })

          setMap(mapInstance)
          setIsLoaded(true)

          // Add click listener
          if (onMapClick) {
            // @ts-ignore - google namespace provided at runtime
            mapInstance.addListener('click', (e: google.maps.MapMouseEvent) => {
              if (e.latLng) {
                onMapClick(e.latLng.lat(), e.latLng.lng())
              }
            })
          }
        }
      } catch (err) {
        console.error('Error loading Google Maps:', err)
        setError('Failed to load Google Maps')
      }
    }

    initMap()
  }, [center.lat, center.lng, zoom, onMapClick])

  // Handle current location
  useEffect(() => {
    if (map && showCurrentLocation) {
      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          (position) => {
            const currentPos = {
              lat: position.coords.latitude,
              lng: position.coords.longitude
            }

            // Remove existing current location marker
            if (currentLocationMarker) {
              currentLocationMarker.setMap(null)
            }

            // Create current location marker
            // @ts-ignore - google namespace provided at runtime
            const marker = new google.maps.Marker({
              position: currentPos,
              map,
              title: 'Your Location',
              icon: {
                url: 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(`
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <circle cx="12" cy="12" r="8" fill="#0ea5e9" stroke="#ffffff" stroke-width="2"/>
                    <circle cx="12" cy="12" r="3" fill="#ffffff"/>
                  </svg>
                `),
                // @ts-ignore - google namespace provided at runtime
                scaledSize: new google.maps.Size(24, 24),
                // @ts-ignore - google namespace provided at runtime
                anchor: new google.maps.Point(12, 12)
              }
            })

            setCurrentLocationMarker(marker)

            // Center map on current location if tracking mode
            if (trackingMode) {
              map.setCenter(currentPos)
            }
          },
          (error) => {
            console.warn('Error getting current location:', error)
          }
        )
      }
    }
  }, [map, showCurrentLocation, trackingMode])

  // Handle markers
  useEffect(() => {
    if (map && markers.length > 0) {
      markers.forEach((markerData, index) => {
        // @ts-ignore - google namespace provided at runtime
        const marker = new google.maps.Marker({
          position: markerData.position,
          map,
          title: markerData.title || `Marker ${index + 1}`,
                     icon: markerData.icon ? {
             url: markerData.icon,
             // @ts-ignore - google namespace provided at runtime
             scaledSize: new google.maps.Size(32, 32)
           } : undefined
        })

        // Add info window if info is provided
        if (markerData.info) {
          // @ts-ignore - google namespace provided at runtime
          const infoWindow = new google.maps.InfoWindow({
            content: markerData.info
          })

          marker.addListener('click', () => {
            infoWindow.open(map, marker)
            if (onMarkerClick) {
              onMarkerClick(markerData)
            }
          })
        } else if (onMarkerClick) {
          marker.addListener('click', () => {
            onMarkerClick(markerData)
          })
        }
      })
    }
  }, [map, markers, onMarkerClick])

  if (error) {
    return (
      <div className={`${className} flex items-center justify-center bg-gray-100 rounded-lg`}>
        <div className="text-center">
          <p className="text-red-500 mb-2">Map Error</p>
          <p className="text-sm text-gray-600">{error}</p>
        </div>
      </div>
    )
  }

  return (
    <div className={className}>
      <div ref={mapRef} className="w-full h-full rounded-lg" />
      {!isLoaded && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-100 rounded-lg">
          <div className="text-center">
            <div className="loading-spinner mx-auto mb-2" />
            <p className="text-sm text-gray-600">Loading map...</p>
          </div>
        </div>
      )}
    </div>
  )
}

// Hook for geocoding
export function useGeocoding() {
  const geocodeAddress = async (address: string): Promise<{ lat: number; lng: number } | null> => {
    try {
      const loader = new Loader({
        apiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY!,
        libraries: ['places']
      })

      await loader.load()

      // @ts-ignore - google namespace provided at runtime
      const geocoder = new google.maps.Geocoder()
      
      return new Promise((resolve) => {
        geocoder.geocode({ address }, (results: any, status: any) => {
          if (status === 'OK' && results?.[0]) {
            const location = results[0].geometry.location
            resolve({
              lat: location.lat(),
              lng: location.lng()
            })
          } else {
            resolve(null)
          }
        })
      })
    } catch (error) {
      console.error('Geocoding error:', error)
      return null
    }
  }

  const reverseGeocode = async (lat: number, lng: number): Promise<string | null> => {
    try {
      const loader = new Loader({
        apiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY!,
        libraries: ['places']
      })

      await loader.load()

      // @ts-ignore - google namespace provided at runtime
      const geocoder = new google.maps.Geocoder()
      
      return new Promise((resolve) => {
        geocoder.geocode({ location: { lat, lng } }, (results: any, status: any) => {
          if (status === 'OK' && results?.[0]) {
            resolve(results[0].formatted_address)
          } else {
            resolve(null)
          }
        })
      })
    } catch (error) {
      console.error('Reverse geocoding error:', error)
      return null
    }
  }

  return { geocodeAddress, reverseGeocode }
}