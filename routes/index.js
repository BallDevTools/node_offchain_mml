const express = require('express');
const router = express.Router();
const contractConfig = require('../config/contract-config');

/**
 * Home page
 */
router.get('/', (req, res) => {
  res.render('index', {
    title: 'Crypto Membership NFT',
    description: 'สัญญาสมาชิก NFT พร้อมระบบอ้างอิงและการจัดการแผนสมาชิก',
    contractConfig: {
      contractAddress: contractConfig.contractAddress,
      contractABI: JSON.stringify(contractConfig.contractABI),
      usdtAddress: contractConfig.usdtAddress,
      networkId: contractConfig.networkId
    }
  });
});

/**
 * About page
 */
router.get('/about', (req, res) => {
  res.render('about', {
    title: 'เกี่ยวกับ Crypto Membership NFT',
    description: 'เรียนรู้เพิ่มเติมเกี่ยวกับ Crypto Membership NFT และประโยชน์ของมัน'
  });
});

/**
 * Contact page
 */
router.get('/contact', (req, res) => {
  res.render('contact', {
    title: 'ติดต่อเรา',
    description: 'มีคำถามหรือข้อสงสัย? ติดต่อเราได้ที่นี่'
  });
});

/**
 * Terms of service
 */
router.get('/terms', (req, res) => {
  res.render('terms', {
    title: 'ข้อตกลงการใช้บริการ',
    description: 'ข้อตกลงการใช้บริการสำหรับ Crypto Membership NFT'
  });
});

/**
 * Privacy policy
 */
router.get('/privacy', (req, res) => {
  res.render('privacy', {
    title: 'นโยบายความเป็นส่วนตัว',
    description: 'นโยบายความเป็นส่วนตัวสำหรับ Crypto Membership NFT'
  });
});

/**
 * FAQs
 */
router.get('/faq', (req, res) => {
  res.render('faq', {
    title: 'คำถามที่พบบ่อย',
    description: 'คำถามและคำตอบที่พบบ่อยเกี่ยวกับ Crypto Membership NFT'
  });
});

/**
 * 404 page
 */
router.get('/404', (req, res) => {
  res.status(404).render('404', {
    title: 'ไม่พบหน้าที่คุณต้องการ',
    description: 'ไม่พบหน้าที่คุณต้องการ กรุณาตรวจสอบ URL อีกครั้ง'
  });
});

/**
 * 500 error page
 */
router.get('/error', (req, res) => {
  res.status(500).render('error', {
    title: 'เกิดข้อผิดพลาด',
    description: 'เกิดข้อผิดพลาดบางอย่าง กรุณาลองใหม่อีกครั้ง'
  });
});

module.exports = router;