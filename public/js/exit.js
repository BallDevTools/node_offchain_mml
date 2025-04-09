/**
 * JavaScript สำหรับหน้ายกเลิกสมาชิก
 */
document.addEventListener('DOMContentLoaded', function() {
    // เริ่มต้นเมื่อ Web3 พร้อมใช้งาน
    document.addEventListener('web3-initialized', initExitPage);
    
    // ตั้งค่าปุ่มยกเลิกสมาชิก
    document.getElementById('exit-button')?.addEventListener('click', showExitConfirmation);
    document.getElementById('confirm-exit-button')?.addEventListener('click', exitMembership);
});

/**
 * เริ่มต้นหน้ายกเลิกสมาชิก
 */
async function initExitPage() {
    try {
        if (!window.transactionHandler || !window.transactionHandler.initialized) {
            // แสดงข้อความแจ้งเตือนให้เชื่อมต่อกระเป๋าเงิน
            document.getElementById('wallet-not-connected').classList.remove('d-none');
            document.getElementById('exit-content').classList.add('d-none');
            return;
        }
        
        // ซ่อนข้อความแจ้งเตือนให้เชื่อมต่อกระเป๋าเงิน
        document.getElementById('wallet-not-connected').classList.add('d-none');
        document.getElementById('exit-content').classList.remove('d-none');
        
        // โหลดข้อมูลสมาชิก
        await loadMemberDetails();
        
    } catch (error) {
        console.error('Error initializing exit page:', error);
        showErrorAlert('ไม่สามารถโหลดข้อมูลได้', error.message);
    }
}

/**
 * โหลดข้อมูลสมาชิก
 */
async function loadMemberDetails() {
    try {
        // แสดงสถานะกำลังโหลด
        document.getElementById('loading-status').classList.remove('d-none');
        document.getElementById('member-details').classList.add('d-none');
        
        // ตรวจสอบว่าเป็นสมาชิกหรือไม่
        const nftDetails = await window.transactionHandler.getNFTDetails();
        
        if (!nftDetails) {
            // ไม่ได้เป็นสมาชิก
            document.getElementById('loading-status').classList.add('d-none');
            document.getElementById('not-member').classList.remove('d-none');
            document.getElementById('member-details').classList.add('d-none');
            return;
        }
        
        // ดึงข้อมูลสมาชิก
        const memberDetails = await window.transactionHandler.getMemberDetails();
        
        // ซ่อนสถานะกำลังโหลด
        document.getElementById('loading-status').classList.add('d-none');
        document.getElementById('member-details').classList.remove('d-none');
        
        // แสดงข้อมูลสมาชิก
        const planNames = window.contractConfig.planNames || {};
        const planName = planNames[memberDetails.planId] || `แผนที่ ${memberDetails.planId}`;
        document.getElementById('current-plan').textContent = planName;
        
        // คำนวณวันที่ลงทะเบียน
        const registeredAt = new Date(parseInt(memberDetails.registeredAt) * 1000);
        document.getElementById('register-date').textContent = registeredAt.toLocaleDateString('th-TH');
        
        // คำนวณวันที่สามารถยกเลิกได้ (30 วันหลังจากลงทะเบียน)
        const exitAvailableDate = new Date(parseInt(memberDetails.registeredAt) * 1000 + (30 * 24 * 60 * 60 * 1000));
        document.getElementById('exit-available-date').textContent = exitAvailableDate.toLocaleDateString('th-TH');
        
        // คำนวณเวลาที่เหลือก่อนที่จะสามารถยกเลิกได้
        const now = new Date();
        const daysRemaining = Math.ceil((exitAvailableDate - now) / (24 * 60 * 60 * 1000));
        
        if (daysRemaining > 0) {
            // ยังไม่สามารถยกเลิกได้
            document.getElementById('exit-not-available').classList.remove('d-none');
            document.getElementById('days-remaining').textContent = daysRemaining;
            document.getElementById('exit-button').disabled = true;
            document.getElementById('exit-button').classList.add('btn-secondary');
            document.getElementById('exit-button').classList.remove('btn-danger');
        } else {
            // สามารถยกเลิกได้แล้ว
            document.getElementById('exit-available').classList.remove('d-none');
            document.getElementById('exit-button').disabled = false;
            document.getElementById('exit-button').classList.remove('btn-secondary');
            document.getElementById('exit-button').classList.add('btn-danger');
        }
        
        // คำนวณเงินคืน (30% ของราคาแผน)
        const plan = await window.transactionHandler.contract.methods.plans(memberDetails.planId).call();
        const planPrice = plan.price;
        const refundAmount = BigInt(planPrice) * BigInt(30) / BigInt(100);
        const refundAmountInEther = window.transactionHandler.web3.utils.fromWei(refundAmount.toString(), 'ether');
        document.getElementById('refund-amount').textContent = `${parseFloat(refundAmountInEther).toFixed(2)} USDT`;
        
    } catch (error) {
        console.error('Error loading member details:', error);
        document.getElementById('loading-status').classList.add('d-none');
        document.getElementById('error-loading').classList.remove('d-none');
        document.getElementById('error-message').textContent = error.message;
    }
}

/**
 * แสดงการยืนยันการยกเลิกสมาชิก
 */
function showExitConfirmation() {
    // แสดง Modal ยืนยัน
    const exitModal = new bootstrap.Modal(document.getElementById('exitConfirmationModal'));
    exitModal.show();
}

/**
 * ยกเลิกสมาชิก
 */
async function exitMembership() {
    try {
        // ซ่อน Modal ยืนยัน
        const exitModal = bootstrap.Modal.getInstance(document.getElementById('exitConfirmationModal'));
        exitModal.hide();
        
        // แสดงสถานะกำลังดำเนินการ
        document.getElementById('exit-content').classList.add('d-none');
        document.getElementById('exit-process').classList.remove('d-none');
        
        // อัพเดตสถานะ
        updateExitProgress(25, 'กำลังเตรียมการยกเลิกสมาชิก...');
        
        // ดำเนินการยกเลิกสมาชิก
        updateExitProgress(50, 'กำลังดำเนินการยกเลิกสมาชิก...');
        await window.transactionHandler.exitMembership();
        
        // อัพเดตสถานะเป็นสำเร็จ
        updateExitProgress(100, 'ยกเลิกสมาชิกสำเร็จ!');
        
        // แสดงหน้าสำเร็จ
        setTimeout(() => {
            document.getElementById('exit-process').classList.add('d-none');
            document.getElementById('exit-success').classList.remove('d-none');
        }, 1000);
        
    } catch (error) {
        console.error('Error exiting membership:', error);
        
        // แสดงหน้าผิดพลาด
        document.getElementById('exit-process').classList.add('d-none');
        document.getElementById('exit-error').classList.remove('d-none');
        document.getElementById('error-details').textContent = error.message;
    }
}

/**
 * อัพเดตสถานะการยกเลิกสมาชิก
 */
function updateExitProgress(percent, message) {
    document.getElementById('exit-progress').style.width = `${percent}%`;
    document.getElementById('exit-status').textContent = message;
}

/**
 * ฟังก์ชันเชื่อมต่อกระเป๋าเงิน
 */
async function connectWallet() {
    try {
        await window.transactionHandler.init();
        initExitPage();
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