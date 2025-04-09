const Web3 = require('web3');
const contractConfig = require('../config/contract-config');
const notificationService = require('./notification-service');

class Web3Service {
  constructor() {
    this.web3 = null;
    this.contract = null;
    this.usdtContract = null;
    this.initialized = false;
  }

  /**
   * Initialize Web3 connection and smart contract instances
   */
  async init() {
    if (this.initialized) return;

    try {
      // Initialize Web3 with provider
      this.web3 = new Web3(new Web3.providers.HttpProvider(contractConfig.rpcUrl));
      
      // Initialize contract instances
      this.contract = new this.web3.eth.Contract(
        contractConfig.contractABI,
        contractConfig.contractAddress
      );
      
      this.usdtContract = new this.web3.eth.Contract(
        contractConfig.usdtABI,
        contractConfig.usdtAddress
      );
      
      this.initialized = true;
      console.log('Web3 service initialized successfully');
    } catch (error) {
      console.error('Failed to initialize Web3 service:', error);
      throw error;
    }
  }

  /**
   * Get user account from browser's Web3 provider
   */
  async getAccounts() {
    try {
      if (window.ethereum) {
        await window.ethereum.request({ method: 'eth_requestAccounts' });
        return await this.web3.eth.getAccounts();
      } else {
        throw new Error('No Ethereum provider detected');
      }
    } catch (error) {
      console.error('Error getting accounts:', error);
      throw error;
    }
  }

  /**
   * Get current user's account
   */
  async getCurrentAccount() {
    const accounts = await this.getAccounts();
    return accounts[0];
  }

  /**
   * Get USDT balance for a given address
   */
  async getUSDTBalance(address) {
    try {
      const balance = await this.usdtContract.methods.balanceOf(address).call();
      const decimals = await this.usdtContract.methods.decimals().call();
      return balance / (10 ** decimals);
    } catch (error) {
      console.error('Error getting USDT balance:', error);
      throw error;
    }
  }

  /**
   * Check if USDT allowance is sufficient for a given amount
   */
  async checkAllowance(ownerAddress, spenderAddress, amount) {
    try {
      const allowance = await this.usdtContract.methods.allowance(ownerAddress, spenderAddress).call();
      const decimals = await this.usdtContract.methods.decimals().call();
      const requiredAmount = amount * (10 ** decimals);
      return BigInt(allowance) >= BigInt(requiredAmount);
    } catch (error) {
      console.error('Error checking allowance:', error);
      throw error;
    }
  }

  /**
   * Approve USDT spending
   */
  async approveUSDT(spenderAddress, amount, from) {
    try {
      const decimals = await this.usdtContract.methods.decimals().call();
      const amountInWei = BigInt(amount * (10 ** decimals));
      
      // Send notification that transaction is being prepared
      notificationService.sendTransactionUpdate({
        type: 'prepare',
        status: 'pending',
        message: 'กำลังเตรียมอนุมัติการใช้ USDT',
        txType: 'approve'
      }, from);
      
      const receipt = await this.usdtContract.methods.approve(spenderAddress, amountInWei.toString()).send({
        from: from,
        gas: contractConfig.gasLimit,
        gasPrice: contractConfig.gasPrice
      });
      
      // Send notification that transaction is complete
      notificationService.sendTransactionUpdate({
        type: 'complete',
        status: 'success',
        message: 'อนุมัติการใช้ USDT สำเร็จ',
        txHash: receipt.transactionHash,
        txType: 'approve'
      }, from);
      
      return receipt;
    } catch (error) {
      // Send notification of failure
      notificationService.sendTransactionUpdate({
        type: 'error',
        status: 'failed',
        message: 'อนุมัติการใช้ USDT ไม่สำเร็จ: ' + error.message,
        txType: 'approve'
      }, from);
      
      console.error('Error approving USDT:', error);
      throw error;
    }
  }

  /**
   * Register a new member
   */
  async registerMember(planId, upline, from) {
    try {
      // Send notification that transaction is being prepared
      notificationService.sendTransactionUpdate({
        type: 'prepare',
        status: 'pending',
        message: 'กำลังดำเนินการลงทะเบียนสมาชิก',
        txType: 'register'
      }, from);
      
      const receipt = await this.contract.methods.registerMember(planId, upline).send({
        from: from,
        gas: contractConfig.gasLimit,
        gasPrice: contractConfig.gasPrice
      });
      
      // Send notification that transaction is complete
      notificationService.sendTransactionUpdate({
        type: 'complete',
        status: 'success',
        message: 'ลงทะเบียนสมาชิกสำเร็จ',
        txHash: receipt.transactionHash,
        txType: 'register'
      }, from);
      
      return receipt;
    } catch (error) {
      // Send notification of failure
      notificationService.sendTransactionUpdate({
        type: 'error',
        status: 'failed',
        message: 'ลงทะเบียนสมาชิกไม่สำเร็จ: ' + error.message,
        txType: 'register'
      }, from);
      
      console.error('Error registering member:', error);
      throw error;
    }
  }

  /**
   * Upgrade membership plan
   */
  async upgradePlan(newPlanId, from) {
    try {
      // Send notification that transaction is being prepared
      notificationService.sendTransactionUpdate({
        type: 'prepare',
        status: 'pending',
        message: 'กำลังดำเนินการอัพเกรดแผนสมาชิก',
        txType: 'upgrade'
      }, from);
      
      const receipt = await this.contract.methods.upgradePlan(newPlanId).send({
        from: from,
        gas: contractConfig.gasLimit,
        gasPrice: contractConfig.gasPrice
      });
      
      // Send notification that transaction is complete
      notificationService.sendTransactionUpdate({
        type: 'complete',
        status: 'success',
        message: 'อัพเกรดแผนสมาชิกสำเร็จ',
        txHash: receipt.transactionHash,
        txType: 'upgrade'
      }, from);
      
      return receipt;
    } catch (error) {
      // Send notification of failure
      notificationService.sendTransactionUpdate({
        type: 'error',
        status: 'failed',
        message: 'อัพเกรดแผนสมาชิกไม่สำเร็จ: ' + error.message,
        txType: 'upgrade'
      }, from);
      
      console.error('Error upgrading plan:', error);
      throw error;
    }
  }

  /**
   * Exit membership
   */
  async exitMembership(from) {
    try {
      // Send notification that transaction is being prepared
      notificationService.sendTransactionUpdate({
        type: 'prepare',
        status: 'pending',
        message: 'กำลังดำเนินการยกเลิกสมาชิก',
        txType: 'exit'
      }, from);
      
      const receipt = await this.contract.methods.exitMembership().send({
        from: from,
        gas: contractConfig.gasLimit,
        gasPrice: contractConfig.gasPrice
      });
      
      // Send notification that transaction is complete
      notificationService.sendTransactionUpdate({
        type: 'complete',
        status: 'success',
        message: 'ยกเลิกสมาชิกสำเร็จ',
        txHash: receipt.transactionHash,
        txType: 'exit'
      }, from);
      
      return receipt;
    } catch (error) {
      // Send notification of failure
      notificationService.sendTransactionUpdate({
        type: 'error',
        status: 'failed',
        message: 'ยกเลิกสมาชิกไม่สำเร็จ: ' + error.message,
        txType: 'exit'
      }, from);
      
      console.error('Error exiting membership:', error);
      throw error;
    }
  }

  /**
   * Get plan details
   */
  async getPlanDetails(planId) {
    try {
      const plan = await this.contract.methods.plans(planId).call();
      return {
        price: plan.price,
        name: plan.name,
        membersPerCycle: plan.membersPerCycle,
        isActive: plan.isActive
      };
    } catch (error) {
      console.error('Error getting plan details:', error);
      throw error;
    }
  }

  /**
   * Get member details
   */
  async getMemberDetails(address) {
    try {
      const member = await this.contract.methods.members(address).call();
      return {
        upline: member.upline,
        totalReferrals: member.totalReferrals,
        totalEarnings: member.totalEarnings,
        planId: member.planId,
        cycleNumber: member.cycleNumber,
        registeredAt: member.registeredAt
      };
    } catch (error) {
      console.error('Error getting member details:', error);
      throw error;
    }
  }

  /**
   * Get NFT details
   */
  async getNFTDetails(address) {
    try {
      // Check if user has NFT
      const balance = await this.contract.methods.balanceOf(address).call();
      if (balance === '0') {
        return null;
      }
      
      // Get token ID
      const tokenId = await this.contract.methods.tokenOfOwnerByIndex(address, 0).call();
      
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
      console.error('Error getting NFT details:', error);
      throw error;
    }
  }

  /**
   * Set NFT image
   */
  async setNFTImage(imageURI, name, description, from) {
    try {
      // Send notification that transaction is being prepared
      notificationService.sendTransactionUpdate({
        type: 'prepare',
        status: 'pending',
        message: 'กำลังดำเนินการอัพเดตรูปภาพ NFT',
        txType: 'setImage'
      }, from);
      
      const receipt = await this.contract.methods.setMyNFTImage(imageURI, name, description).send({
        from: from,
        gas: contractConfig.gasLimit,
        gasPrice: contractConfig.gasPrice
      });
      
      // Send notification that transaction is complete
      notificationService.sendTransactionUpdate({
        type: 'complete',
        status: 'success',
        message: 'อัพเดตรูปภาพ NFT สำเร็จ',
        txHash: receipt.transactionHash,
        txType: 'setImage'
      }, from);
      
      return receipt;
    } catch (error) {
      // Send notification of failure
      notificationService.sendTransactionUpdate({
        type: 'error',
        status: 'failed',
        message: 'อัพเดตรูปภาพ NFT ไม่สำเร็จ: ' + error.message,
        txType: 'setImage'
      }, from);
      
      console.error('Error setting NFT image:', error);
      throw error;
    }
  }

  /**
   * Get all plans
   */
  async getAllPlans() {
    try {
      const planCount = await this.contract.methods.planCount().call();
      const plans = [];
      
      for (let i = 1; i <= planCount; i++) {
        const plan = await this.getPlanDetails(i);
        const cycleInfo = await this.contract.methods.getPlanCycleInfo(i).call();
        plans.push({
          id: i,
          ...plan,
          currentCycle: cycleInfo.currentCycle,
          membersInCurrentCycle: cycleInfo.membersInCurrentCycle
        });
      }
      
      return plans;
    } catch (error) {
      console.error('Error getting all plans:', error);
      throw error;
    }
  }

  /**
   * Get member transactions
   */
  async getMemberTransactions(address) {
    try {
      const transactions = await this.contract.methods.getMemberTransactions(address).call();
      return transactions.map(tx => ({
        from: tx.from,
        to: tx.to,
        amount: tx.amount,
        timestamp: tx.timestamp,
        txType: tx.txType
      }));
    } catch (error) {
      console.error('Error getting member transactions:', error);
      throw error;
    }
  }

  /**
   * Get system stats
   */
  async getSystemStats() {
    try {
      const stats = await this.contract.methods.getSystemStats().call();
      return {
        totalMembers: stats.totalMembers,
        totalRevenue: stats.totalRevenue,
        totalCommission: stats.totalCommission,
        ownerFunds: stats.ownerFunds,
        feeFunds: stats.feeFunds,
        fundFunds: stats.fundFunds
      };
    } catch (error) {
      console.error('Error getting system stats:', error);
      throw error;
    }
  }
}

// Create singleton instance
const web3Service = new Web3Service();

module.exports = web3Service;