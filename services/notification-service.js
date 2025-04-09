/**
 * Service for handling real-time notifications and transaction status updates
 */
class NotificationService {
    constructor() {
      this.io = null;
      this.initialized = false;
      this.pendingTransactions = new Map();
    }
  
    /**
     * Initialize the notification service with Socket.io
     * @param {Object} io - Socket.io instance
     */
    init(io) {
      if (this.initialized) return;
      
      this.io = io;
      this.initialized = true;
      console.log('Notification service initialized');
  
      // Set up event listeners for tracking transaction statuses
      this._setupTransactionTracking();
    }
  
    /**
     * Set up event listeners for tracking transactions
     */
    _setupTransactionTracking() {
      // This could be expanded with listeners for blockchain events
      // or other transaction monitoring tools
    }
  
    /**
     * Send a transaction update to a specific user
     * @param {Object} update - The update object with transaction details
     * @param {string} userAddress - The Ethereum address of the user
     */
    sendTransactionUpdate(update, userAddress) {
      if (!this.initialized) {
        console.error('Notification service not initialized');
        return;
      }
  
      // Track pending transactions
      if (update.type === 'prepare') {
        this.pendingTransactions.set(userAddress + '_' + update.txType, {
          status: 'pending',
          timestamp: Date.now()
        });
      } else if (update.type === 'complete' || update.type === 'error') {
        this.pendingTransactions.delete(userAddress + '_' + update.txType);
      }
  
      // Send the update to the specific user's room
      const room = `user:${userAddress}`;
      this.io.to(room).emit('transaction-update', {
        ...update,
        timestamp: Date.now()
      });
  
      // Also send the update to admin room for monitoring
      this.io.to('admin').emit('transaction-update', {
        ...update,
        userAddress,
        timestamp: Date.now()
      });
  
      console.log(`Sent ${update.type} notification to ${userAddress} for ${update.txType}`);
    }
  
    /**
     * Send a general notification to a specific user
     * @param {Object} notification - The notification object
     * @param {string} userAddress - The Ethereum address of the user
     */
    sendUserNotification(notification, userAddress) {
      if (!this.initialized) {
        console.error('Notification service not initialized');
        return;
      }
  
      const room = `user:${userAddress}`;
      this.io.to(room).emit('notification', {
        ...notification,
        timestamp: Date.now()
      });
  
      console.log(`Sent notification to ${userAddress}: ${notification.message}`);
    }
  
    /**
     * Send a notification to all connected users
     * @param {Object} notification - The notification object
     */
    broadcastNotification(notification) {
      if (!this.initialized) {
        console.error('Notification service not initialized');
        return;
      }
  
      this.io.emit('notification', {
        ...notification,
        timestamp: Date.now()
      });
  
      console.log(`Broadcast notification: ${notification.message}`);
    }
  
    /**
     * Send a notification to admin users
     * @param {Object} notification - The notification object
     */
    sendAdminNotification(notification) {
      if (!this.initialized) {
        console.error('Notification service not initialized');
        return;
      }
  
      this.io.to('admin').emit('admin-notification', {
        ...notification,
        timestamp: Date.now()
      });
  
      console.log(`Sent admin notification: ${notification.message}`);
    }
  
    /**
     * Get all pending transactions for a user
     * @param {string} userAddress - The Ethereum address of the user
     * @returns {Array} Array of pending transactions
     */
    getPendingTransactions(userAddress) {
      const pending = [];
      
      for (const [key, value] of this.pendingTransactions.entries()) {
        if (key.startsWith(userAddress + '_')) {
          const txType = key.split('_')[1];
          pending.push({
            txType,
            ...value
          });
        }
      }
      
      return pending;
    }
  }
  
  // Create singleton instance
  const notificationService = new NotificationService();
  
  module.exports = notificationService;