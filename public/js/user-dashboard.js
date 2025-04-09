/**
 * User Dashboard JavaScript
 */
document.addEventListener('DOMContentLoaded', function() {
    // Initialize dashboard when Web3 is ready
    document.addEventListener('web3-initialized', initDashboard);
    
    // Set up refresh button
    document.getElementById('refresh-btn').addEventListener('click', refreshDashboard);
    
    // Set up share button
    document.getElementById('share-btn').addEventListener('click', shareReferralLink);
});

/**
 * Initialize the dashboard
 */
async function initDashboard() {
    try {
        if (!window.transactionHandler || !window.transactionHandler.initialized) {
            // Show wallet connection prompt
            document.getElementById('wallet-not-connected').classList.remove('d-none');
            document.getElementById('dashboard-content').classList.add('d-none');
            return;
        }
        
        // Hide wallet connection prompt
        document.getElementById('wallet-not-connected').classList.add('d-none');
        document.getElementById('dashboard-content').classList.remove('d-none');
        
        // Load all dashboard data
        await Promise.all([
            loadMembershipDetails(),
            loadNftDetails(),
            loadRecentTransactions(),
            loadUsdtBalance()
        ]);
        
        // Set up referral link
        setupReferralLink();
        
    } catch (error) {
        console.error('Error initializing dashboard:', error);
        showErrorAlert('ไม่สามารถโหลดข้อมูลแดชบอร์ดได้', error.message);
    }
}

/**
 * Load membership details
 */
async function loadMembershipDetails() {
    try {
        const memberDetails = await window.transactionHandler.getMemberDetails();
        
        // Set plan name
        const planNames = window.contractConfig.planNames || {};
        const planName = planNames[memberDetails.planId] || `แผนที่ ${memberDetails.planId}`;
        document.getElementById('current-plan').textContent = planName;
        
        // Set referrals
        document.getElementById('total-referrals').textContent = memberDetails.totalReferrals;
        
        // Set earnings
        const totalEarnings = window.transactionHandler.web3.utils.fromWei(memberDetails.totalEarnings, 'ether');
        document.getElementById('total-earnings').textContent = `${parseFloat(totalEarnings).toFixed(2)} USDT`;
        
    } catch (error) {
        console.error('Error loading membership details:', error);
        document.getElementById('current-plan').textContent = 'ไม่พบข้อมูล';
        document.getElementById('total-referrals').textContent = '0';
        document.getElementById('total-earnings').textContent = '0 USDT';
    }
}

/**
 * Load NFT details
 */
async function loadNftDetails() {
    try {
        const nftDetails = await window.transactionHandler.getNFTDetails();
        
        // Hide loading state
        document.getElementById('nft-loading').classList.add('d-none');
        
        if (nftDetails) {
            // Show NFT
            document.getElementById('nft-display').classList.remove('d-none');
            document.getElementById('no-nft').classList.add('d-none');
            
            // Set NFT details
            document.getElementById('nft-image').src = nftDetails.imageURI;
            document.getElementById('nft-name').textContent = nftDetails.name;
            document.getElementById('nft-description').textContent = nftDetails.description;
        } else {
            // No NFT found
            document.getElementById('nft-display').classList.add('d-none');
            document.getElementById('no-nft').classList.remove('d-none');
        }
    } catch (error) {
        console.error('Error loading NFT details:', error);
        document.getElementById('nft-loading').classList.add('d-none');
        document.getElementById('nft-display').classList.add('d-none');
        document.getElementById('no-nft').classList.remove('d-none');
    }
}

/**
 * Load recent transactions
 */
async function loadRecentTransactions() {
    try {
        const transactions = await window.transactionHandler.getMemberTransactions();
        const tbodyElement = document.getElementById('recent-transactions');
        
        // Clear loading indicator
        tbodyElement.innerHTML = '';
        
        if (transactions.length === 0) {
            // No transactions
            tbodyElement.innerHTML = `
                <tr>
                    <td colspan="5" class="text-center py-4">
                        <p class="mb-0 text-muted">ไม่พบธุรกรรมล่าสุด</p>
                    </td>
                </tr>
            `;
            return;
        }
        
        // Get the 5 most recent transactions
        const recentTransactions = transactions.slice(0, 5);
        
        // Add transactions to table
        recentTransactions.forEach(tx => {
            const date = new Date(parseInt(tx.timestamp) * 1000);
            const formattedDate = date.toLocaleDateString('th-TH') + ' ' + date.toLocaleTimeString('th-TH');
            
            const amount = window.transactionHandler.web3.utils.fromWei(tx.amount, 'ether');
            
            // Determine transaction type in Thai
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
            
            // Format addresses
            const fromAddress = formatAddress(tx.from);
            const toAddress = formatAddress(tx.to);
            
            // Create table row
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${formattedDate}</td>
                <td><span class="badge ${txTypeClass}">${txTypeText}</span></td>
                <td title="${tx.from}">${fromAddress}</td>
                <td title="${tx.to}">${toAddress}</td>
                <td class="text-end">${parseFloat(amount).toFixed(2)} USDT</td>
            `;
            
            tbodyElement.appendChild(row);
        });
    } catch (error) {
        console.error('Error loading recent transactions:', error);
        document.getElementById('recent-transactions').innerHTML = `
            <tr>
                <td colspan="5" class="text-center py-4">
                    <p class="mb-0 text-danger">ไม่สามารถโหลดธุรกรรมล่าสุดได้</p>
                </td>
            </tr>
        `;
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
 * Set up referral link
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
 * Copy referral link to clipboard
 */
function copyReferralLink() {
    const referralLinkInput = document.getElementById('referral-link');
    referralLinkInput.select();
    referralLinkInput.setSelectionRange(0, 99999);
    document.execCommand('copy');
    
    // Show success notification
    window.notificationHandler.showNotification({
        title: 'สำเร็จ',
        message: 'คัดลอกลิงก์การอ้างอิงแล้ว',
        type: 'success'
    });
}

/**
 * Refresh USDT balance
 */
async function refreshBalance() {
    try {
        document.getElementById('usdt-balance').textContent = 'กำลังโหลด...';
        await loadUsdtBalance();
    } catch (error) {
        console.error('Error refreshing balance:', error);
        document.getElementById('usdt-balance').textContent = 'ไม่พบข้อมูล';
    }
}

/**
 * Refresh the entire dashboard
 */
async function refreshDashboard() {
    try {
        // Reset loading states
        document.getElementById('current-plan').textContent = 'กำลังโหลด...';
        document.getElementById('total-referrals').textContent = 'กำลังโหลด...';
        document.getElementById('total-earnings').textContent = 'กำลังโหลด...';
        document.getElementById('usdt-balance').textContent = 'กำลังโหลด...';
        
        document.getElementById('nft-loading').classList.remove('d-none');
        document.getElementById('nft-display').classList.add('d-none');
        document.getElementById('no-nft').classList.add('d-none');
        
        document.getElementById('recent-transactions').innerHTML = `
            <tr>
                <td colspan="5" class="text-center py-4">
                    <div class="spinner-border spinner-border-sm text-primary" role="status">
                        <span class="visually-hidden">กำลังโหลด...</span>
                    </div>
                    <span class="ms-2">กำลังโหลดธุรกรรมล่าสุด...</span>
                </td>
            </tr>
        `;
        
        // Reload all dashboard data
        await Promise.all([
            loadMembershipDetails(),
            loadNftDetails(),
            loadRecentTransactions(),
            loadUsdtBalance()
        ]);
        
        // Show success notification
        window.notificationHandler.showNotification({
            title: 'สำเร็จ',
            message: 'รีเฟรชข้อมูลแดชบอร์ดแล้ว',
            type: 'success'
        });
    } catch (error) {
        console.error('Error refreshing dashboard:', error);
        showErrorAlert('ไม่สามารถรีเฟรชข้อมูลแดชบอร์ดได้', error.message);
    }
}

/**
 * Share referral link
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
 * Share on Twitter
 */
function shareOnTwitter() {
    const referralLink = document.getElementById('referral-link').value;
    const text = encodeURIComponent('ร่วมเป็นสมาชิก Crypto Membership NFT และรับ NFT สมาชิกของคุณทันที! 🚀 #CryptoMembership #NFT');
    const url = encodeURIComponent(referralLink);
    
    window.open(`https://twitter.com/intent/tweet?text=${text}&url=${url}`, '_blank');
}

/**
 * Share on Facebook
 */
function shareOnFacebook() {
    const referralLink = document.getElementById('referral-link').value;
    const url = encodeURIComponent(referralLink);
    
    window.open(`https://www.facebook.com/sharer/sharer.php?u=${url}`, '_blank');
}

/**
 * Share on Telegram
 */
function shareOnTelegram() {
    const referralLink = document.getElementById('referral-link').value;
    const text = encodeURIComponent('ร่วมเป็นสมาชิก Crypto Membership NFT และรับ NFT สมาชิกของคุณทันที! 🚀');
    const url = encodeURIComponent(referralLink);
    
    window.open(`https://t.me/share/url?url=${url}&text=${text}`, '_blank');
}

/**
 * Share on Line
 */
function shareOnLine() {
    const referralLink = document.getElementById('referral-link').value;
    const url = encodeURIComponent(referralLink);
    
    window.open(`https://social-plugins.line.me/lineit/share?url=${url}`, '_blank');
}

/**
 * Format Ethereum address to shorter form
 */
function formatAddress(address) {
    if (!address) return '-';
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

/**
 * Connect wallet function (used by the connection alert)
 */
async function connectWallet() {
    try {
        await window.transactionHandler.init();
        initDashboard();
    } catch (error) {
        console.error('Error connecting wallet:', error);
        showErrorAlert('ไม่สามารถเชื่อมต่อกระเป๋าเงินได้', error.message);
    }
}

/**
 * Disconnect wallet function
 */
function disconnectWallet() {
    document.getElementById('wallet-not-connected').classList.remove('d-none');
    document.getElementById('dashboard-content').classList.add('d-none');
    
    // Dispatch event for navbar to update
    window.dispatchEvent(new CustomEvent('accountChanged', { detail: null }));
}