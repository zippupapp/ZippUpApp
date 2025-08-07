'use client'

import { useState, useEffect } from 'react'
import { loadStripe } from '@stripe/stripe-js'
import { Elements, CardElement, useStripe, useElements } from '@stripe/react-stripe-js'
import { 
  CreditCard, 
  Plus, 
  ArrowUpRight, 
  ArrowDownRight, 
  DollarSign,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle
} from 'lucide-react'
import { formatCurrency } from '@zippup/lib/payments'

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!)

interface Wallet {
  id: string
  balance: number
  currency: string
  isBlocked: boolean
}

interface Transaction {
  id: string
  type: 'TOP_UP' | 'PAYMENT' | 'COMMISSION' | 'REFUND' | 'WITHDRAWAL'
  amount: number
  currency: string
  description: string
  status: 'PENDING' | 'PAID' | 'FAILED' | 'CANCELLED'
  createdAt: string
  gateway?: string
}

interface WalletDashboardProps {
  userId: string
}

export default function WalletDashboard({ userId }: WalletDashboardProps) {
  return (
    <Elements stripe={stripePromise}>
      <WalletContent userId={userId} />
    </Elements>
  )
}

function WalletContent({ userId }: WalletDashboardProps) {
  const [wallet, setWallet] = useState<Wallet | null>(null)
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [loading, setLoading] = useState(true)
  const [showTopUp, setShowTopUp] = useState(false)
  const [topUpAmount, setTopUpAmount] = useState('')
  const [processing, setProcessing] = useState(false)

  const stripe = useStripe()
  const elements = useElements()

  useEffect(() => {
    fetchWalletData()
  }, [userId])

  const fetchWalletData = async () => {
    try {
      setLoading(true)
      
      // Fetch wallet info
      const walletResponse = await fetch(`/api/wallet/${userId}`)
      if (walletResponse.ok) {
        const walletData = await walletResponse.json()
        setWallet(walletData)
      }

      // Fetch transactions
      const transactionsResponse = await fetch(`/api/wallet/${userId}/transactions`)
      if (transactionsResponse.ok) {
        const transactionsData = await transactionsResponse.json()
        setTransactions(transactionsData)
      }
    } catch (error) {
      console.error('Error fetching wallet data:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleTopUp = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!stripe || !elements || !topUpAmount) return

    const amount = parseFloat(topUpAmount)
    if (amount < 0.50) {
      alert('Minimum top-up amount is $0.50')
      return
    }

    setProcessing(true)

    try {
      // Create payment intent
      const response = await fetch('/api/payments/create-intent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'wallet',
          amount,
          userId,
          walletId: wallet?.id
        })
      })

      if (!response.ok) {
        throw new Error('Failed to create payment intent')
      }

      const { clientSecret } = await response.json()

      // Confirm payment
      const cardElement = elements.getElement(CardElement)
      if (!cardElement) {
        throw new Error('Card element not found')
      }

      const { error, paymentIntent } = await stripe.confirmCardPayment(clientSecret, {
        payment_method: {
          card: cardElement,
        }
      })

      if (error) {
        throw new Error(error.message)
      }

      if (paymentIntent.status === 'succeeded') {
        alert('Wallet top-up successful!')
        setTopUpAmount('')
        setShowTopUp(false)
        fetchWalletData() // Refresh data
      }
    } catch (error) {
      console.error('Top-up failed:', error)
      alert(`Top-up failed: ${error.message}`)
    } finally {
      setProcessing(false)
    }
  }

  const getTransactionIcon = (type: string, status: string) => {
    if (status === 'PENDING') return <Clock className="h-4 w-4 text-yellow-500" />
    if (status === 'FAILED' || status === 'CANCELLED') return <XCircle className="h-4 w-4 text-red-500" />
    
    switch (type) {
      case 'TOP_UP':
        return <ArrowDownRight className="h-4 w-4 text-green-500" />
      case 'PAYMENT':
      case 'COMMISSION':
        return <ArrowUpRight className="h-4 w-4 text-red-500" />
      case 'REFUND':
        return <ArrowDownRight className="h-4 w-4 text-blue-500" />
      default:
        return <DollarSign className="h-4 w-4 text-gray-500" />
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'PAID': return 'text-green-600 bg-green-100'
      case 'PENDING': return 'text-yellow-600 bg-yellow-100'
      case 'FAILED': return 'text-red-600 bg-red-100'
      case 'CANCELLED': return 'text-gray-600 bg-gray-100'
      default: return 'text-gray-600 bg-gray-100'
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="loading-spinner" />
        <span className="ml-2">Loading wallet...</span>
      </div>
    )
  }

  if (!wallet) {
    return (
      <div className="text-center p-8">
        <AlertCircle className="h-16 w-16 text-red-500 mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-gray-900 mb-2">Wallet Not Found</h3>
        <p className="text-gray-600">Unable to load wallet information.</p>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      {/* Wallet Balance Card */}
      <div className="bg-gradient-to-br from-zippup-500 to-zippup-700 rounded-2xl p-6 text-white">
        <div className="flex items-center justify-between mb-4">
          <div>
            <p className="text-blue-100 text-sm">Available Balance</p>
            <h2 className="text-3xl font-bold">
              {formatCurrency(wallet.balance, wallet.currency)}
            </h2>
          </div>
          <div className="bg-white/20 p-3 rounded-full">
            <CreditCard className="h-8 w-8" />
          </div>
        </div>
        
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            {wallet.isBlocked ? (
              <>
                <XCircle className="h-4 w-4 text-red-300" />
                <span className="text-red-300 text-sm">Wallet Blocked</span>
              </>
            ) : (
              <>
                <CheckCircle className="h-4 w-4 text-green-300" />
                <span className="text-green-300 text-sm">Active</span>
              </>
            )}
          </div>
          
          <button
            onClick={() => setShowTopUp(true)}
            disabled={wallet.isBlocked}
            className="bg-white text-zippup-600 px-4 py-2 rounded-lg font-medium hover:bg-blue-50 transition-colors flex items-center disabled:opacity-50"
          >
            <Plus className="h-4 w-4 mr-2" />
            Top Up
          </button>
        </div>
      </div>

      {/* Top-up Modal */}
      {showTopUp && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <h3 className="text-xl font-semibold mb-4">Top Up Wallet</h3>
            
            <form onSubmit={handleTopUp} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Amount (USD)
                </label>
                <input
                  type="number"
                  value={topUpAmount}
                  onChange={(e) => setTopUpAmount(e.target.value)}
                  placeholder="0.00"
                  step="0.01"
                  min="0.50"
                  max="10000"
                  required
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-zippup-500 focus:border-zippup-500"
                />
                <p className="text-xs text-gray-500 mt-1">Minimum: $0.50</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Payment Method
                </label>
                <div className="p-3 border border-gray-300 rounded-lg">
                  <CardElement
                    options={{
                      style: {
                        base: {
                          fontSize: '16px',
                          color: '#424770',
                          '::placeholder': {
                            color: '#aab7c4',
                          },
                        },
                      },
                    }}
                  />
                </div>
              </div>

              <div className="flex space-x-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowTopUp(false)}
                  className="flex-1 px-4 py-2 text-gray-700 bg-gray-200 rounded-lg hover:bg-gray-300 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={processing || !stripe}
                  className="flex-1 px-4 py-2 bg-zippup-500 text-white rounded-lg hover:bg-zippup-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {processing ? 'Processing...' : `Top Up ${formatCurrency(parseFloat(topUpAmount) || 0)}`}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Transaction History */}
      <div className="bg-white rounded-lg shadow-lg">
        <div className="p-6 border-b border-gray-200">
          <h3 className="text-xl font-semibold text-gray-900">Transaction History</h3>
        </div>
        
        <div className="divide-y divide-gray-200">
          {transactions.length === 0 ? (
            <div className="p-6 text-center text-gray-500">
              <DollarSign className="h-12 w-12 mx-auto mb-3 text-gray-400" />
              <p>No transactions yet</p>
            </div>
          ) : (
            transactions.map((transaction) => (
              <div key={transaction.id} className="p-6 hover:bg-gray-50">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    {getTransactionIcon(transaction.type, transaction.status)}
                    <div>
                      <p className="font-medium text-gray-900">
                        {transaction.description}
                      </p>
                      <p className="text-sm text-gray-500">
                        {new Date(transaction.createdAt).toLocaleDateString()} at{' '}
                        {new Date(transaction.createdAt).toLocaleTimeString()}
                      </p>
                      {transaction.gateway && (
                        <p className="text-xs text-gray-400">
                          via {transaction.gateway}
                        </p>
                      )}
                    </div>
                  </div>
                  
                  <div className="text-right">
                    <p className={`font-semibold ${
                      transaction.type === 'TOP_UP' || transaction.type === 'REFUND' 
                        ? 'text-green-600' 
                        : 'text-red-600'
                    }`}>
                      {transaction.type === 'TOP_UP' || transaction.type === 'REFUND' ? '+' : '-'}
                      {formatCurrency(transaction.amount, transaction.currency)}
                    </p>
                    <span className={`inline-block px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(transaction.status)}`}>
                      {transaction.status.toLowerCase()}
                    </span>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-white rounded-lg shadow-lg p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <button className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors text-left">
            <ArrowUpRight className="h-6 w-6 text-zippup-500 mb-2" />
            <p className="font-medium">Send Money</p>
            <p className="text-sm text-gray-500">Transfer to other users</p>
          </button>
          
          <button className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors text-left">
            <ArrowDownRight className="h-6 w-6 text-green-500 mb-2" />
            <p className="font-medium">Request Payment</p>
            <p className="text-sm text-gray-500">Request from customers</p>
          </button>
          
          <button className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors text-left">
            <DollarSign className="h-6 w-6 text-blue-500 mb-2" />
            <p className="font-medium">Withdraw</p>
            <p className="text-sm text-gray-500">To bank account</p>
          </button>
        </div>
      </div>
    </div>
  )
}