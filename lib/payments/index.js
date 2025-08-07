import Stripe from 'stripe'

// Initialize Stripe with secret key
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
  apiVersion: '2023-10-16',
})

// Payment status constants
export const PAYMENT_STATUS = {
  PENDING: 'PENDING',
  PROCESSING: 'PROCESSING',
  SUCCEEDED: 'SUCCEEDED',
  FAILED: 'FAILED',
  CANCELLED: 'CANCELLED',
  REFUNDED: 'REFUNDED',
  DISPUTED: 'DISPUTED'
}

// Commission rates
export const COMMISSION_RATES = {
  SERVICE: parseFloat(process.env.SERVICE_COMMISSION_RATE || '0.20'), // 20%
  DIGITAL: parseFloat(process.env.DIGITAL_COMMISSION_RATE || '0.05'), // 5%
  MARKETPLACE: parseFloat(process.env.MARKETPLACE_COMMISSION_RATE || '0.10') // 10%
}

// Create payment intent for service booking
export async function createServicePaymentIntent({
  amount,
  currency = 'usd',
  customerId,
  bookingId,
  providerId,
  serviceType = 'SERVICE'
}) {
  try {
    const commission = calculateCommission(amount, serviceType)
    const providerAmount = amount - commission

    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(amount * 100), // Convert to cents
      currency,
      customer: customerId,
      metadata: {
        bookingId,
        providerId,
        serviceType,
        commission: commission.toString(),
        providerAmount: providerAmount.toString()
      },
      transfer_group: `booking_${bookingId}`,
      automatic_payment_methods: {
        enabled: true,
      },
    })

    return {
      clientSecret: paymentIntent.client_secret,
      paymentIntentId: paymentIntent.id,
      amount,
      commission,
      providerAmount
    }
  } catch (error) {
    console.error('Error creating payment intent:', error)
    throw new Error('Failed to create payment intent')
  }
}

// Create payment intent for marketplace order
export async function createMarketplacePaymentIntent({
  amount,
  currency = 'usd',
  customerId,
  orderId,
  vendorId,
  items
}) {
  try {
    const commission = calculateCommission(amount, 'MARKETPLACE')
    const vendorAmount = amount - commission

    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(amount * 100),
      currency,
      customer: customerId,
      metadata: {
        orderId,
        vendorId,
        type: 'marketplace',
        commission: commission.toString(),
        vendorAmount: vendorAmount.toString(),
        itemCount: items?.length?.toString() || '0'
      },
      transfer_group: `order_${orderId}`,
      automatic_payment_methods: {
        enabled: true,
      },
    })

    return {
      clientSecret: paymentIntent.client_secret,
      paymentIntentId: paymentIntent.id,
      amount,
      commission,
      vendorAmount
    }
  } catch (error) {
    console.error('Error creating marketplace payment intent:', error)
    throw new Error('Failed to create marketplace payment intent')
  }
}

// Create wallet top-up payment intent
export async function createWalletTopUpIntent({
  amount,
  currency = 'usd',
  customerId,
  walletId
}) {
  try {
    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(amount * 100),
      currency,
      customer: customerId,
      metadata: {
        walletId,
        type: 'wallet_topup'
      },
      automatic_payment_methods: {
        enabled: true,
      },
    })

    return {
      clientSecret: paymentIntent.client_secret,
      paymentIntentId: paymentIntent.id,
      amount
    }
  } catch (error) {
    console.error('Error creating wallet top-up intent:', error)
    throw new Error('Failed to create wallet top-up intent')
  }
}

// Process refund
export async function processRefund({
  paymentIntentId,
  amount,
  reason = 'requested_by_customer'
}) {
  try {
    const refund = await stripe.refunds.create({
      payment_intent: paymentIntentId,
      amount: amount ? Math.round(amount * 100) : undefined,
      reason,
      metadata: {
        refundedAt: new Date().toISOString()
      }
    })

    return {
      refundId: refund.id,
      amount: refund.amount / 100,
      status: refund.status
    }
  } catch (error) {
    console.error('Error processing refund:', error)
    throw new Error('Failed to process refund')
  }
}

// Transfer funds to provider/vendor (for escrow release)
export async function transferToProvider({
  amount,
  providerId,
  bookingId,
  transferGroup
}) {
  try {
    // In a real implementation, you'd have Stripe Connect accounts
    // For now, we'll simulate the transfer
    console.log(`Transfer initiated: $${amount} to provider ${providerId} for booking ${bookingId}`)
    
    // This would be the actual Stripe transfer:
    // const transfer = await stripe.transfers.create({
    //   amount: Math.round(amount * 100),
    //   currency: 'usd',
    //   destination: providerStripeAccountId,
    //   transfer_group: transferGroup,
    //   metadata: {
    //     bookingId,
    //     providerId
    //   }
    // })

    return {
      transferId: `sim_${Date.now()}`,
      amount,
      status: 'succeeded'
    }
  } catch (error) {
    console.error('Error transferring to provider:', error)
    throw new Error('Failed to transfer funds')
  }
}

// Create Stripe customer
export async function createStripeCustomer({
  email,
  name,
  phone,
  userId
}) {
  try {
    const customer = await stripe.customers.create({
      email,
      name,
      phone,
      metadata: {
        userId
      }
    })

    return {
      stripeCustomerId: customer.id,
      email: customer.email,
      name: customer.name
    }
  } catch (error) {
    console.error('Error creating Stripe customer:', error)
    throw new Error('Failed to create Stripe customer')
  }
}

// Get payment methods for customer
export async function getCustomerPaymentMethods(customerId) {
  try {
    const paymentMethods = await stripe.paymentMethods.list({
      customer: customerId,
      type: 'card',
    })

    return paymentMethods.data.map(pm => ({
      id: pm.id,
      type: pm.type,
      card: {
        brand: pm.card?.brand,
        last4: pm.card?.last4,
        expMonth: pm.card?.exp_month,
        expYear: pm.card?.exp_year
      },
      isDefault: pm.id === paymentMethods.data[0]?.id
    }))
  } catch (error) {
    console.error('Error fetching payment methods:', error)
    throw new Error('Failed to fetch payment methods')
  }
}

// Calculate commission based on service type
export function calculateCommission(amount, serviceType) {
  const rate = COMMISSION_RATES[serviceType] || COMMISSION_RATES.SERVICE
  return Math.round(amount * rate * 100) / 100 // Round to 2 decimal places
}

// Validate payment amount
export function validatePaymentAmount(amount, minAmount = 0.50, maxAmount = 999999) {
  if (typeof amount !== 'number' || amount <= 0) {
    throw new Error('Invalid payment amount')
  }
  
  if (amount < minAmount) {
    throw new Error(`Minimum payment amount is $${minAmount}`)
  }
  
  if (amount > maxAmount) {
    throw new Error(`Maximum payment amount is $${maxAmount}`)
  }
  
  return true
}

// Format currency for display
export function formatCurrency(amount, currency = 'USD') {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency.toUpperCase(),
  }).format(amount)
}

// Handle webhook events
export async function handleStripeWebhook(event) {
  try {
    switch (event.type) {
      case 'payment_intent.succeeded':
        await handlePaymentSucceeded(event.data.object)
        break
        
      case 'payment_intent.payment_failed':
        await handlePaymentFailed(event.data.object)
        break
        
      case 'charge.dispute.created':
        await handleDisputeCreated(event.data.object)
        break
        
      case 'customer.subscription.deleted':
        await handleSubscriptionDeleted(event.data.object)
        break
        
      default:
        console.log(`Unhandled event type: ${event.type}`)
    }
  } catch (error) {
    console.error('Error handling webhook:', error)
    throw error
  }
}

// Handle successful payment
async function handlePaymentSucceeded(paymentIntent) {
  const { metadata } = paymentIntent
  
  if (metadata.bookingId) {
    // Update booking payment status
    await updateBookingPaymentStatus(metadata.bookingId, 'PAID')
  } else if (metadata.orderId) {
    // Update order payment status
    await updateOrderPaymentStatus(metadata.orderId, 'PAID')
  } else if (metadata.walletId) {
    // Add funds to wallet
    await addFundsToWallet(metadata.walletId, paymentIntent.amount / 100)
  }
}

// Handle failed payment
async function handlePaymentFailed(paymentIntent) {
  const { metadata } = paymentIntent
  
  if (metadata.bookingId) {
    await updateBookingPaymentStatus(metadata.bookingId, 'FAILED')
  } else if (metadata.orderId) {
    await updateOrderPaymentStatus(metadata.orderId, 'FAILED')
  }
}

// Handle dispute creation
async function handleDisputeCreated(charge) {
  // Create dispute record in database
  console.log('Dispute created for charge:', charge.id)
  // Implement dispute handling logic
}

// Placeholder functions (implement with actual database operations)
async function updateBookingPaymentStatus(bookingId, status) {
  console.log(`Update booking ${bookingId} payment status to ${status}`)
}

async function updateOrderPaymentStatus(orderId, status) {
  console.log(`Update order ${orderId} payment status to ${status}`)
}

async function addFundsToWallet(walletId, amount) {
  console.log(`Add $${amount} to wallet ${walletId}`)
}

// Emergency payment processing (for urgent services)
export async function processEmergencyPayment({
  amount,
  customerId,
  bookingId,
  providerId
}) {
  try {
    // Emergency payments get higher priority and immediate processing
    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(amount * 100),
      currency: 'usd',
      customer: customerId,
      confirmation_method: 'automatic',
      metadata: {
        bookingId,
        providerId,
        type: 'emergency',
        priority: 'high'
      },
      transfer_group: `emergency_${bookingId}`,
    })

    return {
      clientSecret: paymentIntent.client_secret,
      paymentIntentId: paymentIntent.id,
      amount,
      status: paymentIntent.status
    }
  } catch (error) {
    console.error('Error processing emergency payment:', error)
    throw new Error('Failed to process emergency payment')
  }
}