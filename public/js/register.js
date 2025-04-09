/**
 * Registration Page JavaScript
 */
document.addEventListener('DOMContentLoaded', function() {
    // Initialize when Web3 is ready
    document.addEventListener('web3-initialized', initRegistrationPage);
    
    // Set up button handlers
    document.getElementById('approve-button').addEventListener('click', approveUSDT);
    document.getElementById('register-button').addEventListener('click', registerMember);
});

let selectedPlanId = 1; // Default to Plan 1
const planPrice = 1; // USDT (Fixed for Plan 1)

/**
 * Initialize the registration page
 */
async function initRegistrationPage() {
    try {
        if (!window.transactionHandler || !window.transactionHandler.initialized) {
            // Show wallet connection prompt
            document.getElementById('wallet-not-connected').classList.remove('d-none');
            document.getElementById('registration-form').classList.add('d-none');
            return;
        }
        
        // Check if already a member
        const isMember = await checkIfMember();
        if (isMember) {
            // Already a member, show appropriate message
            document.getElementById('wallet-not-connected').classList.add('d-none');
            document.getElementById('already-member').classList.remove('d-none');
            document.getElementById('registration-form').classList.add('d-none');
            return;
        }
        
        // Hide wallet connection prompt and show registration form
        document.getElementById('wallet-not-connected').classList.add('d-none');
        document.getElementById('already-member').classList.add('d-none');
        document.getElementById('registration-form').classList.remove('d-none');
        
        // Load USDT balance and wallet address
        await loadBalanceAndAddress();
        
        // Check if already approved
        await checkApproval();
        
    } catch (error) {
        console.error('Error initializing registration page:', error);
        showErrorAlert('ไม่สามารถโหลดข้อมูลหน้าลงทะเบียนได้', error.message);
    }
}

/**
 * Check if user is already a member
 */
async function checkIfMember() {
    try {
        // Check if user has an NFT
        const nftDetails = await window.transactionHandler.getNFTDetails();
        return !!nftDetails;
    } catch (error) {
        console.error('Error checking membership:', error);
        return false;
    }
}

/**
 * Load USDT balance and wallet address
 */
async function loadBalanceAndAddress() {
    try {
        // Get USDT balance
        const balance = await window.transactionHandler.getUSDTBalance();
        document.getElementById('usdt-balance').textContent = `${parseFloat(balance).toFixed(2)} USDT`;
        
        // Get wallet address
        const account = window.transactionHandler.currentAccount;
        document.getElementById('wallet-address').textContent = formatAddress(account);
        
        // Check if balance is sufficient
        if (parseFloat(balance) < planPrice) {
            showErrorAlert('USDT ไม่เพียงพอ', `คุณมี ${parseFloat(balance).toFixed(2)} USDT แต่ต้องการ ${planPrice} USDT สำหรับการลงทะเบียน`);
            document.getElementById('approve-button').disabled = true;
            document.getElementById('approve-button').classList.add('btn-secondary');
            document.getElementById('approve-button').classList.remove('btn-primary');
        }
    } catch (error) {
        console.error('Error loading balance and address:', error);
        document.getElementById('usdt-balance').textContent = 'ไม่พบข้อมูล';
        document.getElementById('wallet-address').textContent = 'ไม่พบข้อมูล';
    }
}

/**
 * Check if USDT has been approved
 */
async function checkApproval() {
    try {
        const hasApproved = await window.transactionHandler.checkAllowance(planPrice);
        
        if (hasApproved) {
            // Already approved, show register button
            document.getElementById('approve-section').classList.add('d-none');
            document.getElementById('register-section').classList.remove('d-none');
        } else {
            // Not approved yet, show approve button
            document.getElementById('approve-section').classList.remove('d-none');
            document.getElementById('register-section').classList.add('d-none');
        }
    } catch (error) {
        console.error('Error checking approval:', error);
        showErrorAlert('ไม่สามารถตรวจสอบการอนุมัติ USDT ได้', error.message);
    }
}

/**
 * Approve USDT for spending
 */
async function approveUSDT() {
    try {
        // Disable button
        const approveButton = document.getElementById('approve-button');
        approveButton.disabled = true;
        approveButton.innerHTML = '<span class="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span> กำลังอนุมัติ...';
        
        // Approve USDT
        await window.transactionHandler.approveUSDT(planPrice);
        
        // Show success message
        window.notificationHandler.showNotification({
            title: 'สำเร็จ',
            message: 'อนุมัติการใช้ USDT สำเร็จแล้ว',
            type: 'success'
        });
        
        // Update UI
        document.getElementById('approve-section').classList.add('d-none');
        document.getElementById('register-section').classList.remove('d-none');
        
    } catch (error) {
        console.error('Error approving USDT:', error);
        
        // Enable button
        const approveButton = document.getElementById('approve-button');
        approveButton.disabled = false;
        approveButton.innerHTML = '<i class="bi bi-check-circle-fill me-2"></i> อนุมัติการใช้ USDT';
        
        showErrorAlert('ไม่สามารถอนุมัติการใช้ USDT ได้', error.message);
    }
}

/**
 * Register as a member
 */
async function registerMember() {
    try {
        // Check terms acceptance
        if (!document.getElementById('terms-check').checked) {
            showErrorAlert('ต้องยอมรับข้อตกลง', 'กรุณายอมรับข้อตกลงการใช้บริการและนโยบายความเป็นส่วนตัวก่อนลงทะเบียน');
            return;
        }
        
        // Show registration process
        document.getElementById('registration-form').classList.add('d-none');
        document.getElementById('registration-process').classList.remove('d-none');
        
        // Update status
        updateRegistrationProgress(25, 'กำลังเตรียมการลงทะเบียน...');
        
        // Get upline address
        const uplineAddress = document.getElementById('uplineAddress').value.trim();
        
        // Check again if USDT is approved
        updateRegistrationProgress(40, 'กำลังตรวจสอบการอนุมัติ USDT...');
        const hasApproved = await window.transactionHandler.checkAllowance(planPrice);
        
        if (!hasApproved) {
            // Not approved yet, try to approve
            updateRegistrationProgress(50, 'กำลังอนุมัติการใช้ USDT...');
            await window.transactionHandler.approveUSDT(planPrice);
        }
        
        // Register member
        updateRegistrationProgress(75, 'กำลังลงทะเบียนสมาชิก...');
        await window.transactionHandler.registerMember(selectedPlanId, uplineAddress);
        
        // Update progress to complete
        updateRegistrationProgress(100, 'ลงทะเบียนสมาชิกสำเร็จ!');
        
        // Show success message after slight delay
        setTimeout(() => {
            document.getElementById('registration-process').classList.add('d-none');
            document.getElementById('registration-success').classList.remove('d-none');
        }, 1000);
        
    } catch (error) {
        console.error('Error registering member:', error);
        
        // Show error message
        document.getElementById('registration-process').classList.add('d-none');
        document.getElementById('registration-error').classList.remove('d-none');
        document.getElementById('error-message').textContent = `ไม่สามารถลงทะเบียนสมาชิกได้: ${error.message}`;
    }
}

/**
 * Update registration progress
 */
function updateRegistrationProgress(percent, message) {
    document.getElementById('registration-progress').style.width = `${percent}%`;
    document.getElementById('registration-status').textContent = message;
}

/**
 * Reset registration process
 */
function resetRegistration() {
    document.getElementById('registration-error').classList.add('d-none');
    document.getElementById('registration-form').classList.remove('d-none');
}

/**
 * Select a plan
 */
function selectPlan(planElementId) {
    // Get the plan ID from the radio button
    const planElement = document.getElementById(planElementId);
    selectedPlanId = parseInt(planElement.value);
    
    // Currently only Plan 1 is selectable, but this can be expanded later
    window.notificationHandler.showNotification({
        title: 'แผนที่เลือก',
        message: 'คุณได้เลือกแผน Starter (1 USDT)',
        type: 'info'
    });
}

/**
 * Clear upline address
 */
function clearUpline() {
    document.getElementById('uplineAddress').value = '';
}

/**
 * Connect wallet function (used by the connection alert)
 */
async function connectWallet() {
    try {
        await window.transactionHandler.init();
        initRegistrationPage();
    } catch (error) {
        console.error('Error connecting wallet:', error);
        showErrorAlert('ไม่สามารถเชื่อมต่อกระเป๋าเงินได้', error.message);
    }
}

/**
 * Format Ethereum address to shorter form
 */
function formatAddress(address) {
    if (!address) return 'ไม่พบที่อยู่';
    return address.substring(0, 6) + '...' + address.substring(address.length - 4);
}

/**
 * Show error alert
 */
function showErrorAlert(title, message) {
    window.notificationHandler.showNotification({
        title: title || 'เกิดข้อผิดพลาด',
        message: message || 'เกิดข้อผิดพลาดที่ไม่ทราบสาเหตุ',
        type: 'danger'
    });
}