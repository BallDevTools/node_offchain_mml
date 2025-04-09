const express = require('express');
const router = express.Router();
const contractConfig = require('../config/contract-config');

/**
 * User dashboard
 */
router.get('/dashboard', (req, res) => {
  res.render('user/dashboard', {
    title: 'แดชบอร์ดสมาชิก',
    description: 'แดชบอร์ดสำหรับสมาชิก Crypto Membership NFT',
    contractConfig: {
      contractAddress: contractConfig.contractAddress,
      usdtAddress: contractConfig.usdtAddress,
      networkId: contractConfig.networkId,
      planNames: contractConfig.planNames
    }
  });
});

/**
 * Registration page
 */
router.get('/register', (req, res) => {
  // Get the upline from query params if provided
  const upline = req.query.upline || '';
  
  res.render('user/register', {
    title: 'ลงทะเบียนสมาชิก',
    description: 'ลงทะเบียนเป็นสมาชิก Crypto Membership NFT',
    upline,
    contractConfig: {
      contractAddress: contractConfig.contractAddress,
      usdtAddress: contractConfig.usdtAddress,
      networkId: contractConfig.networkId,
      planNames: contractConfig.planNames
    }
  });
});

/**
 * Upgrade membership page
 */
router.get('/upgrade', (req, res) => {
  res.render('user/upgrade', {
    title: 'อัพเกรดแผนสมาชิก',
    description: 'อัพเกรดแผนสมาชิก Crypto Membership NFT ของคุณ',
    contractConfig: {
      contractAddress: contractConfig.contractAddress,
      usdtAddress: contractConfig.usdtAddress,
      networkId: contractConfig.networkId,
      planNames: contractConfig.planNames
    }
  });
});

/**
 * My NFT page
 */
router.get('/my-nft', (req, res) => {
  res.render('user/my-nft', {
    title: 'NFT ของฉัน',
    description: 'จัดการ NFT สมาชิกของคุณ',
    contractConfig: {
      contractAddress: contractConfig.contractAddress,
      networkId: contractConfig.networkId,
      planNames: contractConfig.planNames
    }
  });
});

/**
 * Transactions page
 */
router.get('/transactions', (req, res) => {
  res.render('user/transactions', {
    title: 'ประวัติธุรกรรม',
    description: 'ดูประวัติธุรกรรมของคุณ',
    contractConfig: {
      contractAddress: contractConfig.contractAddress,
      networkId: contractConfig.networkId
    }
  });
});

/**
 * Referrals page
 */
router.get('/referrals', (req, res) => {
  res.render('user/referrals', {
    title: 'การอ้างอิงของฉัน',
    description: 'จัดการการอ้างอิงและรับรายได้',
    contractConfig: {
      contractAddress: contractConfig.contractAddress,
      networkId: contractConfig.networkId
    }
  });
});

/**
 * Profile page
 */
router.get('/profile', (req, res) => {
  res.render('user/profile', {
    title: 'โปรไฟล์ของฉัน',
    description: 'จัดการโปรไฟล์ของคุณ'
  });
});

/**
 * Exit membership page
 */
router.get('/exit', (req, res) => {
  res.render('user/exit', {
    title: 'ยกเลิกสมาชิก',
    description: 'ยกเลิกสมาชิก Crypto Membership NFT ของคุณ',
    contractConfig: {
      contractAddress: contractConfig.contractAddress,
      networkId: contractConfig.networkId
    }
  });
});

module.exports = router;