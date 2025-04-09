/**
 * Notification handler for UI
 */
class NotificationHandler {
    constructor() {
      this.notificationContainer = null;
      this.toast = null;
      this.socket = null;
      this.pendingTransactions = {};
      this.initialized = false;
      this.notificationCount = 0;
      this.maxNotifications = 5;
    }
  
    /**
     * Initialize the notification handler
     */
    init() {
      if (this.initialized) return;
  
      // Create notification container if it doesn't exist
      if (!document.getElementById('notification-container')) {
        this.notificationContainer = document.createElement('div');
        this.notificationContainer.id = 'notification-container';
        this.notificationContainer.className = 'position-fixed top-0 end-0 p-3';
        this.notificationContainer.style.zIndex = '9999';
        document.body.appendChild(this.notificationContainer);
      } else {
        this.notificationContainer = document.getElementById('notification-container');
      }
  
      // Set up event listeners
      window.addEventListener('transactionUpdate', (event) => {
        this.handleTransactionUpdate(event.detail);
      });
  
      window.addEventListener('notification', (event) => {
        this.showNotification(event.detail);
      });
  
      window.addEventListener('transactionStarted', (event) => {
        this.showTransactionStarted(event.detail);
      });
  
      window.addEventListener('transactionCompleted', (event) => {
        this.showTransactionCompleted(event.detail);
      });
  
      this.initialized = true;
      console.log('Notification handler initialized');
    }
  
    /**
     * Handle transaction status updates from socket
     */
    handleTransactionUpdate(update) {
      if (update.type === 'prepare') {
        this.pendingTransactions[update.txType] = {
          status: update.status,
          message: update.message,
          timestamp: update.timestamp
        };
        
        this.showTxPending(update);
      } else if (update.type === 'complete') {
        delete this.pendingTransactions[update.txType];
        this.showTxSuccess(update);
      } else if (update.type === 'error') {
        delete this.pendingTransactions[update.txType];
        this.showTxError(update);
      }
    }
  
    /**
     * Show transaction started notification
     */
    showTransactionStarted(data) {
      const { type, message } = data;
      
      this.showNotification({
        title: 'กำลังดำเนินการ',
        message: message || 'กำลังดำเนินการทำธุรกรรม โปรดรอสักครู่...',
        type: 'info',
        autohide: false,
        txType: type
      });
    }
  
    /**
     * Show transaction completed notification
     */
    showTransactionCompleted(data) {
      const { type, success, message } = data;
      
      if (success) {
        this.showNotification({
          title: 'สำเร็จ',
          message: message || 'ทำธุรกรรมสำเร็จ',
          type: 'success',
          autohide: true,
          delay: 5000,
          txType: type
        });
      } else {
        this.showNotification({
          title: 'ไม่สำเร็จ',
          message: message || 'ทำธุรกรรมไม่สำเร็จ',
          type: 'danger',
          autohide: true,
          delay: 8000,
          txType: type
        });
      }
    }
  
    /**
     * Show transaction pending notification
     */
    showTxPending(update) {
      this.showNotification({
        title: 'กำลังดำเนินการ',
        message: update.message || 'กำลังดำเนินการทำธุรกรรม โปรดรอสักครู่...',
        type: 'info',
        autohide: false,
        txType: update.txType
      });
    }
  
    /**
     * Show transaction success notification
     */
    showTxSuccess(update) {
      this.showNotification({
        title: 'สำเร็จ',
        message: update.message || 'ทำธุรกรรมสำเร็จ',
        type: 'success',
        autohide: true,
        delay: 5000,
        txType: update.txType,
        txHash: update.txHash
      });
    }
  
    /**
     * Show transaction error notification
     */
    showTxError(update) {
      this.showNotification({
        title: 'ไม่สำเร็จ',
        message: update.message || 'ทำธุรกรรมไม่สำเร็จ',
        type: 'danger',
        autohide: true,
        delay: 8000,
        txType: update.txType
      });
    }
  
    /**
     * Show a notification toast
     */
    showNotification(options) {
      const {
        title,
        message,
        type = 'info',
        autohide = true,
        delay = 5000,
        txType,
        txHash
      } = options;
  
      // Remove previous notification with same txType if exists
      if (txType) {
        const existingNotifications = this.notificationContainer.querySelectorAll(`[data-tx-type="${txType}"]`);
        existingNotifications.forEach(el => el.remove());
      }
  
      // Limit maximum number of notifications
      if (this.notificationContainer.children.length >= this.maxNotifications) {
        this.notificationContainer.removeChild(this.notificationContainer.firstChild);
      }
  
      // Create toast element
      const id = `notification-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
      const toastEl = document.createElement('div');
      toastEl.className = `toast show`;
      toastEl.id = id;
      toastEl.setAttribute('role', 'alert');
      toastEl.setAttribute('aria-live', 'assertive');
      toastEl.setAttribute('aria-atomic', 'true');
      
      if (txType) {
        toastEl.setAttribute('data-tx-type', txType);
      }
  
      // Toast header
      const header = document.createElement('div');
      header.className = `toast-header text-white bg-${type}`;
      
      const titleEl = document.createElement('strong');
      titleEl.className = 'me-auto';
      titleEl.innerText = title;
      
      const closeButton = document.createElement('button');
      closeButton.className = 'btn-close';
      closeButton.setAttribute('type', 'button');
      closeButton.setAttribute('data-bs-dismiss', 'toast');
      closeButton.setAttribute('aria-label', 'Close');
      closeButton.onclick = () => {
        toastEl.remove();
      };
      
      header.appendChild(titleEl);
      header.appendChild(closeButton);
      
      // Toast body
      const body = document.createElement('div');
      body.className = 'toast-body';
      
      // Create message content
      const messageContent = document.createElement('div');
      messageContent.innerText = message;
      
      // Add transaction hash link if available
      if (txHash) {
        const txHashLink = document.createElement('div');
        txHashLink.className = 'mt-2 small';
        
        const link = document.createElement('a');
        link.href = `https://etherscan.io/tx/${txHash}`;
        link.target = '_blank';
        link.innerText = 'ดูรายละเอียดบน Etherscan';
        
        txHashLink.appendChild(link);
        messageContent.appendChild(txHashLink);
      }
      
      body.appendChild(messageContent);
      
      // Add progress spinner for pending transactions
      if (type === 'info' && !autohide) {
        const spinner = document.createElement('div');
        spinner.className = 'spinner-border spinner-border-sm text-primary mt-2';
        spinner.setAttribute('role', 'status');
        
        const spinnerText = document.createElement('span');
        spinnerText.className = 'ms-2 small';
        spinnerText.innerText = 'กำลังดำเนินการ...';
        
        const spinnerContainer = document.createElement('div');
        spinnerContainer.className = 'd-flex align-items-center';
        spinnerContainer.appendChild(spinner);
        spinnerContainer.appendChild(spinnerText);
        
        body.appendChild(spinnerContainer);
      }
      
      // Assemble toast
      toastEl.appendChild(header);
      toastEl.appendChild(body);
      
      // Add to container
      this.notificationContainer.appendChild(toastEl);
      
      // Auto-hide after delay if enabled
      if (autohide) {
        setTimeout(() => {
          if (document.getElementById(id)) {
            document.getElementById(id).remove();
          }
        }, delay);
      }
      
      return toastEl;
    }
  
    /**
     * Clear all notifications
     */
    clearAllNotifications() {
      while (this.notificationContainer.firstChild) {
        this.notificationContainer.removeChild(this.notificationContainer.firstChild);
      }
    }
  
    /**
     * Get all pending transactions
     */
    getPendingTransactions() {
      return Object.entries(this.pendingTransactions).map(([txType, data]) => ({
        txType,
        ...data
      }));
    }
  }
  
  // Create global instance
  window.notificationHandler = new NotificationHandler();
  
  // Initialize on DOM load
  document.addEventListener('DOMContentLoaded', () => {
    window.notificationHandler.init();
  });