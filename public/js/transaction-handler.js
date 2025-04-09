/**
 * Handle transactions and interactions with the smart contract
 */
class TransactionHandler {
    constructor() {
      this.web3 = null;
      this.accounts = [];
      this.currentAccount = null;
      this.contract = null;
      this.usdtContract = null;
      this.socket = null;
      this.pendingTransactions = {};
      this.initialized = false;
    }
  
    /**
     * Initialize the transaction handler
     */
    async init() {
      if (this.initialized) return;
  
      try {
        // Initialize socket.io connection
        this.socket = io();
        this._setupSocketListeners();
  
        // Initialize Web3
        if (window.ethereum) {
          this.web3 = new Web3(window.ethereum);
          
          // Request account access if needed
          await window.ethereum.request({ method: 'eth_requestAccounts' });
          
          // Get accounts
          const accounts = await this.web3.eth.getAccounts();
          this.accounts = accounts;
          this.currentAccount = accounts[0];
          
          // Initialize contract instances
          const config = await this._loadConfig();
          this.contract = new this.web3.eth.Contract(config.contractABI, config.contractAddress);
          this.usdtContract = new this.web3.eth.Contract(config.usdtABI, config.usdtAddress);
          
          // Subscribe to the user's room for notifications
          this.socket.emit('subscribe', `user:${this.currentAccount}`);
          
          // Set up event listeners for account changes
          window.ethereum.on('accountsChanged', (accounts) => {
            this.accounts = accounts;
            this.currentAccount = accounts[0];
            
            // Update subscription to the user's room
            this.socket.emit('unsubscribe', `user:${this.currentAccount}`);
            this.socket.emit('subscribe', `user:${this.currentAccount}`);
            
            // Trigger event for UI to update
            window.dispatchEvent(new CustomEvent('accountChanged', { detail: accounts[0] }));
          });
          
          this.initialized = true;
          
          // Trigger initialization completed event
          window.dispatchEvent(new CustomEvent('transactionHandlerInitialized'));
          
          return true;
        } else {
          alert('MetaMask หรือ Web3 Wallet จำเป็นต้องใช้งานแอปพลิเคชัน โปรดติดตั้ง MetaMask และเชื่อมต่อกับเว็บไซต์');
          return false;
        }
      } catch (error) {
        console.error('Error initializing transaction handler', error);
        alert(`ไม่สามารถเชื่อมต่อกับ wallet ได้: ${error.message}`);
        return false;
      }
    }
  
    /**
     * Set up socket listeners for real-time notifications
     */
    _setupSocketListeners() {
      this.socket.on('transaction-update', (update) => {
        console.log('Transaction update received:', update);
        
        // Update pending transactions
        if (update.type === 'prepare') {
          this.pendingTransactions[update.txType] = {
            status: update.status,
            message: update.message,
            timestamp: update.timestamp
          };
        } else if (update.type === 'complete' || update.type === 'error') {
          delete this.pendingTransactions[update.txType];
        }
        
        // Dispatch event for UI to handle
        window.dispatchEvent(new CustomEvent('transactionUpdate', {
          detail: update
        }));
      });
      
      this.socket.on('notification', (notification) => {
        console.log('Notification received:', notification);
        
        // Dispatch event for UI to handle
        window.dispatchEvent(new CustomEvent('notification', {
          detail: notification
        }));
      });
      
      // Connection status events
      this.socket.on('connect', () => {
        console.log('Socket connected');
        window.dispatchEvent(new CustomEvent('socketConnected'));
      });
      
      this.socket.on('disconnect', () => {
        console.log('Socket disconnected');
        window.dispatchEvent(new CustomEvent('socketDisconnected'));
      });
    }
  
    /**
     * Load contract configuration
     */
    async _loadConfig() {
      try {
        const response = await fetch('/api/contract-config');
        return await response.json();
      } catch (error) {
        console.error('Error loading contract config', error);
        throw error;
      }
    }
  
    /**
     * Get USDT balance for current account
     */
    async getUSDTBalance() {
      try {
        if (!this.initialized) await this.init();
        
        const balance = await this.usdtContract.methods.balanceOf(this.currentAccount).call();
        const decimals = await this.usdtContract.methods.decimals().call();
        return balance / (10 ** decimals);
      } catch (error) {
        console.error('Error getting USDT balance', error);
        throw error;
      }
    }
  
    /**
     * Check if current account has enough USDT allowance
     */
    async checkAllowance(amount) {
      try {
        if (!this.initialized) await this.init();
        
        const allowance = await this.usdtContract.methods.allowance(
          this.currentAccount,
          this.contract.options.address
        ).call();
        
        const decimals = await this.usdtContract.methods.decimals().call();
        const requiredAmount = amount * (10 ** decimals);
        
        return BigInt(allowance) >= BigInt(requiredAmount);
      } catch (error) {
        console.error('Error checking allowance', error);
        throw error;
      }
    }
  
    /**
     * Approve USDT spending
     */
    async approveUSDT(amount) {
      try {
        if (!this.initialized) await this.init();
        
        // Show loading UI
        window.dispatchEvent(new CustomEvent('transactionStarted', {
          detail: {
            type: 'approve',
            message: 'กำลังอนุมัติการใช้ USDT...'
          }
        }));
        
        const decimals = await this.usdtContract.methods.decimals().call();
        const amountInWei = BigInt(amount * (10 ** decimals));
        
        const receipt = await this.usdtContract.methods.approve(
          this.contract.options.address,
          amountInWei.toString()
        ).send({
          from: this.currentAccount
        });
        
        // Show success UI
        window.dispatchEvent(new CustomEvent('transactionCompleted', {
          detail: {
            type: 'approve',
            success: true,
            receipt: receipt,
            message: 'อนุมัติการใช้ USDT สำเร็จ'
          }
        }));
        
        return receipt;
      } catch (error) {
        console.error('Error approving USDT', error);
        
        // Show error UI
        window.dispatchEvent(new CustomEvent('transactionCompleted', {
          detail: {
            type: 'approve',
            success: false,
            error: error,
            message: 'อนุมัติการใช้ USDT ไม่สำเร็จ: ' + error.message
          }
        }));
        
        throw error;
      }
    }
  
    /**
     * Register as a new member
     */
    async registerMember(planId, upline) {
      try {
        if (!this.initialized) await this.init();
        
        // Get plan price
        const plan = await this.contract.methods.plans(planId).call();
        const planPrice = plan.price;
        
        // Check if user has enough USDT
        const balance = await this.usdtContract.methods.balanceOf(this.currentAccount).call();
        if (BigInt(balance) < BigInt(planPrice)) {
          throw new Error('USDT ไม่เพียงพอ');
        }
        
        // Check if user has approved enough USDT
        const hasApproved = await this.checkAllowance(planPrice);
        if (!hasApproved) {
          await this.approveUSDT(planPrice);
        }
        
        // Show loading UI
        window.dispatchEvent(new CustomEvent('transactionStarted', {
          detail: {
            type: 'register',
            message: 'กำลังลงทะเบียนสมาชิก...'
          }
        }));
        
        // Register member
        const receipt = await this.contract.methods.registerMember(planId, upline || '0x0000000000000000000000000000000000000000').send({
          from: this.currentAccount
        });
        
        // Show success UI
        window.dispatchEvent(new CustomEvent('transactionCompleted', {
          detail: {
            type: 'register',
            success: true,
            receipt: receipt,
            message: 'ลงทะเบียนสมาชิกสำเร็จ'
          }
        }));
        
        return receipt;
      } catch (error) {
        console.error('Error registering member', error);
        
        // Show error UI
        window.dispatchEvent(new CustomEvent('transactionCompleted', {
          detail: {
            type: 'register',
            success: false,
            error: error,
            message: 'ลงทะเบียนสมาชิกไม่สำเร็จ: ' + error.message
          }
        }));
        
        throw error;
      }
    }
  
    /**
     * Upgrade membership plan
     */
    async upgradePlan(newPlanId) {
      try {
        if (!this.initialized) await this.init();
        
        // Get current plan and new plan
        const member = await this.contract.methods.members(this.currentAccount).call();
        const currentPlan = await this.contract.methods.plans(member.planId).call();
        const newPlan = await this.contract.methods.plans(newPlanId).call();
        
        // Calculate price difference
        const priceDifference = BigInt(newPlan.price) - BigInt(currentPlan.price);
        
        // Check if user has enough USDT
        const balance = await this.usdtContract.methods.balanceOf(this.currentAccount).call();
        if (BigInt(balance) < priceDifference) {
          throw new Error('USDT ไม่เพียงพอ');
        }
        
        // Check if user has approved enough USDT
        const hasApproved = await this.checkAllowance(priceDifference);
        if (!hasApproved) {
          await this.approveUSDT(priceDifference);
        }
        
        // Show loading UI
        window.dispatchEvent(new CustomEvent('transactionStarted', {
          detail: {
            type: 'upgrade',
            message: 'กำลังอัพเกรดแผนสมาชิก...'
          }
        }));
        
        // Upgrade plan
        const receipt = await this.contract.methods.upgradePlan(newPlanId).send({
          from: this.currentAccount
        });
        
        // Show success UI
        window.dispatchEvent(new CustomEvent('transactionCompleted', {
          detail: {
            type: 'upgrade',
            success: true,
            receipt: receipt,
            message: 'อัพเกรดแผนสมาชิกสำเร็จ'
          }
        }));
        
        return receipt;
      } catch (error) {
        console.error('Error upgrading plan', error);
        
        // Show error UI
        window.dispatchEvent(new CustomEvent('transactionCompleted', {
          detail: {
            type: 'upgrade',
            success: false,
            error: error,
            message: 'อัพเกรดแผนสมาชิกไม่สำเร็จ: ' + error.message
          }
        }));
        
        throw error;
      }
    }
  
    /**
     * Exit membership
     */
    async exitMembership() {
      try {
        if (!this.initialized) await this.init();
        
        // Show loading UI
        window.dispatchEvent(new CustomEvent('transactionStarted', {
          detail: {
            type: 'exit',
            message: 'กำลังยกเลิกสมาชิก...'
          }
        }));
        
        // Exit membership
        const receipt = await this.contract.methods.exitMembership().send({
          from: this.currentAccount
        });
        
        // Show success UI
        window.dispatchEvent(new CustomEvent('transactionCompleted', {
          detail: {
            type: 'exit',
            success: true,
            receipt: receipt,
            message: 'ยกเลิกสมาชิกสำเร็จ'
          }
        }));
        
        return receipt;
      } catch (error) {
        console.error('Error exiting membership', error);
        
        // Show error UI
        window.dispatchEvent(new CustomEvent('transactionCompleted', {
          detail: {
            type: 'exit',
            success: false,
            error: error,
            message: 'ยกเลิกสมาชิกไม่สำเร็จ: ' + error.message
          }
        }));
        
        throw error;
      }
    }
  
    /**
     * Set NFT image
     */
    async setNFTImage(imageURI, name, description) {
      try {
        if (!this.initialized) await this.init();
        
        // Show loading UI
        window.dispatchEvent(new CustomEvent('transactionStarted', {
          detail: {
            type: 'setImage',
            message: 'กำลังอัพเดตรูปภาพ NFT...'
          }
        }));
        
        // Set NFT image
        const receipt = await this.contract.methods.setMyNFTImage(imageURI, name, description).send({
          from: this.currentAccount
        });
        
        // Show success UI
        window.dispatchEvent(new CustomEvent('transactionCompleted', {
          detail: {
            type: 'setImage',
            success: true,
            receipt: receipt,
            message: 'อัพเดตรูปภาพ NFT สำเร็จ'
          }
        }));
        
        return receipt;
      } catch (error) {
        console.error('Error setting NFT image', error);
        
        // Show error UI
        window.dispatchEvent(new CustomEvent('transactionCompleted', {
          detail: {
            type: 'setImage',
            success: false,
            error: error,
            message: 'อัพเดตรูปภาพ NFT ไม่สำเร็จ: ' + error.message
          }
        }));
        
        throw error;
      }
    }
  
    /**
     * Get member details
     */
    async getMemberDetails() {
      try {
        if (!this.initialized) await this.init();
        
        const member = await this.contract.methods.members(this.currentAccount).call();
        return {
          upline: member.upline,
          totalReferrals: member.totalReferrals,
          totalEarnings: member.totalEarnings,
          planId: member.planId,
          cycleNumber: member.cycleNumber,
          registeredAt: member.registeredAt
        };
      } catch (error) {
        console.error('Error getting member details', error);
        throw error;
      }
    }
  
    /**
     * Get NFT details
     */
    async getNFTDetails() {
      try {
        if (!this.initialized) await this.init();
        
        // Check if user has NFT
        const balance = await this.contract.methods.balanceOf(this.currentAccount).call();
        if (balance === '0') {
          return null;
        }
        
        // Get token ID
        const tokenId = await this.contract.methods.tokenOfOwnerByIndex(this.currentAccount, 0).call();
        
        // Get token URI and other details
        const tokenURI = await this.contract.methods.tokenURI(tokenId).call();
        const nftImage = await this.contract.methods.getNFTImage(tokenId).call();
        
        return {
          tokenId,
          tokenURI,
          imageURI: nftImage.imageURI,
          name: nftImage.name,
          description: nftImage.description,
          planId: nftImage.planId
        };
      } catch (error) {
        console.error('Error getting NFT details', error);
        throw error;
      }
    }
  
    /**
     * Get member transactions
     */
    async getMemberTransactions() {
      try {
        if (!this.initialized) await this.init();
        
        const transactions = await this.contract.methods.getMemberTransactions(this.currentAccount).call();
        return transactions.map(tx => ({
          from: tx.from,
          to: tx.to,
          amount: tx.amount,
          timestamp: tx.timestamp,
          txType: tx.txType
        }));
      } catch (error) {
        console.error('Error getting member transactions', error);
        throw error;
      }
    }
  
    /**
     * Get all plans
     */
    async getAllPlans() {
      try {
        if (!this.initialized) await this.init();
        
        const planCount = await this.contract.methods.planCount().call();
        const plans = [];
        
        for (let i = 1; i <= planCount; i++) {
          try {
            const plan = await this.contract.methods.plans(i).call();
            const cycleInfo = await this.contract.methods.getPlanCycleInfo(i).call();
            
            plans.push({
              id: i,
              price: plan.price,
              name: plan.name,
              membersPerCycle: plan.membersPerCycle,
              isActive: plan.isActive,
              currentCycle: cycleInfo.currentCycle,
              membersInCurrentCycle: cycleInfo.membersInCurrentCycle
            });
          } catch (err) {
            console.error(`Error getting plan ${i}`, err);
          }
        }
        
        return plans;
      } catch (error) {
        console.error('Error getting all plans', error);
        throw error;
      }
    }
  
    /**
     * Get current pending transactions
     */
    getPendingTransactions() {
      return Object.entries(this.pendingTransactions).map(([txType, data]) => ({
        txType,
        ...data
      }));
    }
  }
  
  // Create global instance
  window.transactionHandler = new TransactionHandler();