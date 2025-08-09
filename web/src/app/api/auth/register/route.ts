import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@zippup/lib'
import { 
  validateEmail, 
  validatePhoneNumber, 
  generateOTP, 
  sendSMSOTP, 
  sendEmailOTP, 
  storeOTP,
  checkOTPRateLimit 
} from '@zippup/lib/auth'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { email, phone, name, method = 'phone' } = body

    // Validate required fields
    if (!name || !name.trim()) {
      return NextResponse.json(
        { error: 'Name is required' },
        { status: 400 }
      )
    }

    // Validate method and corresponding field
    if (method === 'email') {
      if (!email || !validateEmail(email)) {
        return NextResponse.json(
          { error: 'Valid email is required' },
          { status: 400 }
        )
      }
    } else if (method === 'phone') {
      if (!phone || !validatePhoneNumber(phone)) {
        return NextResponse.json(
          { error: 'Valid phone number is required' },
          { status: 400 }
        )
      }
    } else {
      return NextResponse.json(
        { error: 'Method must be either "email" or "phone"' },
        { status: 400 }
      )
    }

    const identifier = method === 'email' ? email : phone

    // Check rate limiting
    if (!checkOTPRateLimit(identifier)) {
      return NextResponse.json(
        { error: 'Too many OTP requests. Please wait before requesting again.' },
        { status: 429 }
      )
    }

    // Check if user already exists
    const existingUser = await prisma.user.findFirst({
      where: {
        OR: [
          { email: email || undefined },
          { phone: phone || undefined }
        ]
      }
    })

    if (existingUser) {
      return NextResponse.json(
        { error: 'User already exists with this email or phone number' },
        { status: 409 }
      )
    }

    // Generate and send OTP
    const otp = generateOTP()
    
    let otpSent = false
    if (method === 'phone') {
      otpSent = await sendSMSOTP(phone, otp)
    } else {
      otpSent = await sendEmailOTP(email, otp)
    }

    if (!otpSent) {
      return NextResponse.json(
        { error: 'Failed to send verification code' },
        { status: 500 }
      )
    }

    // Store OTP for verification
    await storeOTP(identifier, otp, method)

    // Store user data temporarily (you might want to use Redis for this)
    // For now, we'll store it in a separate table or handle it differently
    const tempUser = await prisma.tempUser.create({
      data: {
        email: email || null,
        phone: phone || null,
        name: name.trim(),
        method,
        identifier
      }
    })

    return NextResponse.json({
      success: true,
      message: `Verification code sent to your ${method}`,
      identifier,
      method,
      tempUserId: tempUser.id
    })

  } catch (error) {
    console.error('Registration error:', error)
    return NextResponse.json(
      { error: 'Registration failed' },
      { status: 500 }
    )
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const { tempUserId, otp, password } = body

    if (!tempUserId || !otp) {
      return NextResponse.json(
        { error: 'Verification code and user ID are required' },
        { status: 400 }
      )
    }

    // Get temporary user data
    const tempUser = await prisma.tempUser.findUnique({
      where: { id: tempUserId }
    })

    if (!tempUser) {
      return NextResponse.json(
        { error: 'Invalid verification request' },
        { status: 400 }
      )
    }

    // Verify OTP
    const { verifyOTP } = await import('@zippup/lib/auth')
    const isValidOTP = await verifyOTP(tempUser.identifier, otp)

    if (!isValidOTP) {
      return NextResponse.json(
        { error: 'Invalid or expired verification code' },
        { status: 400 }
      )
    }

    // Create the actual user
    const userData = {
      email: tempUser.email,
      phone: tempUser.phone,
      name: tempUser.name,
      isVerified: true,
      role: 'CUSTOMER' as const
    }

    const user = await prisma.user.create({
      data: userData
    })

    // Create wallet for the user
    await prisma.wallet.create({
      data: {
        userId: user.id,
        balance: 0,
        currency: 'USD'
      }
    })

    // Clean up temporary user
    await prisma.tempUser.delete({
      where: { id: tempUserId }
    })

    // Create session
    const { createUserSession } = await import('@zippup/lib/auth')
    const session = await createUserSession(user)

    return NextResponse.json({
      success: true,
      message: 'Account created successfully',
      user: session.user,
      token: session.token
    })

  } catch (error) {
    console.error('Verification error:', error)
    return NextResponse.json(
      { error: 'Verification failed' },
      { status: 500 }
    )
  }
}