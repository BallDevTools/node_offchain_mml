 /**
 * JavaScript สำหรับหน้าการอ้างอิง
 */
document.addEventListener('DOMContentLoaded', function() {
    // เริ่มต้นเมื่อ Web3 พร้อมใช้งาน
    document.addEventListener('web3-initialized', initReferralsPage);
    
    // ตั้งค่าปุ่มคัดลอกลิงก์
    document.getElementById('copy-referral-link')?.addEventListener('click', copyReferralLink);
    
    // ตั้งค่าปุ่มแชร์
    document.getElementById('share-btn')?.addEventListener('click', shareReferralLink);
    
    // ตั้งค่าปุ่มแชร์โซเชียลมีเดีย
    document.getElementById('share-twitter')?.addEventListener('click', shareOnTwitter);
    document.getElementById('share-facebook')?.addEventListener('click', shareOnFacebook);
    document.getElementById('share-telegram')?.addEventListener('click', shareOnTelegram);
    document.getElementById('share-line')?.addEventListener('click', shareOnLine);
});

/**
 * เริ่มต้นหน้าการอ้างอิง
 */
async function initReferralsPage() {
    try {
        if (!window.transactionHandler || !window.transactionHandler.initialized) {
            // แสดงข้อความแจ้งเตือนให้เชื่อมต่อกระเป๋าเงิน
            document.getElementById('wallet-not-connected').classList.remove('d-none');
            document.getElementById('referrals-content').classList.add('d-none');
            return;
        }
        
        // ซ่อนข้อความแจ้งเตือนให้เชื่อมต่อกระเป๋าเงิน
        document.getElementById('wallet-not-connected').classList.add('d-none');
        document.getElementById('referrals-content').classList.remove('d-none');
        
        // โหลดข้อมูล
        await Promise.all([
            loadMemberDetails(),
            loadReferralEarnings(),
            setupReferralLink()
        ]);
        
    } catch (error) {
        console.error('Error initializing referrals page:', error);
        showErrorAlert('ไม่สามารถโหลดข้อมูลการอ้างอิงได้', error.message);
    }
}

/**
 * โหลดข้อมูลสมาชิก
 */
async function loadMemberDetails() {
    try {
        const memberDetails = await window.transactionHandler.getMemberDetails();
        
        // แสดงจำนวนการอ้างอิงทั้งหมด
        document.getElementById('total-referrals').textContent = memberDetails.totalReferrals || '0';
        
        // แสดงแผนสมาชิกปัจจุบัน
        const planNames = window.contractConfig.planNames || {};
        const planName = planNames[memberDetails.planId] || `แผนที่ ${memberDetails.planId}`;
        document.getElementById('current-plan').textContent = planName;
        
        // แสดงอัตราค่าคอมมิชชั่น (ตัวอย่าง: 60% สำหรับทุกแผน)
        document.getElementById('commission-rate').textContent = '60%';
        
    } catch (error) {
        console.error('Error loading member details:', error);
        document.getElementById('total-referrals').textContent = '0';
        document.getElementById('current-plan').textContent = 'ไม่พบข้อมูล';
        document.getElementById('commission-rate').textContent = '0%';
    }
}

/**
 * โหลดข้อมูลรายได้จากการอ้างอิง
 */
async function loadReferralEarnings() {
    try {
        // แสดงสถานะกำลังโหลด
        document.getElementById('earnings-loading').classList.remove('d-none');
        document.getElementById('earnings-content').classList.add('d-none');
        
        const memberDetails = await window.transactionHandler.getMemberDetails();
        const transactions = await window.transactionHandler.getMemberTransactions();
        
        // ซ่อนสถานะกำลังโหลด
        document.getElementById('earnings-loading').classList.add('d-none');
        document.getElementById('earnings-content').classList.remove('d-none');
        
        // แสดงรายได้ทั้งหมด
        const totalEarnings = window.transactionHandler.web3.utils.fromWei(memberDetails.totalEarnings, 'ether');
        document.getElementById('total-earnings').textContent = `${parseFloat(totalEarnings).toFixed(2)} USDT`;
        
        // กรองเฉพาะธุรกรรมประเภทค่าแนะนำ
        const referralTransactions = transactions.filter(tx => tx.txType === 'referral');
        
        if (referralTransactions.length > 0) {
            // เติมข้อมูลในตารางรายได้
            populateEarningsTable(referralTransactions);
            document.getElementById('no-earnings').classList.add('d-none');
            document.getElementById('earnings-table').classList.remove('d-none');
        } else {
            // ไม่มีข้อมูลรายได้
            document.getElementById('no-earnings').classList.remove('d-none');
            document.getElementById('earnings-table').classList.add('d-none');
        }
        
    } catch (error) {
        console.error('Error loading referral earnings:', error);
        document.getElementById('earnings-loading').classList.add('d-none');
        document.getElementById('no-earnings').classList.remove('d-none');
        document.getElementById('earnings-table').classList.add('d-none');
        document.getElementById('total-earnings').textContent = '0 USDT';
    }
}

/**
 * เติมข้อมูลในตารางรายได้
 */
function populateEarningsTable(transactions) {
    const tbody = document.getElementById('earnings-tbody');
    tbody.innerHTML = '';
    
    // เรียงลำดับตามเวลาล่าสุด
    transactions.sort((a, b) => parseInt(b.timestamp) - parseInt(a.timestamp));
    
    transactions.forEach((tx, index) => {
        const date = new Date(parseInt(tx.timestamp) * 1000);
        const formattedDate = date.toLocaleDateString('th-TH') + ' ' + date.toLocaleTimeString('th-TH');
        
        const amount = window.transactionHandler.web3.utils.fromWei(tx.amount, 'ether');
        
        // สร้าง row ใหม่
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${index + 1}</td>
            <td>${formattedDate}</td>
            <td title="${tx.from}">${formatAddress(tx.from)}</td>
            <td class="text-end">${parseFloat(amount).toFixed(2)} USDT</td>
        `;
        
        tbody.appendChild(row);
    });
}

/**
 * ตั้งค่าลิงก์การอ้างอิง
 */
function setupReferralLink() {
    if (!window.transactionHandler || !window.transactionHandler.currentAccount) {
        return;
    }
    
    const account = window.transactionHandler.currentAccount;
    const referralLink = `${window.location.origin}/user/register?upline=${account}`;
    document.getElementById('referral-link').value = referralLink;
}

/**
 * คัดลอกลิงก์การอ้างอิง
 */
function copyReferralLink() {
    const referralLinkInput = document.getElementById('referral-link');
    referralLinkInput.select();
    referralLinkInput.setSelectionRange(0, 99999);
    document.execCommand('copy');
    
    // แสดงการแจ้งเตือนสำเร็จ
    window.notificationHandler.showNotification({
        title: 'สำเร็จ',
        message: 'คัดลอกลิงก์การอ้างอิงแล้ว',
        type: 'success'
    });
}

/**
 * แชร์ลิงก์การอ้างอิง
 */
function shareReferralLink() {
    if (navigator.share) {
        const referralLink = document.getElementById('referral-link').value;
        
        navigator.share({
            title: 'ร่วมเป็นสมาชิก Crypto Membership NFT',
            text: 'สมัครเป็นสมาชิก Crypto Membership NFT และรับ NFT สมาชิกของคุณทันที',
            url: referralLink
        })
        .then(() => {
            console.log('Successfully shared');
        })
        .catch((error) => {
            console.error('Error sharing:', error);
        });
    } else {
        copyReferralLink();
    }
}

/**
 * แชร์บน Twitter
 */
function shareOnTwitter() {
    const referralLink = document.getElementById('referral-link').value;
    const text = encodeURIComponent('ร่วมเป็นสมาชิก Crypto Membership NFT และรับ NFT สมาชิกของคุณทันที! 🚀 #CryptoMembership #NFT');
    const url = encodeURIComponent(referralLink);
    
    window.open(`https://twitter.com/intent/tweet?text=${text}&url=${url}`, '_blank');
}

/**
 * แชร์บน Facebook
 */
function shareOnFacebook() {
    const referralLink = document.getElementById('referral-link').value;
    const url = encodeURIComponent(referralLink);
    
    window.open(`https://www.facebook.com/sharer/sharer.php?u=${url}`, '_blank');
}

/**
 * แชร์บน Telegram
 */
function shareOnTelegram() {
    const referralLink = document.getElementById('referral-link').value;
    const text = encodeURIComponent('ร่วมเป็นสมาชิก Crypto Membership NFT และรับ NFT สมาชิกของคุณทันที! 🚀');
    const url = encodeURIComponent(referralLink);
    
    window.open(`https://t.me/share/url?url=${url}&text=${text}`, '_blank');
}

/**
 * แชร์บน Line
 */
function shareOnLine() {
    const referralLink = document.getElementById('referral-link').value;
    const url = encodeURIComponent(referralLink);
    
    window.open(`https://social-plugins.line.me/lineit/share?url=${url}`, '_blank');
}

/**
 * จัดรูปแบบที่อยู่ Ethereum ให้สั้นลง
 */
function formatAddress(address) {
    if (!address) return '-';
    return address.substring(0, 6) + '...' + address.substring(address.length - 4);
}

/**
 * ฟังก์ชันเชื่อมต่อกระเป๋าเงิน
 */
async function connectWallet() {
    try {
        await window.transactionHandler.init();
        initReferralsPage();
    } catch (error) {
        console.error('Error connecting wallet:', error);
        showErrorAlert('ไม่สามารถเชื่อมต่อกระเป๋าเงินได้', error.message);
    }
}

/**
 * แสดงการแจ้งเตือนข้อผิดพลาด
 */
function showErrorAlert(title, message) {
    window.notificationHandler.showNotification({
        title: title || 'เกิดข้อผิดพลาด',
        message: message || 'เกิดข้อผิดพลาดที่ไม่ทราบสาเหตุ',
        type: 'danger'
    });
}