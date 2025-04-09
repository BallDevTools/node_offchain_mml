/**
 * JavaScript สำหรับหน้าโปรไฟล์
 */
document.addEventListener('DOMContentLoaded', function() {
    // เริ่มต้นเมื่อ Web3 พร้อมใช้งาน
    document.addEventListener('web3-initialized', initProfilePage);
    
    // ตั้งค่าคัดลอกที่อยู่กระเป๋าเงิน
    document.getElementById('copy-address')?.addEventListener('click', copyWalletAddress);
    
    // ตั้งค่าปุ่มบันทึกการตั้งค่า
    document.getElementById('save-settings')?.addEventListener('click', saveSettings);
});

/**
 * เริ่มต้นหน้าโปรไฟล์
 */
async function initProfilePage() {
    try {
        if (!window.transactionHandler || !window.transactionHandler.initialized) {
            // แสดงข้อความแจ้งเตือนให้เชื่อมต่อกระเป๋าเงิน
            document.getElementById('wallet-not-connected').classList.remove('d-none');
            document.getElementById('profile-content').classList.add('d-none');
            return;
        }
        
        // ซ่อนข้อความแจ้งเตือนให้เชื่อมต่อกระเป๋าเงิน
        document.getElementById('wallet-not-connected').classList.add('d-none');
        document.getElementById('profile-content').classList.remove('d-none');
        
        // โหลดข้อมูลโปรไฟล์
        await loadProfileData();
        
    } catch (error) {
        console.error('Error initializing profile page:', error);
        showErrorAlert('ไม่สามารถโหลดข้อมูลโปรไฟล์ได้', error.message);
    }
}

/**
 * โหลดข้อมูลโปรไฟล์
 */
async function loadProfileData() {
    try {
        // แสดงสถานะกำลังโหลด
        document.getElementById('profile-loading').classList.remove('d-none');
        document.getElementById('profile-details').classList.add('d-none');
        
        // ดึงข้อมูล
        const account = window.transactionHandler.currentAccount;
        const memberDetails = await window.transactionHandler.getMemberDetails();
        const nftDetails = await window.transactionHandler.getNFTDetails();
        
        // ซ่อนสถานะกำลังโหลด
        document.getElementById('profile-loading').classList.add('d-none');
        document.getElementById('profile-details').classList.remove('d-none');
        
        // แสดงที่อยู่กระเป๋าเงิน
        document.getElementById('wallet-address').textContent = account;
        document.getElementById('wallet-address').title = account;
        
        // ตรวจสอบว่าเป็นสมาชิกหรือไม่
        if (nftDetails) {
            // แสดงข้อมูลสมาชิก
            document.getElementById('member-status').textContent = 'เป็นสมาชิก';
            document.getElementById('member-status').classList.add('text-success');
            document.getElementById('member-status').classList.remove('text-danger');
            
            // แสดงแผนสมาชิก
            const planNames = window.contractConfig.planNames || {};
            const planName = planNames[memberDetails.planId] || `แผนที่ ${memberDetails.planId}`;
            document.getElementById('membership-plan').textContent = planName;
            
            // แสดงวันที่ลงทะเบียน
            const registeredAt = new Date(parseInt(memberDetails.registeredAt) * 1000);
            document.getElementById('register-date').textContent = registeredAt.toLocaleDateString('th-TH');
            
            // แสดงวันที่อัพเดตล่าสุด
            const updatedAt = new Date(); // สมมติกรณีนี้ไม่มีข้อมูลจริง
            document.getElementById('last-update').textContent = updatedAt.toLocaleDateString('th-TH');
            
            // แสดงจำนวนการอ้างอิงและรายได้
            document.getElementById('referral-count').textContent = memberDetails.totalReferrals || '0';
            const totalEarnings = window.transactionHandler.web3.utils.fromWei(memberDetails.totalEarnings, 'ether');
            document.getElementById('total-earnings').textContent = `${parseFloat(totalEarnings).toFixed(2)} USDT`;
            
            // แสดงสถานะ NFT
            document.getElementById('nft-section').classList.remove('d-none');
            document.getElementById('nft-id').textContent = nftDetails.tokenId;
            document.getElementById('nft-name').textContent = nftDetails.name || 'NFT สมาชิก';
            document.getElementById('nft-image').src = nftDetails.imageURI || '/img/placeholder-nft.png';
        } else {
            // แสดงสถานะไม่ได้เป็นสมาชิก
            document.getElementById('member-status').textContent = 'ไม่ได้เป็นสมาชิก';
            document.getElementById('member-status').classList.add('text-danger');
            document.getElementById('member-status').classList.remove('text-success');
            
            // ซ่อนข้อมูลอื่นๆ
            document.getElementById('membership-plan').textContent = '-';
            document.getElementById('register-date').textContent = '-';
            document.getElementById('last-update').textContent = '-';
            document.getElementById('referral-count').textContent = '0';
            document.getElementById('total-earnings').textContent = '0 USDT';
            
            // ซ่อนส่วน NFT
            document.getElementById('nft-section').classList.add('d-none');
        }
        
        // โหลดการตั้งค่าการแจ้งเตือนจาก Local Storage (สมมติว่ามีการเก็บข้อมูลนี้)
        loadNotificationSettings();
        
    } catch (error) {
        console.error('Error loading profile data:', error);
        document.getElementById('profile-loading').classList.add('d-none');
        document.getElementById('profile-error').classList.remove('d-none');
        document.getElementById('error-message').textContent = error.message;
        showErrorAlert('ไม่สามารถโหลดข้อมูลโปรไฟล์ได้', error.message);
    }
}

/**
 * โหลดการตั้งค่าการแจ้งเตือน
 */
function loadNotificationSettings() {
    try {
        // โหลดการตั้งค่าจาก Local Storage
        const settings = JSON.parse(localStorage.getItem('notification_settings')) || {};
        
        // ตั้งค่า checkbox ตามข้อมูลที่บันทึกไว้
        document.getElementById('notify-transaction').checked = settings.transaction !== false; // default: true
        document.getElementById('notify-referral').checked = settings.referral !== false; // default: true
        document.getElementById('notify-system').checked = settings.system !== false; // default: true
        document.getElementById('notify-email').checked = settings.email === true; // default: false
        
    } catch (error) {
        console.error('Error loading notification settings:', error);
        // กรณีเกิดข้อผิดพลาด ใช้ค่าเริ่มต้น
        document.getElementById('notify-transaction').checked = true;
        document.getElementById('notify-referral').checked = true;
        document.getElementById('notify-system').checked = true;
        document.getElementById('notify-email').checked = false;
    }
}

/**
 * บันทึกการตั้งค่าการแจ้งเตือน
 */
function saveSettings() {
    try {
        // อ่านค่าจาก checkbox
        const settings = {
            transaction: document.getElementById('notify-transaction').checked,
            referral: document.getElementById('notify-referral').checked,
            system: document.getElementById('notify-system').checked,
            email: document.getElementById('notify-email').checked
        };
        
        // บันทึกลง Local Storage
        localStorage.setItem('notification_settings', JSON.stringify(settings));
        
        // แสดงข้อความสำเร็จ
        window.notificationHandler.showNotification({
            title: 'สำเร็จ',
            message: 'บันทึกการตั้งค่าการแจ้งเตือนเรียบร้อยแล้ว',
            type: 'success'
        });
        
    } catch (error) {
        console.error('Error saving notification settings:', error);
        showErrorAlert('ไม่สามารถบันทึกการตั้งค่าการแจ้งเตือนได้', error.message);
    }
}

/**
 * คัดลอกที่อยู่กระเป๋าเงิน
 */
function copyWalletAddress() {
    const address = document.getElementById('wallet-address').textContent;
    
    if (navigator.clipboard) {
        navigator.clipboard.writeText(address)
            .then(() => {
                window.notificationHandler.showNotification({
                    title: 'สำเร็จ',
                    message: 'คัดลอกที่อยู่กระเป๋าเงินแล้ว',
                    type: 'success'
                });
            })
            .catch(err => {
                console.error('Error copying wallet address:', err);
                showErrorAlert('ไม่สามารถคัดลอกที่อยู่กระเป๋าเงินได้', err.message);
            });
    } else {
        // Fallback สำหรับเบราว์เซอร์ที่ไม่รองรับ navigator.clipboard
        const textArea = document.createElement('textarea');
        textArea.value = address;
        textArea.style.position = 'fixed';
        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();
        
        try {
            const successful = document.execCommand('copy');
            if (successful) {
                window.notificationHandler.showNotification({
                    title: 'สำเร็จ',
                    message: 'คัดลอกที่อยู่กระเป๋าเงินแล้ว',
                    type: 'success'
                });
            } else {
                showErrorAlert('ไม่สามารถคัดลอกที่อยู่กระเป๋าเงินได้', 'กรุณาคัดลอกด้วยตนเอง');
            }
        } catch (err) {
            console.error('Error copying wallet address:', err);
            showErrorAlert('ไม่สามารถคัดลอกที่อยู่กระเป๋าเงินได้', err.message);
        }
        
        document.body.removeChild(textArea);
    }
}

/**
 * ฟังก์ชันเชื่อมต่อกระเป๋าเงิน
 */
async function connectWallet() {
    try {
        await window.transactionHandler.init();
        initProfilePage();
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