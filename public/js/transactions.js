/**
 * JavaScript สำหรับหน้าประวัติธุรกรรม
 */
document.addEventListener('DOMContentLoaded', function() {
    // เริ่มต้นเมื่อ Web3 พร้อมใช้งาน
    document.addEventListener('web3-initialized', initTransactionsPage);
    
    // ตั้งค่าปุ่มรีเฟรช
    document.getElementById('refresh-btn')?.addEventListener('click', refreshTransactions);
});

/**
 * เริ่มต้นหน้าประวัติธุรกรรม
 */
async function initTransactionsPage() {
    try {
        if (!window.transactionHandler || !window.transactionHandler.initialized) {
            // แสดงข้อความแจ้งเตือนให้เชื่อมต่อกระเป๋าเงิน
            document.getElementById('wallet-not-connected').classList.remove('d-none');
            document.getElementById('transactions-content').classList.add('d-none');
            return;
        }
        
        // ซ่อนข้อความแจ้งเตือนให้เชื่อมต่อกระเป๋าเงิน
        document.getElementById('wallet-not-connected').classList.add('d-none');
        document.getElementById('transactions-content').classList.remove('d-none');
        
        // โหลดข้อมูลธุรกรรม
        await loadTransactions();
        
    } catch (error) {
        console.error('Error initializing transactions page:', error);
        showErrorAlert('ไม่สามารถโหลดข้อมูลประวัติธุรกรรมได้', error.message);
    }
}

/**
 * โหลดข้อมูลธุรกรรมทั้งหมด
 */
async function loadTransactions() {
    try {
        // แสดงสถานะกำลังโหลด
        document.getElementById('transactions-loading').classList.remove('d-none');
        document.getElementById('transactions-table').classList.add('d-none');
        document.getElementById('no-transactions').classList.add('d-none');
        
        // ดึงข้อมูลธุรกรรม
        const transactions = await window.transactionHandler.getMemberTransactions();
        
        // ซ่อนสถานะกำลังโหลด
        document.getElementById('transactions-loading').classList.add('d-none');
        
        if (transactions && transactions.length > 0) {
            // มีข้อมูลธุรกรรม แสดงตาราง
            document.getElementById('transactions-table').classList.remove('d-none');
            populateTransactionsTable(transactions);
        } else {
            // ไม่มีข้อมูลธุรกรรม
            document.getElementById('no-transactions').classList.remove('d-none');
        }
    } catch (error) {
        console.error('Error loading transactions:', error);
        document.getElementById('transactions-loading').classList.add('d-none');
        document.getElementById('no-transactions').classList.remove('d-none');
        document.getElementById('no-transactions-message').textContent = 'เกิดข้อผิดพลาดในการโหลดข้อมูลธุรกรรม: ' + error.message;
        showErrorAlert('ไม่สามารถโหลดข้อมูลธุรกรรมได้', error.message);
    }
}

/**
 * เติมข้อมูลในตารางธุรกรรม
 */
function populateTransactionsTable(transactions) {
    const tbody = document.getElementById('transactions-tbody');
    tbody.innerHTML = '';
    
    // เรียงลำดับตามเวลาล่าสุด
    transactions.sort((a, b) => parseInt(b.timestamp) - parseInt(a.timestamp));
    
    transactions.forEach((tx, index) => {
        const date = new Date(parseInt(tx.timestamp) * 1000);
        const formattedDate = date.toLocaleDateString('th-TH') + ' ' + date.toLocaleTimeString('th-TH');
        
        const amount = window.transactionHandler.web3.utils.fromWei(tx.amount, 'ether');
        
        // กำหนดประเภทธุรกรรมเป็นภาษาไทย
        let txTypeText = 'ทั่วไป';
        let txTypeClass = 'bg-secondary';
        
        if (tx.txType === 'referral') {
            txTypeText = 'ค่าแนะนำ';
            txTypeClass = 'bg-success';
        } else if (tx.txType === 'register') {
            txTypeText = 'ลงทะเบียน';
            txTypeClass = 'bg-primary';
        } else if (tx.txType === 'upgrade') {
            txTypeText = 'อัพเกรด';
            txTypeClass = 'bg-info';
        }
        
        // สร้าง row ใหม่
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${index + 1}</td>
            <td>${formattedDate}</td>
            <td><span class="badge ${txTypeClass}">${txTypeText}</span></td>
            <td title="${tx.from}">${formatAddress(tx.from)}</td>
            <td title="${tx.to}">${formatAddress(tx.to)}</td>
            <td class="text-end">${parseFloat(amount).toFixed(2)} USDT</td>
        `;
        
        tbody.appendChild(row);
    });
}

/**
 * รีเฟรชข้อมูลธุรกรรม
 */
async function refreshTransactions() {
    try {
        await loadTransactions();
        
        // แสดงการแจ้งเตือนสำเร็จ
        window.notificationHandler.showNotification({
            title: 'สำเร็จ',
            message: 'รีเฟรชข้อมูลธุรกรรมเรียบร้อยแล้ว',
            type: 'success'
        });
        
    } catch (error) {
        console.error('Error refreshing transactions:', error);
        showErrorAlert('ไม่สามารถรีเฟรชข้อมูลธุรกรรมได้', error.message);
    }
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
        initTransactionsPage();
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