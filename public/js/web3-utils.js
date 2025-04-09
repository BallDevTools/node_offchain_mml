/**
 * Web3 Utility Functions
 */

/**
 * Format Ethereum address to shorter form (0x1234...5678)
 * @param {string} address - Ethereum address
 * @param {number} startChars - Number of characters at start (default: 6)
 * @param {number} endChars - Number of characters at end (default: 4)
 * @returns {string} Formatted address
 */
function formatAddress(address, startChars = 6, endChars = 4) {
    if (!address) return '';
    if (address.length <= startChars + endChars) return address;
    return `${address.substring(0, startChars)}...${address.substring(address.length - endChars)}`;
  }
  
  /**
   * Format amount to display with specific decimal places
   * @param {string|number} amount - Amount to format
   * @param {number} decimals - Number of decimal places (default: 2)
   * @returns {string} Formatted amount
   */
  function formatAmount(amount, decimals = 2) {
    if (!amount) return '0';
    return parseFloat(amount).toFixed(decimals);
  }
  
  /**
   * Convert Wei to Ether or other specified unit
   * @param {string|number} wei - Amount in wei
   * @param {string} unit - Unit to convert to (default: 'ether')
   * @returns {string} Converted amount
   */
  function fromWei(wei, unit = 'ether') {
    if (!window.web3) return '0';
    return window.web3.utils.fromWei(wei.toString(), unit);
  }
  
  /**
   * Convert Ether to Wei or other specified unit
   * @param {string|number} eth - Amount in ether
   * @param {string} unit - Unit to convert from (default: 'ether')
   * @returns {string} Converted amount in wei
   */
  function toWei(eth, unit = 'ether') {
    if (!window.web3) return '0';
    return window.web3.utils.toWei(eth.toString(), unit);
  }
  
  /**
   * Format timestamp to human-readable date and time
   * @param {number} timestamp - Unix timestamp (seconds)
   * @param {string} locale - Locale for formatting (default: 'th-TH')
   * @returns {string} Formatted date and time
   */
  function formatTimestamp(timestamp, locale = 'th-TH') {
    if (!timestamp) return '';
    const date = new Date(timestamp * 1000);
    return `${date.toLocaleDateString(locale)} ${date.toLocaleTimeString(locale)}`;
  }
  
  /**
   * Get blockchain explorer URL for address or transaction
   * @param {string} hash - Transaction hash or address
   * @param {string} type - Type of hash ('tx' or 'address')
   * @param {string} network - Network name or ID (default: current network)
   * @returns {string} Explorer URL
   */
  function getExplorerUrl(hash, type = 'tx', network) {
    if (!hash) return '';
  
    // Determine network if not provided
    if (!network && window.ethereum) {
      network = window.ethereum.networkVersion;
    }
  
    // Map network ID to explorer base URL
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
  
    const baseUrl = explorers[network] || explorers['1'];
    
    if (type === 'tx') {
      return `${baseUrl}/tx/${hash}`;
    } else if (type === 'address') {
      return `${baseUrl}/address/${hash}`;
    } else if (type === 'token') {
      return `${baseUrl}/token/${hash}`;
    }
    
    return baseUrl;
  }
  
  /**
   * Copy text to clipboard
   * @param {string} text - Text to copy
   * @returns {Promise<boolean>} Success status
   */
  async function copyToClipboard(text) {
    try {
      if (navigator.clipboard) {
        await navigator.clipboard.writeText(text);
        return true;
      } else {
        // Fallback for older browsers
        const textarea = document.createElement('textarea');
        textarea.value = text;
        textarea.style.position = 'fixed';
        document.body.appendChild(textarea);
        textarea.select();
        const success = document.execCommand('copy');
        document.body.removeChild(textarea);
        return success;
      }
    } catch (error) {
      console.error('Failed to copy text:', error);
      return false;
    }
  }
  
  /**
   * Check if address is valid Ethereum address
   * @param {string} address - Address to check
   * @returns {boolean} Is valid address
   */
  function isValidAddress(address) {
    if (!window.web3) return false;
    return window.web3.utils.isAddress(address);
  }
  
  /**
   * Get current network name
   * @returns {string} Network name
   */
  function getNetworkName(networkId) {
    const networks = {
      '1': 'Ethereum Mainnet',
      '3': 'Ropsten Testnet',
      '4': 'Rinkeby Testnet',
      '5': 'Goerli Testnet',
      '42': 'Kovan Testnet',
      '56': 'Binance Smart Chain',
      '97': 'BSC Testnet',
      '137': 'Polygon Mainnet',
      '80001': 'Mumbai Testnet'
    };
  
    // Use provided networkId or get from ethereum if available
    const id = networkId || (window.ethereum ? window.ethereum.networkVersion : null);
    return networks[id] || `Unknown Network (${id})`;
  }
  
  // Export all functions as global utilities
  window.web3Utils = {
    formatAddress,
    formatAmount,
    fromWei,
    toWei,
    formatTimestamp,
    getExplorerUrl,
    copyToClipboard,
    isValidAddress,
    getNetworkName
  };