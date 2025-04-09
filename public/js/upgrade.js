/**
 * Upgrade Page JavaScript
 */
document.addEventListener('DOMContentLoaded', function() {
    // Initialize when Web3 is ready
    document.addEventListener('web3-initialized', initUpgradePage);
    
    // Set up button handlers
    document.getElementById('approve-button').addEventListener('click', approveUSDT);
    document.getElementById('upgrade-button').addEventListener('click', upgradePlan);
});

let selectedPlanId = null;
let currentPlanId = null;
let currentPlan = null;
let newPlan = null;
let priceDifference = 0;
let plans = [];

/**
 * Initialize the upgrade page
 */
async function initUpgradePage() {
    try {
        if (!window.transactionHandler || !window.transactionHandler.initialized) {
            // Show wallet connection prompt
            document.getElementById('wallet-not-connected').classList.remove('d-none');
            document.getElementById('upgrade-form').classList.add('d-none');
            return;
        }
        
        // Check if user is a member
        const isMember = await checkIfMember();
        if (!isMember) {
            // Not a member, show appropriate message
            document.getElementById('wallet-not-connected').classList.add('d-none');
            document.getElementById('not-member').classList.remove('d-none');
            document.getElementById('upgrade-form').classList.add('d-none');
            return;
        }
        
        // Hide wallet connection prompt and show upgrade form
        document.getElementById('wallet-not-connected').classList.add('d-none');
        document.getElementById('not-member').classList.add('d-none');
        document.getElementById('upgrade-form').classList.remove('d-none');
        
        // Load current plan and USDT balance
        await Promise.all([
            loadCurrentPlan(),
            loadUsdtBalance()
        ]);
        
        // Load available plans
        await loadAvailablePlans();
        
    } catch (error) {
        console.error('Error initializing upgrade page:', error);
        showErrorAlert('ไม่สามารถโหลดข้อมูลหน้าอัพเกรดได้', error.message);
    }
}

/**
 * Check if user is a member
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
 * Load current plan details
 */
async function loadCurrentPlan() {
    try {
        const memberDetails = await window.transactionHandler.getMemberDetails();
        currentPlanId = parseInt(memberDetails.planId);
        
        // Get plan name
        const planNames = window.contractConfig.planNames || {};
        const planName = planNames[currentPlanId] || `แผนที่ ${currentPlanId}`;
        document.getElementById('current-plan-name').textContent = planName;
        
        // Save current plan data
        currentPlan = {
            id: currentPlanId,
            name: planName
        };
    } catch (error) {
        console.error('Error loading current plan:', error);
        document.getElementById('current-plan-name').textContent = 'ไม่พบข้อมูล';
    }
}

/**
 * Load USDT balance
 */
async function loadUsdtBalance() {
    try {
        const balance = await window.transactionHandler.getUSDTBalance();
        document.getElementById('usdt-balance').textContent = `${parseFloat(balance).toFixed(2)} USDT`;
    } catch (error) {
        console.error('Error loading USDT balance:', error);
        document.getElementById('usdt-balance').textContent = 'ไม่พบข้อมูล';
    }
}

/**
 * Load available plans
 */
async function loadAvailablePlans() {
    try {
        plans = await window.transactionHandler.getAllPlans();
        
        // Get container and clear loading indicator
        const container = document.getElementById('plans-container');
        container.innerHTML = '';
        
        // Get plan names from config
        const planNames = window.contractConfig.planNames || {};
        
        // Add plans to container
        for (let i = 0; i < plans.length; i++) {
            const plan = plans[i];
            const planId = parseInt(plan.id);
            
            // Skip plans that are not active
            if (!plan.isActive) continue;
            
            // For upgrade, only show plans that are one level higher than current plan
            if (planId !== currentPlanId + 1) {
                continue;
            }
            
            const planName = planNames[planId] || plan.name || `แผนที่ ${planId}`;
            const planPrice = window.transactionHandler.web3.utils.fromWei(plan.price, 'ether');
            
            // Create plan card
            const planCard = document.createElement('div');
            planCard.className = 'col';
            planCard.innerHTML = `
                <div class="card h-100 border ${planId === selectedPlanId ? 'border-primary' : ''}" id="plan-card-${planId}">
                    <div class="card-header bg-primary text-white">
                        <h5 class="card-title mb-0">${planName}</h5>
                    </div>
                    <div class="card-body">
                        <h3 class="card-title pricing-card-title">${parseFloat(planPrice).toFixed(2)} USDT</h3>
                        <ul class="list-unstyled mt-3 mb-4">
                            <li class="mb-2"><i class="bi bi-check-circle me-2 text-success"></i> แผนสมาชิกระดับสูงขึ้น</li>
                            <li class="mb-2"><i class="bi bi-check-circle me-2 text-success"></i> รายได้จากการอ้างอิงสูงขึ้น</li>
                            <li class="mb-2"><i class="bi bi-check-circle me-2 text-success"></i> สิทธิประโยชน์พิเศษเพิ่มเติม</li>
                        </ul>
                        <input type="radio" name="planId" value="${planId}" id="plan${planId}" class="d-none" ${planId === selectedPlanId ? 'checked' : ''}>
                        <button class="w-100 btn ${planId === selectedPlanId ? 'btn-primary' : 'btn-outline-primary'}" onclick="selectPlan(${planId})">
                            ${planId === selectedPlanId ? 'แผนที่เลือก' : 'เลือกแผนนี้'}
                        </button>
                    </div>
                </div>
            `;
            
            container.appendChild(planCard);
            
            // Default to first available plan if none selected
            if (selectedPlanId === null) {
                selectPlan(planId);
            }
        }
        
        // If no plans available for upgrade
        if (container.children.length === 0) {
            container.innerHTML = `
                <div class="col-12">
                    <div class="alert alert-info">
                        <i class="bi bi-info-circle-fill me-2"></i>
                        ไม่มีแผนที่สามารถอัพเกรดได้ในขณะนี้ คุณอาจอยู่ในแผนสมาชิกสูงสุดแล้ว
                    </div>
                </div>
            `;
        }
        
    } catch (error) {
        console.error('Error loading available plans:', error);
        
        // Show error message
        const container = document.getElementById('plans-container');
        container.innerHTML = `
            <div class="col-12">
                <div class="alert alert-danger">
                    <i class="bi bi-exclamation-triangle-fill me-2"></i>
                    ไม่สามารถโหลดแผนสมาชิกได้: ${error.message}
                </div>
            </div>
        `;
    }
}

/**
 * Select a plan
 */
function selectPlan(planId) {
    selectedPlanId = planId;
    
    // Update UI for all plan cards
    for (let i = 0; i < plans.length; i++) {
        const plan = plans[i];
        const cardElement = document.getElementById(`plan-card-${plan.id}`);
        if (cardElement) {
            if (parseInt(plan.id) === selectedPlanId) {
                cardElement.classList.add('border-primary');
                cardElement.querySelector('button').classList.remove('btn-outline-primary');
                cardElement.querySelector('button').classList.add('btn-primary');
                cardElement.querySelector('button').textContent = 'แผนที่เลือก';
                
                // Save selected plan details
                newPlan = {
                    id: parseInt(plan.id),
                    name: window.contractConfig.planNames[plan.id] || plan.name || `แผนที่ ${plan.id}`,
                    price: plan.price
                };
            } else {
                cardElement.classList.remove('border-primary');
                cardElement.querySelector('button').classList.add('btn-outline-primary');
                cardElement.querySelector('button').classList.remove('btn-primary');
                cardElement.querySelector('button').textContent = 'เลือกแผนนี้';
            }
        }
    }
    
    // Show payment information
    updatePaymentInfo();
    
    // Show approval section
    document.getElementById('payment-info').classList.remove('d-none');
    document.getElementById('approve-section').classList.remove('d-none');
    
    // Check if already approved
    checkApproval();
}

/**
 * Update payment information
 */
function updatePaymentInfo() {
    if (!currentPlan || !newPlan) return;
    
    // Find current and new plan details
    const currentPlanObj = plans.find(p => parseInt(p.id) === currentPlan.id);
    const newPlanObj = plans.find(p => parseInt(p.id) === newPlan.id);
    
    if (!currentPlanObj || !newPlanObj) return;
    
    // Calculate price difference
    const currentPrice = BigInt(currentPlanObj.price);
    const newPrice = BigInt(newPlanObj.price);
    priceDifference = newPrice - currentPrice;
    
    // Update UI
    document.getElementById('summary-current-plan').textContent = `${currentPlan.name} (${parseFloat(window.transactionHandler.web3.utils.fromWei(currentPlanObj.price, 'ether')).toFixed(2)} USDT)`;
    document.getElementById('summary-new-plan').textContent = `${newPlan.name} (${parseFloat(window.transactionHandler.web3.utils.fromWei(newPlanObj.price, 'ether')).toFixed(2)} USDT)`;
    document.getElementById('summary-price-difference').textContent = `${parseFloat(window.transactionHandler.web3.utils.fromWei(priceDifference.toString(), 'ether')).toFixed(2)} USDT`;
}

/**
 * Check if USDT has been approved
 */
async function checkApproval() {
    try {
        if (!newPlan) return;
        
        const priceDifferenceInEther = parseFloat(window.transactionHandler.web3.utils.fromWei(priceDifference.toString(), 'ether'));
        const hasApproved = await window.transactionHandler.checkAllowance(priceDifferenceInEther);
        
        if (hasApproved) {
            // Already approved, show upgrade button
            document.getElementById('approve-section').classList.add('d-none');
            document.getElementById('upgrade-section').classList.remove('d-none');
        } else {
            // Not approved yet, show approve button
            document.getElementById('approve-section').classList.remove('d-none');
            document.getElementById('upgrade-section').classList.add('d-none');
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
        if (!newPlan) {
            showErrorAlert('กรุณาเลือกแผนที่ต้องการอัพเกรด', '');
            return;
        }
        
        // Disable button
        const approveButton = document.getElementById('approve-button');
        approveButton.disabled = true;
        approveButton.innerHTML = '<span class="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span> กำลังอนุมัติ...';
        
        // Calculate amount to approve
        const priceDifferenceInEther = parseFloat(window.transactionHandler.web3.utils.fromWei(priceDifference.toString(), 'ether'));
        
        // Approve USDT
        await window.transactionHandler.approveUSDT(priceDifferenceInEther);
        
        // Show success message
        window.notificationHandler.showNotification({
            title: 'สำเร็จ',
            message: 'อนุมัติการใช้ USDT สำเร็จแล้ว',
            type: 'success'
        });
        
        // Update UI
        document.getElementById('approve-section').classList.add('d-none');
        document.getElementById('upgrade-section').classList.remove('d-none');
        
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
 * Upgrade membership plan
 */
async function upgradePlan() {
    try {
        if (!newPlan) {
            showErrorAlert('กรุณาเลือกแผนที่ต้องการอัพเกรด', '');
            return;
        }
        
        // Show upgrade process
        document.getElementById('upgrade-form').classList.add('d-none');
        document.getElementById('upgrade-process').classList.remove('d-none');
        
        // Update status
        updateUpgradeProgress(25, 'กำลังเตรียมการอัพเกรด...');
        
        // Check again if USDT is approved
        updateUpgradeProgress(40, 'กำลังตรวจสอบการอนุมัติ USDT...');
        const priceDifferenceInEther = parseFloat(window.transactionHandler.web3.utils.fromWei(priceDifference.toString(), 'ether'));
        const hasApproved = await window.transactionHandler.checkAllowance(priceDifferenceInEther);
        
        if (!hasApproved) {
            // Not approved yet, try to approve
            updateUpgradeProgress(50, 'กำลังอนุมัติการใช้ USDT...');
            await window.transactionHandler.approveUSDT(priceDifferenceInEther);
        }
        
        // Upgrade plan
        updateUpgradeProgress(75, 'กำลังอัพเกรดแผนสมาชิก...');
        await window.transactionHandler.upgradePlan(newPlan.id);
        
        // Update progress to complete
        updateUpgradeProgress(100, 'อัพเกรดแผนสมาชิกสำเร็จ!');
        
        // Show success message after slight delay
        setTimeout(() => {
            document.getElementById('upgrade-process').classList.add('d-none');
            document.getElementById('upgrade-success').classList.remove('d-none');
        }, 1000);
        
    } catch (error) {
        console.error('Error upgrading plan:', error);
        
        // Show error message
        document.getElementById('upgrade-process').classList.add('d-none');
        document.getElementById('upgrade-error').classList.remove('d-none');
        document.getElementById('error-message').textContent = `ไม่สามารถอัพเกรดแผนสมาชิกได้: ${error.message}`;
    }
}

/**
 * Update upgrade progress
 */
function updateUpgradeProgress(percent, message) {
    document.getElementById('upgrade-progress').style.width = `${percent}%`;
    document.getElementById('upgrade-status').textContent = message;
}

/**
 * Reset upgrade process
 */
function resetUpgrade() {
    document.getElementById('upgrade-error').classList.add('d-none');
    document.getElementById('upgrade-form').classList.remove('d-none');
}

/**
 * Connect wallet function (used by the connection alert)
 */
async function connectWallet() {
    try {
        await window.transactionHandler.init();
        initUpgradePage();
    } catch (error) {
        console.error('Error connecting wallet:', error);
        showErrorAlert('ไม่สามารถเชื่อมต่อกระเป๋าเงินได้', error.message);
    }
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