import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import { prisma } from '@zippup/lib'
import { headers } from 'next/headers'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2023-10-16',
})

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET!

export async function POST(request: NextRequest) {
  try {
    const body = await request.text()
    const headersList = await headers()
    const signature = headersList.get('stripe-signature')

    if (!signature) {
      return NextResponse.json(
        { error: 'Missing stripe signature' },
        { status: 400 }
      )
    }

    let event: Stripe.Event

    try {
      event = stripe.webhooks.constructEvent(body, signature, webhookSecret)
    } catch (err) {
      console.error('Webhook signature verification failed:', err)
      return NextResponse.json(
        { error: 'Invalid signature' },
        { status: 400 }
      )
    }

    // Handle the event
    switch (event.type) {
      case 'payment_intent.succeeded':
        await handlePaymentSuccess(event.data.object as Stripe.PaymentIntent)
        break
        
      case 'payment_intent.payment_failed':
        await handlePaymentFailure(event.data.object as Stripe.PaymentIntent)
        break
        
      case 'charge.dispute.created':
        await handleDisputeCreated(event.data.object as Stripe.Dispute)
        break
        
      case 'customer.subscription.created':
        await handleSubscriptionCreated(event.data.object as Stripe.Subscription)
        break
        
      case 'customer.subscription.updated':
        await handleSubscriptionUpdated(event.data.object as Stripe.Subscription)
        break
        
      case 'customer.subscription.deleted':
        await handleSubscriptionDeleted(event.data.object as Stripe.Subscription)
        break
        
      default:
        console.log(`Unhandled event type: ${event.type}`)
    }

    return NextResponse.json({ received: true })

  } catch (error) {
    console.error('Webhook processing failed:', error)
    return NextResponse.json(
      { error: 'Webhook processing failed' },
      { status: 500 }
    )
  }
}

async function handlePaymentSuccess(paymentIntent: Stripe.PaymentIntent) {
  try {
    const { serviceId, userId } = paymentIntent.metadata
    
    // Update payment status
    await prisma.payment.update({
      where: { id: paymentIntent.id },
      data: { 
        status: 'PAID',
        paidAt: new Date(),
        metadata: {
          ...paymentIntent.metadata,
          stripeChargeId: paymentIntent.latest_charge as string
        }
      }
    })

    // Create or update booking
    if (serviceId && userId) {
      await prisma.booking.create({
        data: {
          userId,
          serviceId,
          status: 'ACCEPTED',
          paymentId: paymentIntent.id,
          amount: paymentIntent.amount / 100, // Convert from cents
          currency: paymentIntent.currency,
          bookingDate: new Date(),
          metadata: {
            stripePaymentIntentId: paymentIntent.id,
            stripeChargeId: paymentIntent.latest_charge as string
          }
        }
      })

      // Update user wallet if applicable
      await prisma.wallet.update({
        where: { userId },
        data: {
          balance: {
            increment: paymentIntent.amount / 100
          }
        }
      })
    }

    console.log(`Payment succeeded for ${paymentIntent.id}`)
  } catch (error) {
    console.error('Failed to handle payment success:', error)
  }
}

async function handlePaymentFailure(paymentIntent: Stripe.PaymentIntent) {
  try {
    const { serviceId, userId } = paymentIntent.metadata
    
    // Update payment status
    await prisma.payment.update({
      where: { id: paymentIntent.id },
      data: { 
        status: 'FAILED',
        failedAt: new Date(),
        metadata: {
          ...paymentIntent.metadata,
          failureReason: paymentIntent.last_payment_error?.message || 'Payment failed'
        }
      }
    })

    // Update booking status if exists
    if (serviceId && userId) {
      await prisma.booking.updateMany({
        where: { 
          userId,
          serviceId,
          paymentId: paymentIntent.id
        },
        data: { 
          status: 'CANCELLED',
          cancelledAt: new Date(),
          cancellationReason: 'Payment failed'
        }
      })
    }

    console.log(`Payment failed for ${paymentIntent.id}`)
  } catch (error) {
    console.error('Failed to handle payment failure:', error)
  }
}

async function handleDisputeCreated(dispute: Stripe.Dispute) {
  try {
    // Create dispute record
    await prisma.dispute.create({
      data: {
        id: dispute.id,
        paymentId: dispute.payment_intent as string,
        reason: dispute.reason,
        amount: dispute.amount / 100,
        currency: dispute.currency,
        status: 'OPEN',
        stripeDisputeId: dispute.id,
        metadata: {
          stripeChargeId: dispute.charge as string,
          evidenceDueBy: dispute.evidence_details?.due_by,
          reasonDescription: dispute.reason
        }
      }
    })

    console.log(`Dispute created for ${dispute.id}`)
  } catch (error) {
    console.error('Failed to handle dispute creation:', error)
  }
}

async function handleSubscriptionCreated(subscription: Stripe.Subscription) {
  try {
    // Handle subscription creation for premium services
    console.log(`Subscription created: ${subscription.id}`)
  } catch (error) {
    console.error('Failed to handle subscription creation:', error)
  }
}

async function handleSubscriptionUpdated(subscription: Stripe.Subscription) {
  try {
    // Handle subscription updates
    console.log(`Subscription updated: ${subscription.id}`)
  } catch (error) {
    console.error('Failed to handle subscription update:', error)
  }
}

async function handleSubscriptionDeleted(subscription: Stripe.Subscription) {
  try {
    // Handle subscription cancellation
    console.log(`Subscription deleted: ${subscription.id}`)
  } catch (error) {
    console.error('Failed to handle subscription deletion:', error)
  }
}