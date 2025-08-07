import { NextRequest, NextResponse } from 'next/server'
import { headers } from 'next/headers'
import Stripe from 'stripe'
import { handleStripeWebhook } from '@zippup/lib/payments'
import { prisma } from '@zippup/lib'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2023-10-16',
})

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET!

export async function POST(request: NextRequest) {
  try {
    const body = await request.text()
    const headersList = headers()
    const signature = headersList.get('stripe-signature')

    if (!signature) {
      return NextResponse.json(
        { error: 'Missing stripe-signature header' },
        { status: 400 }
      )
    }

    let event: Stripe.Event

    try {
      event = stripe.webhooks.constructEvent(body, signature, webhookSecret)
    } catch (err) {
      console.error('Webhook signature verification failed:', err)
      return NextResponse.json(
        { error: 'Webhook signature verification failed' },
        { status: 400 }
      )
    }

    // Process the webhook event
    await processWebhookEvent(event)

    return NextResponse.json({ received: true })

  } catch (error) {
    console.error('Webhook processing failed:', error)
    return NextResponse.json(
      { error: 'Webhook processing failed' },
      { status: 500 }
    )
  }
}

async function processWebhookEvent(event: Stripe.Event) {
  try {
    switch (event.type) {
      case 'payment_intent.succeeded':
        await handlePaymentIntentSucceeded(event.data.object as Stripe.PaymentIntent)
        break

      case 'payment_intent.payment_failed':
        await handlePaymentIntentFailed(event.data.object as Stripe.PaymentIntent)
        break

      case 'payment_intent.canceled':
        await handlePaymentIntentCanceled(event.data.object as Stripe.PaymentIntent)
        break

      case 'charge.dispute.created':
        await handleChargeDisputeCreated(event.data.object as Stripe.Dispute)
        break

      case 'invoice.payment_succeeded':
        await handleInvoicePaymentSucceeded(event.data.object as Stripe.Invoice)
        break

      case 'customer.subscription.deleted':
        await handleSubscriptionDeleted(event.data.object as Stripe.Subscription)
        break

      case 'account.updated':
        await handleAccountUpdated(event.data.object as Stripe.Account)
        break

      default:
        console.log(`Unhandled event type: ${event.type}`)
    }
  } catch (error) {
    console.error(`Error processing ${event.type}:`, error)
    throw error
  }
}

async function handlePaymentIntentSucceeded(paymentIntent: Stripe.PaymentIntent) {
  const { metadata } = paymentIntent
  const amount = paymentIntent.amount / 100 // Convert from cents

  console.log(`Payment succeeded: ${paymentIntent.id} for $${amount}`)

  // Update transaction status
  await prisma.transaction.updateMany({
    where: { gatewayTxId: paymentIntent.id },
    data: { 
      status: 'PAID',
      updatedAt: new Date()
    }
  })

  if (metadata.bookingId) {
    // Update booking payment status
    await prisma.booking.update({
      where: { id: metadata.bookingId },
      data: { 
        paymentStatus: 'PAID',
        updatedAt: new Date()
      }
    })

    // If it's an emergency booking, prioritize it
    if (metadata.type === 'emergency') {
      await handleEmergencyPaymentSuccess(metadata.bookingId, amount)
    }

    // Send notification to provider
    await notifyProvider(metadata.providerId, 'payment_received', {
      bookingId: metadata.bookingId,
      amount,
      commission: parseFloat(metadata.commission || '0')
    })

  } else if (metadata.orderId) {
    // Update marketplace order payment status
    await prisma.order.update({
      where: { id: metadata.orderId },
      data: { 
        paymentStatus: 'PAID',
        updatedAt: new Date()
      }
    })

    // Send notification to vendor
    await notifyVendor(metadata.vendorId, 'payment_received', {
      orderId: metadata.orderId,
      amount,
      commission: parseFloat(metadata.commission || '0')
    })

  } else if (metadata.walletId) {
    // Add funds to wallet
    await prisma.wallet.update({
      where: { id: metadata.walletId },
      data: {
        balance: { increment: amount },
        updatedAt: new Date()
      }
    })

    // Create wallet transaction record
    await prisma.transaction.create({
      data: {
        userId: paymentIntent.customer as string,
        walletId: metadata.walletId,
        type: 'TOP_UP',
        amount,
        currency: paymentIntent.currency.toUpperCase(),
        description: 'Wallet top-up via Stripe',
        status: 'PAID',
        gateway: 'stripe',
        gatewayTxId: paymentIntent.id
      }
    })
  }
}

async function handlePaymentIntentFailed(paymentIntent: Stripe.PaymentIntent) {
  const { metadata } = paymentIntent
  
  console.log(`Payment failed: ${paymentIntent.id}`)

  // Update transaction status
  await prisma.transaction.updateMany({
    where: { gatewayTxId: paymentIntent.id },
    data: { 
      status: 'FAILED',
      updatedAt: new Date()
    }
  })

  if (metadata.bookingId) {
    await prisma.booking.update({
      where: { id: metadata.bookingId },
      data: { 
        paymentStatus: 'FAILED',
        updatedAt: new Date()
      }
    })

    // If emergency payment failed, try alternative payment methods or notify admin
    if (metadata.type === 'emergency') {
      await handleEmergencyPaymentFailure(metadata.bookingId)
    }

  } else if (metadata.orderId) {
    await prisma.order.update({
      where: { id: metadata.orderId },
      data: { 
        paymentStatus: 'FAILED',
        updatedAt: new Date()
      }
    })
  }
}

async function handlePaymentIntentCanceled(paymentIntent: Stripe.PaymentIntent) {
  const { metadata } = paymentIntent
  
  console.log(`Payment canceled: ${paymentIntent.id}`)

  await prisma.transaction.updateMany({
    where: { gatewayTxId: paymentIntent.id },
    data: { 
      status: 'CANCELLED',
      updatedAt: new Date()
    }
  })

  if (metadata.bookingId) {
    await prisma.booking.update({
      where: { id: metadata.bookingId },
      data: { 
        paymentStatus: 'CANCELLED',
        status: 'CANCELLED',
        updatedAt: new Date()
      }
    })
  } else if (metadata.orderId) {
    await prisma.order.update({
      where: { id: metadata.orderId },
      data: { 
        paymentStatus: 'CANCELLED',
        status: 'CANCELLED',
        updatedAt: new Date()
      }
    })
  }
}

async function handleChargeDisputeCreated(dispute: Stripe.Dispute) {
  console.log(`Dispute created: ${dispute.id} for charge ${dispute.charge}`)

  // Create dispute record in database
  await prisma.dispute.create({
    data: {
      reason: dispute.reason,
      description: `Stripe dispute: ${dispute.reason}`,
      status: 'OPEN',
      // Note: You'd need to map the charge to booking/order
      createdAt: new Date(dispute.created * 1000)
    }
  })

  // Notify admin team about dispute
  await notifyAdmin('dispute_created', {
    disputeId: dispute.id,
    chargeId: dispute.charge,
    amount: dispute.amount / 100,
    reason: dispute.reason
  })
}

async function handleInvoicePaymentSucceeded(invoice: Stripe.Invoice) {
  console.log(`Invoice payment succeeded: ${invoice.id}`)
  // Handle subscription payments if you have recurring services
}

async function handleSubscriptionDeleted(subscription: Stripe.Subscription) {
  console.log(`Subscription deleted: ${subscription.id}`)
  // Handle subscription cancellations
}

async function handleAccountUpdated(account: Stripe.Account) {
  console.log(`Account updated: ${account.id}`)
  // Handle Stripe Connect account updates for providers/vendors
}

async function handleEmergencyPaymentSuccess(bookingId: string, amount: number) {
  // Mark emergency booking as priority
  await prisma.booking.update({
    where: { id: bookingId },
    data: { 
      urgency: 'EMERGENCY',
      updatedAt: new Date()
    }
  })

  // Send high-priority notification to nearest providers
  console.log(`Emergency payment processed: ${bookingId} - $${amount}`)
  // Implement emergency provider notification logic
}

async function handleEmergencyPaymentFailure(bookingId: string) {
  // Escalate to admin for manual processing
  console.log(`Emergency payment failed for booking: ${bookingId}`)
  
  await notifyAdmin('emergency_payment_failed', {
    bookingId,
    timestamp: new Date().toISOString(),
    priority: 'CRITICAL'
  })
}

async function notifyProvider(providerId: string, event: string, data: any) {
  // Send real-time notification to provider
  console.log(`Notify provider ${providerId}: ${event}`, data)
  
  // Create notification record
  await prisma.notification.create({
    data: {
      userId: providerId,
      title: 'Payment Received',
      message: `You received a payment of $${data.amount}`,
      type: event,
      data: JSON.stringify(data)
    }
  })

  // In production, emit via WebSocket or send push notification
}

async function notifyVendor(vendorId: string, event: string, data: any) {
  console.log(`Notify vendor ${vendorId}: ${event}`, data)
  
  await prisma.notification.create({
    data: {
      userId: vendorId,
      title: 'Payment Received',
      message: `You received a payment of $${data.amount} for order ${data.orderId}`,
      type: event,
      data: JSON.stringify(data)
    }
  })
}

async function notifyAdmin(event: string, data: any) {
  console.log(`Admin notification: ${event}`, data)
  
  // Create admin notification
  const adminEmail = process.env.ADMIN_EMAIL
  if (adminEmail) {
    // Send email notification to admin
    console.log(`Email admin: ${event}`, data)
  }

  // Store in database for admin dashboard
  // You could create an AdminNotification model for this
}