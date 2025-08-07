const { Server } = require('socket.io');
const jwt = require('jsonwebtoken');

let io;
const connectedUsers = new Map(); // userId -> socketId
const activeRooms = new Map(); // roomId -> Set of socketIds

/**
 * Initialize Socket.IO server
 */
function initSocket(server) {
  io = new Server(server, {
    cors: {
      origin: process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000",
      methods: ["GET", "POST"]
    }
  });

  // Authentication middleware
  io.use((socket, next) => {
    try {
      const token = socket.handshake.auth.token;
      if (!token) {
        return next(new Error('No token provided'));
      }

      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      socket.userId = decoded.userId;
      socket.userRole = decoded.role;
      next();
    } catch (error) {
      next(new Error('Invalid token'));
    }
  });

  io.on('connection', (socket) => {
    console.log(`User ${socket.userId} connected`);
    
    // Store connection
    connectedUsers.set(socket.userId, socket.id);

    // Join user-specific room
    socket.join(`user:${socket.userId}`);
    
    // Join role-specific room
    socket.join(`role:${socket.userRole}`);

    // Handle location updates
    socket.on('location:update', (data) => {
      handleLocationUpdate(socket, data);
    });

    // Handle chat messages
    socket.on('chat:message', (data) => {
      handleChatMessage(socket, data);
    });

    // Handle booking events
    socket.on('booking:join', (bookingId) => {
      socket.join(`booking:${bookingId}`);
    });

    socket.on('booking:leave', (bookingId) => {
      socket.leave(`booking:${bookingId}`);
    });

    // Handle provider job responses
    socket.on('job:accept', (data) => {
      handleJobAccept(socket, data);
    });

    socket.on('job:decline', (data) => {
      handleJobDecline(socket, data);
    });

    // Handle emergency alerts
    socket.on('emergency:track', (alertId) => {
      socket.join(`emergency:${alertId}`);
    });

    // Handle admin room
    if (socket.userRole === 'ADMIN') {
      socket.join('admin');
    }

    // Handle disconnect
    socket.on('disconnect', () => {
      console.log(`User ${socket.userId} disconnected`);
      connectedUsers.delete(socket.userId);
    });
  });

  return io;
}

/**
 * Handle real-time location updates
 */
function handleLocationUpdate(socket, data) {
  const { bookingId, latitude, longitude, type } = data;
  
  if (!bookingId || !latitude || !longitude) {
    socket.emit('error', { message: 'Invalid location data' });
    return;
  }

  // Broadcast to booking room
  socket.to(`booking:${bookingId}`).emit('location:updated', {
    userId: socket.userId,
    latitude,
    longitude,
    type, // 'customer' or 'provider'
    timestamp: new Date().toISOString()
  });

  // Store in database (implement as needed)
  // updateBookingLocation(bookingId, socket.userId, latitude, longitude);
}

/**
 * Handle chat messages
 */
function handleChatMessage(socket, data) {
  const { bookingId, message, type = 'text' } = data;
  
  if (!bookingId || !message) {
    socket.emit('error', { message: 'Invalid message data' });
    return;
  }

  const messageData = {
    id: generateMessageId(),
    senderId: socket.userId,
    bookingId,
    message,
    type,
    timestamp: new Date().toISOString()
  };

  // Broadcast to booking room
  io.to(`booking:${bookingId}`).emit('chat:message', messageData);

  // Store message in database (implement as needed)
  // saveChatMessage(messageData);
}

/**
 * Handle job acceptance
 */
function handleJobAccept(socket, data) {
  const { bookingId } = data;
  
  // Notify customer
  socket.to(`booking:${bookingId}`).emit('job:accepted', {
    providerId: socket.userId,
    bookingId,
    timestamp: new Date().toISOString()
  });

  // Notify other providers to cancel
  socket.to(`role:PROVIDER`).emit('job:cancelled', {
    bookingId,
    reason: 'accepted_by_other'
  });
}

/**
 * Handle job decline
 */
function handleJobDecline(socket, data) {
  const { bookingId, reason } = data;
  
  // Notify customer (optional)
  socket.to(`booking:${bookingId}`).emit('job:declined', {
    providerId: socket.userId,
    bookingId,
    reason,
    timestamp: new Date().toISOString()
  });
}

/**
 * Notify nearby providers about urgent jobs
 */
function notifyNearbyProviders(providers, bookingData) {
  if (!io) return;

  providers.forEach(provider => {
    const socketId = connectedUsers.get(provider.userId);
    if (socketId) {
      io.to(socketId).emit('job:urgent', {
        bookingId: bookingData.id,
        service: bookingData.service,
        location: bookingData.location,
        customer: bookingData.customer,
        urgency: bookingData.urgency,
        estimatedPrice: bookingData.estimatedPrice,
        expiresAt: new Date(Date.now() + 2 * 60 * 1000).toISOString() // 2 minutes
      });
    }
  });
}

/**
 * Send emergency alert to admin and contacts
 */
function sendEmergencyAlert(alertData) {
  if (!io) return;

  // Notify admin
  io.to('admin').emit('emergency:alert', {
    id: alertData.id,
    userId: alertData.userId,
    location: alertData.location,
    status: alertData.status,
    timestamp: alertData.createdAt
  });

  // Notify user's contacts (if they have the app)
  if (alertData.emergencyContacts) {
    alertData.emergencyContacts.forEach(contact => {
      const socketId = connectedUsers.get(contact.userId);
      if (socketId) {
        io.to(socketId).emit('emergency:contact_alert', {
          alertId: alertData.id,
          from: alertData.user.name,
          location: alertData.location,
          message: `${alertData.user.name} has triggered an emergency alert`
        });
      }
    });
  }
}

/**
 * Send real-time location updates for emergency tracking
 */
function sendEmergencyLocationUpdate(alertId, locationData) {
  if (!io) return;

  io.to(`emergency:${alertId}`).emit('emergency:location_update', {
    alertId,
    latitude: locationData.latitude,
    longitude: locationData.longitude,
    timestamp: locationData.timestamp,
    accuracy: locationData.accuracy
  });
}

/**
 * Send booking status updates
 */
function sendBookingUpdate(bookingId, status, data = {}) {
  if (!io) return;

  io.to(`booking:${bookingId}`).emit('booking:status_update', {
    bookingId,
    status,
    ...data,
    timestamp: new Date().toISOString()
  });
}

/**
 * Send wallet balance updates
 */
function sendWalletUpdate(userId, walletData) {
  if (!io) return;

  const socketId = connectedUsers.get(userId);
  if (socketId) {
    io.to(socketId).emit('wallet:balance_update', {
      balance: walletData.balance,
      lastTransaction: walletData.lastTransaction,
      timestamp: new Date().toISOString()
    });
  }
}

/**
 * Send notifications to user
 */
function sendNotification(userId, notification) {
  if (!io) return;

  const socketId = connectedUsers.get(userId);
  if (socketId) {
    io.to(socketId).emit('notification', {
      id: notification.id,
      title: notification.title,
      message: notification.message,
      type: notification.type,
      data: notification.data,
      timestamp: new Date().toISOString()
    });
  }
}

/**
 * Helper functions
 */
function generateMessageId() {
  return `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

function calculateDistance(lat1, lon1, lat2, lon2) {
  const R = 6371; // Earth's radius in kilometers
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
    Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
}

function findNearbyProviders(location, serviceType, radius = 10) {
  // Mock implementation - in production, query your database
  return [
    {
      userId: 'provider1',
      name: 'John Provider',
      distance: 2.5,
      rating: 4.8
    },
    {
      userId: 'provider2',
      name: 'Jane Provider', 
      distance: 4.1,
      rating: 4.6
    }
  ];
}

module.exports = {
  initSocket,
  notifyNearbyProviders,
  sendEmergencyAlert,
  sendEmergencyLocationUpdate,
  sendBookingUpdate,
  sendWalletUpdate,
  sendNotification,
  calculateDistance,
  findNearbyProviders
};