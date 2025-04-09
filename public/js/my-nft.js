/**
 * My NFT Page JavaScript
 */
document.addEventListener('DOMContentLoaded', function() {
    // Initialize when Web3 is ready
    document.addEventListener('web3-initialized', initMyNftPage);
    
    // Set up button handlers
    document.getElementById('refresh-btn')?.addEventListener('click', refreshNftDetails);
    document.getElementById('update-nft-btn')?.addEventListener('click', updateNftDetails);
    document.getElementById('upload-btn')?.addEventListener('click', uploadImage);
});

let currentNft = null;

/**
 * Initialize the My NFT page
 */
async function initMyNftPage() {
    try {
        if (!window.transactionHandler || !window.transactionHandler.initialized) {
            // Show wallet connection prompt
            document.getElementById('wallet-not-connected').classList.remove('d-none');
            document.getElementById('nft-content').classList.add('d-none');
            return;
        }
        
        // Hide wallet connection prompt
        document.getElementById('wallet-not-connected').classList.add('d-none');
        document.getElementById('nft-content').classList.remove('d-none');
        
        // Load NFT details
        await loadNftDetails();
        
    } catch (error) {
        console.error('Error initializing My NFT page:', error);
        showErrorAlert('ไม่สามารถโหลดข้อมูล NFT ได้', error.message);
    }
}

/**
 * Load NFT details
 */
async function loadNftDetails() {
    try {
        // Show loading state
        document.getElementById('nft-loading').classList.remove('d-none');
        document.getElementById('nft-display').classList.add('d-none');
        document.getElementById('no-nft').classList.add('d-none');
        
        // Check if user has NFT
        const nftDetails = await window.transactionHandler.getNFTDetails();
        
        // Hide loading state
        document.getElementById('nft-loading').classList.add('d-none');
        
        if (nftDetails) {
            // Store current NFT details
            currentNft = nftDetails;
            
            // Show NFT display
            document.getElementById('nft-display').classList.remove('d-none');
            
            // Set NFT details
            document.getElementById('nft-image').src = nftDetails.imageURI || '/img/placeholder-nft.png';
            document.getElementById('nft-name').textContent = nftDetails.name || 'Unnamed NFT';
            document.getElementById('nft-description').textContent = nftDetails.description || 'No description';
            
            // Get plan name from config
            const planNames = window.contractConfig.planNames || {};
            const planName = planNames[nftDetails.planId] || `Plan ${nftDetails.planId}`;
            document.getElementById('nft-plan').textContent = planName;
            
            // Set token ID and external link
            document.getElementById('nft-token-id').textContent = nftDetails.tokenId;
            const explorerUrl = getExplorerUrl(window.contractConfig.contractAddress, 'token', window.contractConfig.networkId);
            document.getElementById('nft-external-link').href = explorerUrl;
            
            // Populate the customization form
            document.getElementById('custom-name').value = nftDetails.name || '';
            document.getElementById('custom-description').value = nftDetails.description || '';
            document.getElementById('custom-image').value = nftDetails.imageURI || '';
            
        } else {
            // No NFT found
            document.getElementById('no-nft').classList.remove('d-none');
        }
    } catch (error) {
        console.error('Error loading NFT details:', error);
        document.getElementById('nft-loading').classList.add('d-none');
        document.getElementById('no-nft').classList.remove('d-none');
        showErrorAlert('ไม่สามารถโหลดข้อมูล NFT ได้', error.message);
    }
}

/**
 * Update NFT details
 */
async function updateNftDetails() {
    try {
        if (!currentNft) {
            showErrorAlert('ไม่พบข้อมูล NFT', 'ไม่สามารถอัพเดตข้อมูล NFT ได้');
            return;
        }
        
        // Get form values
        const name = document.getElementById('custom-name').value.trim();
        const description = document.getElementById('custom-description').value.trim();
        const imageURI = document.getElementById('custom-image').value.trim();
        
        // Validate form
        if (!name) {
            showErrorAlert('กรุณากรอกชื่อ NFT', 'ชื่อ NFT จำเป็นต้องกรอก');
            return;
        }
        
        if (!imageURI) {
            showErrorAlert('กรุณากรอก URL รูปภาพ NFT', 'URL รูปภาพ NFT จำเป็นต้องกรอก');
            return;
        }
        
        // Disable the update button
        const updateButton = document.getElementById('update-nft-btn');
        updateButton.disabled = true;
        updateButton.innerHTML = '<span class="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span> กำลังอัพเดต...';
        
        // Update NFT image
        await window.transactionHandler.setNFTImage(imageURI, name, description);
        
        // Show success notification
        window.notificationHandler.showNotification({
            title: 'สำเร็จ',
            message: 'อัพเดตข้อมูล NFT เรียบร้อยแล้ว',
            type: 'success'
        });
        
        // Reload NFT details
        await loadNftDetails();
        
        // Enable the update button
        updateButton.disabled = false;
        updateButton.innerHTML = '<i class="bi bi-check-circle me-2"></i> อัพเดตข้อมูล NFT';
        
    } catch (error) {
        console.error('Error updating NFT details:', error);
        
        // Enable the update button
        const updateButton = document.getElementById('update-nft-btn');
        updateButton.disabled = false;
        updateButton.innerHTML = '<i class="bi bi-check-circle me-2"></i> อัพเดตข้อมูล NFT';
        
        showErrorAlert('ไม่สามารถอัพเดตข้อมูล NFT ได้', error.message);
    }
}

/**
 * Upload image to IPFS or other storage
 * This is a placeholder function - in a real app, you'd implement actual image upload
 */
async function uploadImage() {
    try {
        const fileInput = document.getElementById('image-upload');
        const file = fileInput.files[0];
        
        if (!file) {
            showErrorAlert('กรุณาเลือกไฟล์รูปภาพ', 'คุณต้องเลือกไฟล์รูปภาพก่อนอัพโหลด');
            return;
        }
        
        // Check file type
        if (!file.type.startsWith('image/')) {
            showErrorAlert('ไฟล์ไม่ถูกต้อง', 'กรุณาเลือกไฟล์รูปภาพเท่านั้น (เช่น JPG, PNG, GIF)');
            return;
        }
        
        // Check file size (max 5 MB)
        if (file.size > 5 * 1024 * 1024) {
            showErrorAlert('ไฟล์ขนาดใหญ่เกินไป', 'กรุณาเลือกไฟล์ขนาดไม่เกิน 5 MB');
            return;
        }
        
        // Show upload status
        document.getElementById('upload-status').classList.remove('d-none');
        
        // In a real app, you would upload to IPFS or other storage here
        // This is a simulated upload
        setTimeout(() => {
            // Hide upload status
            document.getElementById('upload-status').classList.add('d-none');
            
            // Generate a placeholder URL (in reality, this would be an IPFS URL)
            const placeholderImageUrl = `https://placeholder.pics/svg/500x500/DEDEDE/555555/Crypto%20NFT%20${Date.now()}`;
            
            // Set the image URL input
            document.getElementById('custom-image').value = placeholderImageUrl;
            
            // Show success notification
            window.notificationHandler.showNotification({
                title: 'สำเร็จ',
                message: 'อัพโหลดรูปภาพเรียบร้อยแล้ว',
                type: 'success'
            });
            
            // Clear file input
            fileInput.value = '';
            
        }, 2000); // Simulate 2 second upload
        
    } catch (error) {
        console.error('Error uploading image:', error);
        
        // Hide upload status
        document.getElementById('upload-status').classList.add('d-none');
        
        showErrorAlert('ไม่สามารถอัพโหลดรูปภาพได้', error.message);
    }
}

/**
 * Refresh NFT details
 */
async function refreshNftDetails() {
    try {
        await loadNftDetails();
        
        // Show success notification
        window.notificationHandler.showNotification({
            title: 'สำเร็จ',
            message: 'รีเฟรชข้อมูล NFT เรียบร้อยแล้ว',
            type: 'success'
        });
        
    } catch (error) {
        console.error('Error refreshing NFT details:', error);
        showErrorAlert('ไม่สามารถรีเฟรชข้อมูล NFT ได้', error.message);
    }
}

/**
 * Get explorer URL for token
 */
function getExplorerUrl(address, type = 'address', networkId = '1') {
    const explorers = {
        '1': 'https://etherscan.io',
        '3': 'https://ropsten.etherscan.io',
        '4': 'https://rinkeby.etherscan.io',
        '5': 'https://goerli.etherscan.io',
        '42': 'https://kovan.etherscan.io',
        '56': 'https://bscscan.com',
        '97': 'https://testnet.bscscan.com',
        '137': 'https://polygonscan.com',
        '80001': 'https://mumbai.polygonscan.com'
    };
    
    const baseUrl = explorers[networkId] || explorers['1'];
    
    if (type === 'address') {
        return `${baseUrl}/address/${address}`;
    } else if (type === 'token') {
        return `${baseUrl}/token/${address}`;
    } else if (type === 'tx') {
        return `${baseUrl}/tx/${address}`;
    }
    
    return baseUrl;
}

/**
 * Connect wallet function (used by the connection alert)
 */
async function connectWallet() {
    try {
        await window.transactionHandler.init();
        initMyNftPage();
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