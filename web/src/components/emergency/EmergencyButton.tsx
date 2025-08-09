'use client'

import { useState } from 'react'
import { Phone, AlertTriangle, X } from 'lucide-react'
import toast from 'react-hot-toast'
import { apiFetch } from '@/lib/api'

interface EmergencyButtonProps {
  className?: string
}

export default function EmergencyButton({ className = '' }: EmergencyButtonProps) {
  const [showConfirmation, setShowConfirmation] = useState(false)
  const [isActivating, setIsActivating] = useState(false)

  const handleEmergencyClick = () => {
    setShowConfirmation(true)
  }

  const handleCancel = () => {
    setShowConfirmation(false)
  }

  const handleConfirmEmergency = async () => {
    setIsActivating(true)
    
    try {
      // Get current location
      const position = await getCurrentLocation()
      
      // Prepare emergency data
      const emergencyData = {
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
        timestamp: new Date().toISOString(),
        message: 'Emergency alert activated from ZippUp app'
      }

      // Send emergency alert to backend
      const response = await apiFetch('/api/emergency/alert', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(emergencyData),
      })

      if (response.ok) {
        toast.success('Emergency alert sent! Help is on the way.')
        
        // Show emergency active state
        setShowConfirmation(false)
        
        // Redirect to emergency tracking page returned by API
        const data = await response.json()
        if (data.trackingUrl) {
          window.location.href = data.trackingUrl
        } else if (data.alertId) {
          window.location.href = `/emergency/track/${data.alertId}`
        } else {
          window.location.href = '/'
        }
      } else {
        throw new Error('Failed to send emergency alert')
      }
    } catch (error) {
      console.error('Emergency alert failed:', error)
      toast.error('Failed to send emergency alert. Please call emergency services directly.')
    } finally {
      setIsActivating(false)
    }
  }

  const getCurrentLocation = (): Promise<GeolocationPosition> => {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        reject(new Error('Geolocation is not supported'))
        return
      }

      navigator.geolocation.getCurrentPosition(
        resolve,
        reject,
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 60000
        }
      )
    })
  }

  return (
    <>
      {/* Emergency Button - Fixed Position */}
      <button
        onClick={handleEmergencyClick}
        className={`fixed bottom-6 right-6 z-50 emergency-button ${className}`}
        aria-label="Emergency Alert"
      >
        <Phone className="h-6 w-6 mr-2" />
        Emergency
      </button>

      {/* Confirmation Modal */}
      {showConfirmation && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[60] p-4">
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center">
                <AlertTriangle className="h-8 w-8 text-red-500 mr-3" />
                <h3 className="text-xl font-bold text-gray-900">
                  Emergency Alert
                </h3>
              </div>
              <button
                onClick={handleCancel}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="h-6 w-6" />
              </button>
            </div>
            
            <div className="mb-6">
              <p className="text-gray-700 mb-4">
                Are you sure you want to send an emergency alert?
              </p>
              
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <h4 className="font-semibold text-red-800 mb-2">
                  This will:
                </h4>
                <ul className="text-sm text-red-700 space-y-1">
                  <li>• Send your location to emergency contacts</li>
                  <li>• Notify local emergency services</li>
                  <li>• Start live location tracking for 15 minutes</li>
                  <li>• Alert ZippUp support team</li>
                </ul>
              </div>
            </div>
            
            <div className="flex space-x-4">
              <button
                onClick={handleCancel}
                className="flex-1 px-4 py-2 text-gray-700 bg-gray-200 rounded-lg hover:bg-gray-300 transition-colors"
                disabled={isActivating}
              >
                Cancel
              </button>
              
              <button
                onClick={handleConfirmEmergency}
                disabled={isActivating}
                className="flex-1 px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isActivating ? (
                  <div className="flex items-center justify-center">
                    <div className="loading-spinner mr-2" />
                    Sending...
                  </div>
                ) : (
                  'Confirm Emergency'
                )}
              </button>
            </div>
            
            <p className="text-xs text-gray-500 mt-4 text-center">
              False alarms may result in charges. Only use in real emergencies.
            </p>
          </div>
        </div>
      )}
    </>
  )
}