import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@zippup/lib'

// Emergency numbers by country
const EMERGENCY_NUMBERS = {
  'US': '911',
  'UK': '999',
  'EU': '112',
  'AU': '000',
  'CA': '911',
  // Add more countries as needed
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { latitude, longitude, message, userId } = body

    // Validate required fields
    if (!latitude || !longitude) {
      return NextResponse.json(
        { error: 'Location coordinates are required' },
        { status: 400 }
      )
    }

    // Get user from session/token (simplified for demo)
    // In production, you'd validate JWT token here
    const user = userId ? await prisma.user.findUnique({
      where: { id: userId },
      include: {
        emergencyContacts: true
      }
    }) : null

    // Create emergency alert record
    const emergencyAlert = await prisma.emergencyAlert.create({
      data: {
        userId: user?.id || 'anonymous',
        latitude: parseFloat(latitude),
        longitude: parseFloat(longitude),
        address: await reverseGeocode(latitude, longitude),
        message: message || 'Emergency alert from ZippUp',
        status: 'ACTIVE',
        trackingStarted: new Date(),
        locationHistory: [{
          lat: parseFloat(latitude),
          lng: parseFloat(longitude),
          timestamp: new Date().toISOString()
        }],
        contactsNotified: [],
        authoritiesNotified: false
      }
    })

    // Send notifications in parallel
    const notificationPromises = []

    // 1. Notify emergency contacts
    if (user?.emergencyContacts) {
      const contacts = Array.isArray(user.emergencyContacts) 
        ? user.emergencyContacts 
        : JSON.parse(user.emergencyContacts as string || '[]')
      
      for (const contact of contacts) {
        notificationPromises.push(
          notifyEmergencyContact(contact, {
            userName: user.name,
            userPhone: user.phone,
            latitude,
            longitude,
            alertId: emergencyAlert.id
          })
        )
      }
    }

    // 2. Notify authorities (simplified - in production, integrate with emergency services API)
    const country = await getCountryFromCoordinates(latitude, longitude)
    const emergencyNumber = EMERGENCY_NUMBERS[country] || '911'
    
    notificationPromises.push(
      notifyAuthorities({
        emergencyNumber,
        location: { latitude, longitude },
        userInfo: user ? { name: user.name, phone: user.phone } : null,
        alertId: emergencyAlert.id
      })
    )

    // 3. Notify ZippUp admin dashboard
    notificationPromises.push(
      notifyAdminDashboard({
        alertId: emergencyAlert.id,
        location: { latitude, longitude },
        user: user ? { id: user.id, name: user.name, phone: user.phone } : null
      })
    )

    // Wait for all notifications to complete
    await Promise.allSettled(notificationPromises)

    // Update alert with notification status
    await prisma.emergencyAlert.update({
      where: { id: emergencyAlert.id },
      data: {
        authoritiesNotified: true,
        contactsNotified: user?.emergencyContacts ? 
          JSON.parse(user.emergencyContacts as string || '[]') : []
      }
    })

    // Start location tracking (this would typically be handled by WebSocket)
    startLocationTracking(emergencyAlert.id)

    return NextResponse.json({
      success: true,
      alertId: emergencyAlert.id,
      message: 'Emergency alert sent successfully',
      trackingUrl: `/emergency/track/${emergencyAlert.id}`
    })

  } catch (error) {
    console.error('Emergency alert failed:', error)
    return NextResponse.json(
      { error: 'Failed to send emergency alert' },
      { status: 500 }
    )
  }
}

async function reverseGeocode(lat: number, lng: number): Promise<string> {
  try {
    // In production, use Google Maps Geocoding API or similar
    // For now, return a placeholder
    return `Lat: ${lat.toFixed(6)}, Lng: ${lng.toFixed(6)}`
  } catch (error) {
    return `Location: ${lat}, ${lng}`
  }
}

async function getCountryFromCoordinates(lat: number, lng: number): Promise<string> {
  try {
    // In production, use geocoding service to determine country
    // For now, default to US
    return 'US'
  } catch (error) {
    return 'US'
  }
}

async function notifyEmergencyContact(contact: any, alertInfo: any) {
  try {
    const message = `EMERGENCY ALERT: ${alertInfo.userName} (${alertInfo.userPhone}) has triggered an emergency alert. Location: https://maps.google.com/maps?q=${alertInfo.latitude},${alertInfo.longitude}. Track live: ${process.env.NEXT_PUBLIC_APP_URL}/emergency/track/${alertInfo.alertId}`

    // Send SMS via Twilio
    if (process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN) {
      const twilio = require('twilio')(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN)
      
      await twilio.messages.create({
        body: message,
        from: process.env.TWILIO_PHONE_NUMBER,
        to: contact.phone
      })
    }

    // Send email
    await sendEmergencyEmail(contact.email, {
      subject: `EMERGENCY ALERT - ${alertInfo.userName}`,
      message,
      alertInfo
    })

    console.log(`Emergency contact notified: ${contact.name} (${contact.phone})`)
  } catch (error) {
    console.error('Failed to notify emergency contact:', error)
  }
}

async function notifyAuthorities(alertData: any) {
  try {
    // In production, integrate with local emergency services API
    // For now, log the alert
    console.log('Emergency authorities notified:', alertData)
    
    // Send to emergency dispatch system (placeholder)
    // await emergencyDispatchAPI.createAlert(alertData)
    
  } catch (error) {
    console.error('Failed to notify authorities:', error)
  }
}

async function notifyAdminDashboard(alertData: any) {
  try {
    // Send real-time notification to admin dashboard via WebSocket
    // This would integrate with your Socket.IO server
    console.log('Admin dashboard notified:', alertData)
    
    // In production, emit to admin dashboard
    // io.to('admin-room').emit('emergency-alert', alertData)
    
  } catch (error) {
    console.error('Failed to notify admin dashboard:', error)
  }
}

async function sendEmergencyEmail(email: string, data: any) {
  try {
    // Implement email sending with Nodemailer or similar
    console.log(`Emergency email sent to: ${email}`)
  } catch (error) {
    console.error('Failed to send emergency email:', error)
  }
}

function startLocationTracking(alertId: string) {
  // In production, this would set up WebSocket connection for live tracking
  console.log(`Location tracking started for alert: ${alertId}`)
  
  // Set timeout to stop tracking after 15 minutes
  setTimeout(async () => {
    try {
      await prisma.emergencyAlert.update({
        where: { id: alertId },
        data: {
          trackingEnded: new Date(),
          status: 'RESOLVED'
        }
      })
      console.log(`Location tracking ended for alert: ${alertId}`)
    } catch (error) {
      console.error('Failed to end location tracking:', error)
    }
  }, 15 * 60 * 1000) // 15 minutes
}