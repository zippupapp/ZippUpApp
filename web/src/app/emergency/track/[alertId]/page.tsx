'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import GoogleMap from '@/components/maps/GoogleMap'
import { AlertTriangle, Phone, Clock, MapPin, Users } from 'lucide-react'

interface EmergencyAlert {
  id: string
  userId: string
  userName: string
  userPhone: string
  latitude: number
  longitude: number
  address: string
  status: 'ACTIVE' | 'RESOLVED' | 'FALSE_ALARM'
  message: string
  trackingStarted: string
  trackingEnded?: string
  locationHistory: Array<{
    lat: number
    lng: number
    timestamp: string
  }>
  contactsNotified: Array<{
    name: string
    phone: string
    relationship: string
  }>
  authoritiesNotified: boolean
}

export default function EmergencyTrackingPage() {
  const params = useParams()
  const alertId = params.alertId as string
  
  const [alert, setAlert] = useState<EmergencyAlert | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [timeElapsed, setTimeElapsed] = useState<string>('')

  // Fetch emergency alert data
  useEffect(() => {
    const fetchAlert = async () => {
      try {
        const response = await fetch(`/api/emergency/track/${alertId}`)
        if (!response.ok) {
          throw new Error('Emergency alert not found')
        }
        const data = await response.json()
        setAlert(data)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load emergency alert')
      } finally {
        setLoading(false)
      }
    }

    fetchAlert()
  }, [alertId])

  // Update time elapsed
  useEffect(() => {
    if (!alert) return

    const updateTimeElapsed = () => {
      const start = new Date(alert.trackingStarted)
      const now = new Date()
      const diff = now.getTime() - start.getTime()
      
      const minutes = Math.floor(diff / 60000)
      const seconds = Math.floor((diff % 60000) / 1000)
      
      setTimeElapsed(`${minutes}:${seconds.toString().padStart(2, '0')}`)
    }

    updateTimeElapsed()
    const interval = setInterval(updateTimeElapsed, 1000)

    return () => clearInterval(interval)
  }, [alert])

  // Set up real-time location updates (WebSocket)
  useEffect(() => {
    if (!alert) return

    // In a real implementation, you'd connect to WebSocket here
    // const socket = io('/emergency')
    // socket.emit('join-alert', alertId)
    // socket.on('location-update', (data) => {
    //   setAlert(prev => prev ? {
    //     ...prev,
    //     latitude: data.latitude,
    //     longitude: data.longitude,
    //     locationHistory: [...prev.locationHistory, {
    //       lat: data.latitude,
    //       lng: data.longitude,
    //       timestamp: new Date().toISOString()
    //     }]
    //   } : null)
    // })

    // Simulate location updates for demo
    const interval = setInterval(() => {
      if (alert.status === 'ACTIVE') {
        setAlert(prev => {
          if (!prev) return null
          
          // Simulate small location changes
          const newLat = prev.latitude + (Math.random() - 0.5) * 0.001
          const newLng = prev.longitude + (Math.random() - 0.5) * 0.001
          
          return {
            ...prev,
            latitude: newLat,
            longitude: newLng,
            locationHistory: [...prev.locationHistory, {
              lat: newLat,
              lng: newLng,
              timestamp: new Date().toISOString()
            }].slice(-50) // Keep last 50 locations
          }
        })
      }
    }, 5000) // Update every 5 seconds

    return () => clearInterval(interval)
  }, [alert, alertId])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="loading-spinner mx-auto mb-4" />
          <p>Loading emergency alert...</p>
        </div>
      </div>
    )
  }

  if (error || !alert) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <AlertTriangle className="h-16 w-16 text-red-500 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            Emergency Alert Not Found
          </h1>
          <p className="text-gray-600 mb-4">
            {error || 'The emergency alert you are looking for does not exist or has expired.'}
          </p>
          <button
            onClick={() => window.location.href = '/'}
            className="bg-zippup-500 text-white px-6 py-2 rounded-lg hover:bg-zippup-600"
          >
            Go to Homepage
          </button>
        </div>
      </div>
    )
  }

  const statusColor = {
    'ACTIVE': 'text-red-500 bg-red-100',
    'RESOLVED': 'text-green-500 bg-green-100',
    'FALSE_ALARM': 'text-yellow-500 bg-yellow-100'
  }[alert.status]

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <AlertTriangle className="h-8 w-8 text-red-500 mr-3" />
              <div>
                <h1 className="text-2xl font-bold text-gray-900">
                  Emergency Tracking
                </h1>
                <p className="text-gray-600">Alert ID: {alertId}</p>
              </div>
            </div>
            
            <div className={`px-3 py-1 rounded-full text-sm font-medium ${statusColor}`}>
              {alert.status.replace('_', ' ')}
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Map */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg shadow-lg p-6">
              <h2 className="text-xl font-semibold mb-4">Live Location</h2>
              
              <GoogleMap
                center={{ lat: alert.latitude, lng: alert.longitude }}
                zoom={15}
                className="w-full h-96 relative"
                markers={[
                  {
                    position: { lat: alert.latitude, lng: alert.longitude },
                    title: `${alert.userName} - Current Location`,
                    info: `
                      <div class="p-2">
                        <h3 class="font-semibold">${alert.userName}</h3>
                        <p class="text-sm text-gray-600">${alert.address}</p>
                        <p class="text-xs text-gray-500">Last updated: ${new Date().toLocaleTimeString()}</p>
                      </div>
                    `,
                    icon: 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(`
                      <svg width="32" height="32" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <circle cx="16" cy="16" r="12" fill="#ef4444" stroke="#ffffff" stroke-width="2"/>
                        <circle cx="16" cy="16" r="4" fill="#ffffff"/>
                      </svg>
                    `)
                  },
                  ...alert.locationHistory.slice(-10).map((location, index) => ({
                    position: { lat: location.lat, lng: location.lng },
                    title: `Previous Location ${index + 1}`,
                    icon: 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(`
                      <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <circle cx="8" cy="8" r="6" fill="#fca5a5" stroke="#ffffff" stroke-width="1"/>
                      </svg>
                    `)
                  }))
                ]}
                trackingMode={true}
              />
              
              {alert.status === 'ACTIVE' && (
                <div className="mt-4 flex items-center justify-center">
                  <div className="flex items-center text-red-500">
                    <div className="animate-pulse-emergency w-3 h-3 bg-red-500 rounded-full mr-2" />
                    <span className="font-medium">Live tracking active</span>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Alert Details */}
          <div className="space-y-6">
            {/* User Info */}
            <div className="bg-white rounded-lg shadow-lg p-6">
              <h3 className="text-lg font-semibold mb-4">User Information</h3>
              
              <div className="space-y-3">
                <div>
                  <label className="text-sm text-gray-500">Name</label>
                  <p className="font-medium">{alert.userName}</p>
                </div>
                
                <div>
                  <label className="text-sm text-gray-500">Phone</label>
                  <div className="flex items-center">
                    <p className="font-medium mr-2">{alert.userPhone}</p>
                    <a
                      href={`tel:${alert.userPhone}`}
                      className="p-1 text-green-600 hover:text-green-700"
                    >
                      <Phone className="h-4 w-4" />
                    </a>
                  </div>
                </div>
                
                <div>
                  <label className="text-sm text-gray-500">Current Address</label>
                  <p className="font-medium">{alert.address}</p>
                </div>
              </div>
            </div>

            {/* Timing */}
            <div className="bg-white rounded-lg shadow-lg p-6">
              <h3 className="text-lg font-semibold mb-4">Timing</h3>
              
              <div className="space-y-3">
                <div className="flex items-center">
                  <Clock className="h-5 w-5 text-gray-400 mr-2" />
                  <div>
                    <p className="text-sm text-gray-500">Time Elapsed</p>
                    <p className="font-mono text-lg font-bold text-red-600">
                      {timeElapsed}
                    </p>
                  </div>
                </div>
                
                <div>
                  <label className="text-sm text-gray-500">Started</label>
                  <p className="font-medium">
                    {new Date(alert.trackingStarted).toLocaleString()}
                  </p>
                </div>
                
                {alert.trackingEnded && (
                  <div>
                    <label className="text-sm text-gray-500">Ended</label>
                    <p className="font-medium">
                      {new Date(alert.trackingEnded).toLocaleString()}
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Notifications Sent */}
            <div className="bg-white rounded-lg shadow-lg p-6">
              <h3 className="text-lg font-semibold mb-4">Notifications Sent</h3>
              
              <div className="space-y-3">
                <div className="flex items-center">
                  <Users className="h-5 w-5 text-green-500 mr-2" />
                  <span className="text-sm">
                    Emergency contacts ({alert.contactsNotified.length})
                  </span>
                </div>
                
                <div className="flex items-center">
                  <Phone className="h-5 w-5 text-blue-500 mr-2" />
                  <span className="text-sm">
                    Emergency services {alert.authoritiesNotified ? '✓' : '✗'}
                  </span>
                </div>
                
                <div className="flex items-center">
                  <AlertTriangle className="h-5 w-5 text-orange-500 mr-2" />
                  <span className="text-sm">ZippUp admin team ✓</span>
                </div>
              </div>
              
              {alert.contactsNotified.length > 0 && (
                <div className="mt-4 pt-4 border-t">
                  <h4 className="text-sm font-medium text-gray-700 mb-2">
                    Emergency Contacts:
                  </h4>
                  <ul className="space-y-1">
                    {alert.contactsNotified.map((contact, index) => (
                      <li key={index} className="text-sm text-gray-600">
                        {contact.name} ({contact.relationship}) - {contact.phone}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>

            {/* Emergency Actions */}
            {alert.status === 'ACTIVE' && (
              <div className="bg-white rounded-lg shadow-lg p-6">
                <h3 className="text-lg font-semibold mb-4">Emergency Actions</h3>
                
                <div className="space-y-3">
                  <a
                    href={`tel:911`}
                    className="w-full bg-red-500 text-white py-2 px-4 rounded-lg hover:bg-red-600 transition-colors flex items-center justify-center"
                  >
                    <Phone className="h-4 w-4 mr-2" />
                    Call Emergency Services
                  </a>
                  
                  <a
                    href={`tel:${alert.userPhone}`}
                    className="w-full bg-green-500 text-white py-2 px-4 rounded-lg hover:bg-green-600 transition-colors flex items-center justify-center"
                  >
                    <Phone className="h-4 w-4 mr-2" />
                    Call {alert.userName}
                  </a>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}