import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import { prisma } from '@zippup/lib'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2023-10-16',
})

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { 
      amount, 
      currency = 'usd', 
      serviceId, 
      userId,
      description,
      metadata = {}
    } = body

    // Validate required fields
    if (!amount || !serviceId || !userId) {
      return NextResponse.json(
        { error: 'Amount, serviceId, and userId are required' },
        { status: 400 }
      )
    }

    // Verify user exists
    const user = await prisma.user.findUnique({
      where: { id: userId }
    })

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    // Verify service exists
    const service = await prisma.service.findUnique({
      where: { id: serviceId }
    })

    if (!service) {
      return NextResponse.json(
        { error: 'Service not found' },
        { status: 404 }
      )
    }

    // Create or get Stripe customer
    let stripeCustomerId = user.stripeCustomerId
    
    if (!stripeCustomerId) {
      const customer = await stripe.customers.create({
        email: user.email,
        phone: user.phone,
        name: user.name,
        metadata: {
          zippupUserId: user.id
        }
      })
      
      stripeCustomerId = customer.id
      
      // Update user with Stripe customer ID
      await prisma.user.update({
        where: { id: userId },
        data: { stripeCustomerId }
      })
    }

    // Create payment intent
    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(amount * 100), // Convert to cents
      currency,
      customer: stripeCustomerId,
      description: description || `Payment for ${service.name}`,
      metadata: {
        serviceId,
        userId,
        serviceName: service.name,
        ...metadata
      },
      automatic_payment_methods: {
        enabled: true,
      },
      setup_future_usage: 'off_session', // For future recurring payments
    })

    // Create payment record in database
    const payment = await prisma.payment.create({
      data: {
        id: paymentIntent.id,
        userId,
        serviceId,
        amount: parseFloat(amount.toString()),
        currency,
        status: 'PENDING',
        paymentMethod: 'STRIPE',
        stripePaymentIntentId: paymentIntent.id,
        metadata: {
          stripeCustomerId,
          serviceName: service.name,
          ...metadata
        }
      }
    })

    return NextResponse.json({
      clientSecret: paymentIntent.client_secret,
      paymentIntentId: paymentIntent.id,
      paymentId: payment.id
    })

  } catch (error) {
    console.error('Stripe payment intent creation failed:', error)
    return NextResponse.json(
      { error: 'Failed to create payment intent' },
      { status: 500 }
    )
  }
}