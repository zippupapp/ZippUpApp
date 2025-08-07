import jwt from 'jsonwebtoken'
import bcrypt from 'bcryptjs'
import crypto from 'crypto'
import { prisma } from '../prisma/client.js'

const JWT_SECRET = process.env.JWT_SECRET || 'fallback-secret-change-in-production'
const JWT_EXPIRES_IN = '7d'

// Generate JWT token
export function generateToken(payload) {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN })
}

// Verify JWT token
export function verifyToken(token) {
  try {
    return jwt.verify(token, JWT_SECRET)
  } catch (error) {
    throw new Error('Invalid token')
  }
}

// Hash password
export async function hashPassword(password) {
  return bcrypt.hash(password, 12)
}

// Compare password
export async function comparePassword(password, hashedPassword) {
  return bcrypt.compare(password, hashedPassword)
}

// Generate OTP
export function generateOTP() {
  return crypto.randomInt(100000, 999999).toString()
}

// Generate secure random token
export function generateSecureToken() {
  return crypto.randomBytes(32).toString('hex')
}

// Create user session
export async function createUserSession(user) {
  const payload = {
    userId: user.id,
    email: user.email,
    phone: user.phone,
    role: user.role,
    isVerified: user.isVerified
  }
  
  return {
    user: payload,
    token: generateToken(payload)
  }
}

// Validate phone number format
export function validatePhoneNumber(phone) {
  // Basic phone validation - can be enhanced
  const phoneRegex = /^\+?[1-9]\d{1,14}$/
  return phoneRegex.test(phone.replace(/[\s\-\(\)]/g, ''))
}

// Validate email format
export function validateEmail(email) {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email)
}

// Send OTP via SMS
export async function sendSMSOTP(phone, otp) {
  try {
    if (!process.env.TWILIO_ACCOUNT_SID || !process.env.TWILIO_AUTH_TOKEN) {
      console.log(`OTP for ${phone}: ${otp}`) // For development
      return true
    }

    const twilio = require('twilio')(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN)
    
    await twilio.messages.create({
      body: `Your ZippUp verification code is: ${otp}. Valid for 5 minutes.`,
      from: process.env.TWILIO_PHONE_NUMBER,
      to: phone
    })
    
    return true
  } catch (error) {
    console.error('Failed to send SMS OTP:', error)
    return false
  }
}

// Send OTP via Email
export async function sendEmailOTP(email, otp) {
  try {
    // Implement with your email service (Nodemailer, SendGrid, etc.)
    console.log(`OTP for ${email}: ${otp}`) // For development
    return true
  } catch (error) {
    console.error('Failed to send email OTP:', error)
    return false
  }
}

// Store OTP verification record
export async function storeOTP(identifier, otp, type = 'phone') {
  const expiresAt = new Date(Date.now() + 5 * 60 * 1000) // 5 minutes
  
  // Delete any existing OTP for this identifier
  await prisma.otpVerification.deleteMany({
    where: { identifier }
  })
  
  // Create new OTP record
  return prisma.otpVerification.create({
    data: {
      identifier,
      otp: await hashPassword(otp), // Hash the OTP for security
      type,
      expiresAt
    }
  })
}

// Verify OTP
export async function verifyOTP(identifier, otp) {
  const otpRecord = await prisma.otpVerification.findFirst({
    where: {
      identifier,
      expiresAt: { gt: new Date() }
    }
  })
  
  if (!otpRecord) {
    return false
  }
  
  const isValid = await comparePassword(otp, otpRecord.otp)
  
  if (isValid) {
    // Delete the OTP record after successful verification
    await prisma.otpVerification.delete({
      where: { id: otpRecord.id }
    })
  }
  
  return isValid
}

// Middleware to extract user from token
export function authenticateToken(req, res, next) {
  const authHeader = req.headers.authorization
  const token = authHeader && authHeader.split(' ')[1] // Bearer TOKEN
  
  if (!token) {
    return res.status(401).json({ error: 'Access token required' })
  }
  
  try {
    const user = verifyToken(token)
    req.user = user
    next()
  } catch (error) {
    return res.status(403).json({ error: 'Invalid or expired token' })
  }
}

// Check if user has required role
export function requireRole(roles) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' })
    }
    
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ error: 'Insufficient permissions' })
    }
    
    next()
  }
}

// Rate limiting for OTP requests
const otpRequestLimits = new Map()

export function checkOTPRateLimit(identifier) {
  const now = Date.now()
  const key = identifier
  
  if (!otpRequestLimits.has(key)) {
    otpRequestLimits.set(key, { count: 1, resetTime: now + 60000 }) // 1 minute
    return true
  }
  
  const limit = otpRequestLimits.get(key)
  
  if (now > limit.resetTime) {
    otpRequestLimits.set(key, { count: 1, resetTime: now + 60000 })
    return true
  }
  
  if (limit.count >= 3) { // Max 3 OTP requests per minute
    return false
  }
  
  limit.count++
  return true
}