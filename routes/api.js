const express = require('express');
const router = express.Router();
const contractConfig = require('../config/contract-config');
const notificationService = require('../services/notification-service');

/**
 * Get smart contract config info
 */
router.get('/contract-config', (req, res) => {
  // Only send what's needed for the client
  res.json({
    contractAddress: contractConfig.contractAddress,
    usdtAddress: contractConfig.usdtAddress,
    networkId: contractConfig.networkId,
    contractABI: contractConfig.contractABI,
    usdtABI: contractConfig.usdtABI,
    planNames: contractConfig.planNames
  });
});

/**
 * Send notification to a specific user
 * This would typically be triggered by webhook or other backend processes
 */
router.post('/notify/user/:address', (req, res) => {
  const { address } = req.params;
  const { title, message, type } = req.body;
  
  if (!address || !message) {
    return res.status(400).json({
      success: false,
      error: 'Address and message are required'
    });
  }
  
  notificationService.sendUserNotification({
    title: title || 'การแจ้งเตือน',
    message,
    type: type || 'info'
  }, address);
  
  res.json({
    success: true,
    message: `Notification sent to ${address}`
  });
});

/**
 * Send notification to all users
 * This would typically be triggered by webhook or other backend processes
 */
router.post('/notify/all', (req, res) => {
  const { title, message, type } = req.body;
  
  if (!message) {
    return res.status(400).json({
      success: false,
      error: 'Message is required'
    });
  }
  
  notificationService.broadcastNotification({
    title: title || 'การแจ้งเตือน',
    message,
    type: type || 'info'
  });
  
  res.json({
    success: true,
    message: 'Notification broadcast to all users'
  });
});

/**
 * Send transaction update to a specific user
 * This would typically be triggered by webhook or other backend processes
 */
router.post('/tx-update/:address', (req, res) => {
  const { address } = req.params;
  const { txType, txHash, status, message } = req.body;
  
  if (!address || !txType || !status) {
    return res.status(400).json({
      success: false,
      error: 'Address, txType, and status are required'
    });
  }
  
  let type = 'prepare';
  if (status === 'success') {
    type = 'complete';
  } else if (status === 'failed') {
    type = 'error';
  }
  
  notificationService.sendTransactionUpdate({
    type,
    txType,
    txHash,
    status,
    message: message || `Transaction ${status}`
  }, address);
  
  res.json({
    success: true,
    message: `Transaction update sent to ${address}`
  });
});

/**
 * Get pending transactions for a user
 */
router.get('/pending-tx/:address', (req, res) => {
  const { address } = req.params;
  
  const pendingTransactions = notificationService.getPendingTransactions(address);
  
  res.json({
    success: true,
    pendingTransactions
  });
});

/**
 * Upload image for NFT (placeholder)
 * In a real implementation, this would upload to IPFS or another storage solution
 */
router.post('/upload-image', (req, res) => {
  // Placeholder response - in a real app you'd process the upload
  res.json({
    success: true,
    imageUrl: `https://placeholder.com/nft-${Date.now()}.jpg`
  });
});

/**
 * Health check
 */
router.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: Date.now()
  });
});

module.exports = router;