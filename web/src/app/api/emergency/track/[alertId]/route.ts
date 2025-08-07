import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@zippup/lib'

export async function GET(
  request: NextRequest,
  { params }: { params: { alertId: string } }
) {
  try {
    const { alertId } = params

    if (!alertId) {
      return NextResponse.json(
        { error: 'Alert ID is required' },
        { status: 400 }
      )
    }

    // Fetch emergency alert with user data
    const alert = await prisma.emergencyAlert.findUnique({
      where: { id: alertId },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            phone: true,
            emergencyContacts: true
          }
        }
      }
    })

    if (!alert) {
      return NextResponse.json(
        { error: 'Emergency alert not found' },
        { status: 404 }
      )
    }

    // Check if alert is still accessible (not older than 24 hours for security)
    const alertAge = Date.now() - new Date(alert.createdAt).getTime()
    const maxAge = 24 * 60 * 60 * 1000 // 24 hours

    if (alertAge > maxAge && alert.status !== 'ACTIVE') {
      return NextResponse.json(
        { error: 'Emergency alert has expired' },
        { status: 410 }
      )
    }

    // Parse emergency contacts
    let emergencyContacts = []
    try {
      if (alert.user.emergencyContacts) {
        emergencyContacts = Array.isArray(alert.user.emergencyContacts)
          ? alert.user.emergencyContacts
          : JSON.parse(alert.user.emergencyContacts as string)
      }
    } catch (error) {
      console.error('Error parsing emergency contacts:', error)
      emergencyContacts = []
    }

    // Parse location history
    let locationHistory = []
    try {
      if (alert.locationHistory) {
        locationHistory = Array.isArray(alert.locationHistory)
          ? alert.locationHistory
          : JSON.parse(alert.locationHistory as string)
      }
    } catch (error) {
      console.error('Error parsing location history:', error)
      locationHistory = []
    }

    // Parse contacts notified
    let contactsNotified = []
    try {
      if (alert.contactsNotified) {
        contactsNotified = Array.isArray(alert.contactsNotified)
          ? alert.contactsNotified
          : JSON.parse(alert.contactsNotified as string)
      }
    } catch (error) {
      console.error('Error parsing contacts notified:', error)
      contactsNotified = []
    }

    // Prepare response data
    const responseData = {
      id: alert.id,
      userId: alert.userId,
      userName: alert.user.name,
      userPhone: alert.user.phone,
      latitude: alert.latitude,
      longitude: alert.longitude,
      address: alert.address || `${alert.latitude}, ${alert.longitude}`,
      status: alert.status,
      message: alert.message || 'Emergency alert from ZippUp',
      trackingStarted: alert.trackingStarted.toISOString(),
      trackingEnded: alert.trackingEnded?.toISOString() || null,
      locationHistory,
      contactsNotified,
      authoritiesNotified: alert.authoritiesNotified,
      createdAt: alert.createdAt.toISOString(),
      updatedAt: alert.updatedAt.toISOString()
    }

    return NextResponse.json(responseData)

  } catch (error) {
    console.error('Error fetching emergency alert:', error)
    return NextResponse.json(
      { error: 'Failed to fetch emergency alert' },
      { status: 500 }
    )
  }
}

// Update emergency alert location (for real-time tracking)
export async function PATCH(
  request: NextRequest,
  { params }: { params: { alertId: string } }
) {
  try {
    const { alertId } = params
    const body = await request.json()
    const { latitude, longitude } = body

    if (!alertId) {
      return NextResponse.json(
        { error: 'Alert ID is required' },
        { status: 400 }
      )
    }

    if (!latitude || !longitude) {
      return NextResponse.json(
        { error: 'Latitude and longitude are required' },
        { status: 400 }
      )
    }

    // Check if alert exists and is active
    const alert = await prisma.emergencyAlert.findUnique({
      where: { id: alertId }
    })

    if (!alert) {
      return NextResponse.json(
        { error: 'Emergency alert not found' },
        { status: 404 }
      )
    }

    if (alert.status !== 'ACTIVE') {
      return NextResponse.json(
        { error: 'Emergency alert is not active' },
        { status: 400 }
      )
    }

    // Parse existing location history
    let locationHistory = []
    try {
      if (alert.locationHistory) {
        locationHistory = Array.isArray(alert.locationHistory)
          ? alert.locationHistory
          : JSON.parse(alert.locationHistory as string)
      }
    } catch (error) {
      console.error('Error parsing location history:', error)
      locationHistory = []
    }

    // Add new location to history
    const newLocation = {
      lat: parseFloat(latitude),
      lng: parseFloat(longitude),
      timestamp: new Date().toISOString()
    }

    locationHistory.push(newLocation)

    // Keep only last 100 locations to prevent excessive data
    if (locationHistory.length > 100) {
      locationHistory = locationHistory.slice(-100)
    }

    // Get updated address via reverse geocoding (simplified)
    let address = alert.address
    try {
      // In a real implementation, you'd use Google Maps Geocoding API here
      address = `${latitude.toFixed(6)}, ${longitude.toFixed(6)}`
    } catch (error) {
      console.error('Reverse geocoding failed:', error)
    }

    // Update alert with new location
    const updatedAlert = await prisma.emergencyAlert.update({
      where: { id: alertId },
      data: {
        latitude: parseFloat(latitude),
        longitude: parseFloat(longitude),
        address,
        locationHistory,
        updatedAt: new Date()
      }
    })

    // In a real implementation, you'd emit this update via WebSocket
    // io.to(`alert-${alertId}`).emit('location-update', {
    //   alertId,
    //   latitude: parseFloat(latitude),
    //   longitude: parseFloat(longitude),
    //   timestamp: new Date().toISOString()
    // })

    return NextResponse.json({
      success: true,
      message: 'Location updated successfully',
      latitude: updatedAlert.latitude,
      longitude: updatedAlert.longitude,
      timestamp: updatedAlert.updatedAt.toISOString()
    })

  } catch (error) {
    console.error('Error updating emergency alert location:', error)
    return NextResponse.json(
      { error: 'Failed to update location' },
      { status: 500 }
    )
  }
}

// End emergency tracking
export async function DELETE(
  request: NextRequest,
  { params }: { params: { alertId: string } }
) {
  try {
    const { alertId } = params

    if (!alertId) {
      return NextResponse.json(
        { error: 'Alert ID is required' },
        { status: 400 }
      )
    }

    // Check if alert exists and is active
    const alert = await prisma.emergencyAlert.findUnique({
      where: { id: alertId }
    })

    if (!alert) {
      return NextResponse.json(
        { error: 'Emergency alert not found' },
        { status: 404 }
      )
    }

    if (alert.status !== 'ACTIVE') {
      return NextResponse.json(
        { error: 'Emergency alert is not active' },
        { status: 400 }
      )
    }

    // End the tracking
    const updatedAlert = await prisma.emergencyAlert.update({
      where: { id: alertId },
      data: {
        status: 'RESOLVED',
        trackingEnded: new Date(),
        updatedAt: new Date()
      }
    })

    // In a real implementation, notify all connected clients
    // io.to(`alert-${alertId}`).emit('alert-ended', {
    //   alertId,
    //   status: 'RESOLVED',
    //   endedAt: updatedAlert.trackingEnded
    // })

    return NextResponse.json({
      success: true,
      message: 'Emergency tracking ended',
      status: updatedAlert.status,
      endedAt: updatedAlert.trackingEnded
    })

  } catch (error) {
    console.error('Error ending emergency alert:', error)
    return NextResponse.json(
      { error: 'Failed to end emergency tracking' },
      { status: 500 }
    )
  }
}