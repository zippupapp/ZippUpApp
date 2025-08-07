import { NextRequest, NextResponse } from 'next/server'
import { createServicePaymentIntent, createMarketplacePaymentIntent, createWalletTopUpIntent, validatePaymentAmount } from '@zippup/lib/payments'
import { prisma } from '@zippup/lib'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { type, amount, currency, userId, ...metadata } = body

    // Validate required fields
    if (!type || !amount || !userId) {
      return NextResponse.json(
        { error: 'Type, amount, and userId are required' },
        { status: 400 }
      )
    }

    // Validate payment amount
    try {
      validatePaymentAmount(amount)
    } catch (error) {
      return NextResponse.json(
        { error: error.message },
        { status: 400 }
      )
    }

    // Get user and create Stripe customer if needed
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { wallet: true }
    })

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    // Get or create Stripe customer
    let stripeCustomerId = user.stripeCustomerId
    if (!stripeCustomerId) {
      const { createStripeCustomer } = await import('@zippup/lib/payments')
      const stripeCustomer = await createStripeCustomer({
        email: user.email,
        name: user.name,
        phone: user.phone,
        userId: user.id
      })
      
      stripeCustomerId = stripeCustomer.stripeCustomerId
      
      // Update user with Stripe customer ID
      await prisma.user.update({
        where: { id: userId },
        data: { stripeCustomerId }
      })
    }

    let paymentIntent

    switch (type) {
      case 'service':
        const { bookingId, providerId, serviceType } = metadata
        if (!bookingId || !providerId) {
          return NextResponse.json(
            { error: 'bookingId and providerId are required for service payments' },
            { status: 400 }
          )
        }

        paymentIntent = await createServicePaymentIntent({
          amount,
          currency,
          customerId: stripeCustomerId,
          bookingId,
          providerId,
          serviceType
        })
        break

      case 'marketplace':
        const { orderId, vendorId, items } = metadata
        if (!orderId || !vendorId) {
          return NextResponse.json(
            { error: 'orderId and vendorId are required for marketplace payments' },
            { status: 400 }
          )
        }

        paymentIntent = await createMarketplacePaymentIntent({
          amount,
          currency,
          customerId: stripeCustomerId,
          orderId,
          vendorId,
          items
        })
        break

      case 'wallet':
        if (!user.wallet) {
          return NextResponse.json(
            { error: 'User wallet not found' },
            { status: 404 }
          )
        }

        paymentIntent = await createWalletTopUpIntent({
          amount,
          currency,
          customerId: stripeCustomerId,
          walletId: user.wallet.id
        })
        break

      case 'emergency':
        const { emergencyBookingId, emergencyProviderId } = metadata
        if (!emergencyBookingId || !emergencyProviderId) {
          return NextResponse.json(
            { error: 'emergencyBookingId and emergencyProviderId are required for emergency payments' },
            { status: 400 }
          )
        }

        const { processEmergencyPayment } = await import('@zippup/lib/payments')
        paymentIntent = await processEmergencyPayment({
          amount,
          customerId: stripeCustomerId,
          bookingId: emergencyBookingId,
          providerId: emergencyProviderId
        })
        break

      default:
        return NextResponse.json(
          { error: 'Invalid payment type. Must be: service, marketplace, wallet, or emergency' },
          { status: 400 }
        )
    }

    // Create transaction record
    await prisma.transaction.create({
      data: {
        userId,
        walletId: user.wallet?.id || '',
        bookingId: metadata.bookingId || metadata.emergencyBookingId || null,
        type: type === 'wallet' ? 'TOP_UP' : 'PAYMENT',
        amount,
        currency: currency || 'USD',
        description: `${type} payment`,
        reference: paymentIntent.paymentIntentId,
        status: 'PENDING',
        gateway: 'stripe',
        gatewayTxId: paymentIntent.paymentIntentId
      }
    })

    return NextResponse.json({
      success: true,
      clientSecret: paymentIntent.clientSecret,
      paymentIntentId: paymentIntent.paymentIntentId,
      amount: paymentIntent.amount,
      commission: paymentIntent.commission,
      providerAmount: paymentIntent.providerAmount || paymentIntent.vendorAmount
    })

  } catch (error) {
    console.error('Error creating payment intent:', error)
    return NextResponse.json(
      { error: 'Failed to create payment intent' },
      { status: 500 }
    )
  }
}