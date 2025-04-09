const express = require('express');
const router = express.Router();
const contractConfig = require('../config/contract-config');

/**
 * Middleware to check if user is admin (contract owner)
 * This is just a placeholder - in a real app you'd verify this on-chain
 */
const isAdmin = (req, res, next) => {
  // In a real implementation, you would check if the current user's wallet
  // address matches the contract owner address
  next();
};

/**
 * Admin dashboard
 */
router.get('/dashboard', isAdmin, (req, res) => {
  res.render('admin/dashboard', {
    title: 'แดชบอร์ดผู้ดูแลระบบ',
    description: 'แดชบอร์ดสำหรับผู้ดูแลระบบ Crypto Membership NFT',
    contractConfig: {
      contractAddress: contractConfig.contractAddress,
      usdtAddress: contractConfig.usdtAddress,
      networkId: contractConfig.networkId
    }
  });
});

/**
 * Members management
 */
router.get('/members', isAdmin, (req, res) => {
  res.render('admin/members', {
    title: 'จัดการสมาชิก',
    description: 'จัดการสมาชิกทั้งหมดในระบบ',
    contractConfig: {
      contractAddress: contractConfig.contractAddress,
      networkId: contractConfig.networkId,
      planNames: contractConfig.planNames
    }
  });
});

/**
 * Plans management
 */
router.get('/plans', isAdmin, (req, res) => {
  res.render('admin/plans', {
    title: 'จัดการแผนสมาชิก',
    description: 'จัดการแผนสมาชิกทั้งหมดในระบบ',
    contractConfig: {
      contractAddress: contractConfig.contractAddress,
      networkId: contractConfig.networkId,
      planNames: contractConfig.planNames
    }
  });
});

/**
 * Transactions management
 */
router.get('/transactions', isAdmin, (req, res) => {
  res.render('admin/transactions', {
    title: 'ประวัติธุรกรรม',
    description: 'ดูประวัติธุรกรรมทั้งหมดในระบบ',
    contractConfig: {
      contractAddress: contractConfig.contractAddress,
      networkId: contractConfig.networkId
    }
  });
});

/**
 * System settings
 */
router.get('/settings', isAdmin, (req, res) => {
  res.render('admin/settings', {
    title: 'ตั้งค่าระบบ',
    description: 'ปรับแต่งการตั้งค่าระบบ',
    contractConfig: {
      contractAddress: contractConfig.contractAddress,
      usdtAddress: contractConfig.usdtAddress,
      networkId: contractConfig.networkId
    }
  });
});

/**
 * NFT management
 */
router.get('/nfts', isAdmin, (req, res) => {
  res.render('admin/nfts', {
    title: 'จัดการ NFTs',
    description: 'จัดการ NFTs ทั้งหมดในระบบ',
    contractConfig: {
      contractAddress: contractConfig.contractAddress,
      networkId: contractConfig.networkId,
      planNames: contractConfig.planNames
    }
  });
});

/**
 * Withdraw funds
 */
router.get('/withdraw', isAdmin, (req, res) => {
  res.render('admin/withdraw', {
    title: 'ถอนเงิน',
    description: 'ถอนเงินจากสัญญา',
    contractConfig: {
      contractAddress: contractConfig.contractAddress,
      usdtAddress: contractConfig.usdtAddress,
      networkId: contractConfig.networkId
    }
  });
});

/**
 * System statistics
 */
router.get('/stats', isAdmin, (req, res) => {
  res.render('admin/stats', {
    title: 'สถิติระบบ',
    description: 'ดูสถิติและการวิเคราะห์ระบบ',
    contractConfig: {
      contractAddress: contractConfig.contractAddress,
      networkId: contractConfig.networkId
    }
  });
});

module.exports = router;