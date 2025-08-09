import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@zippup/lib'

export async function GET(
  _request: NextRequest,
  { params }: { params: { userId: string } }
) {
  try {
    const { userId } = params

    if (!userId) {
      return NextResponse.json(
        { error: 'userId is required' },
        { status: 400 }
      )
    }

    const wallet = await prisma.wallet.findUnique({ where: { userId } })
    if (!wallet) {
      return NextResponse.json(
        { error: 'Wallet not found' },
        { status: 404 }
      )
    }

    const transactions = await prisma.transaction.findMany({
      where: { walletId: wallet.id },
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        type: true,
        amount: true,
        currency: true,
        description: true,
        status: true,
        createdAt: true,
        gateway: true,
      }
    })

    return NextResponse.json(transactions)
  } catch (error) {
    console.error('Error fetching wallet transactions:', error)
    return NextResponse.json(
      { error: 'Failed to fetch wallet transactions' },
      { status: 500 }
    )
  }
}