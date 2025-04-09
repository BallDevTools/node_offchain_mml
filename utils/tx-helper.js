/**
 * Utility functions for transaction handling on the server side
 */
const Web3 = require('web3');
const contractConfig = require('../config/contract-config');

/**
 * Format amount to display with specific decimal places
 * @param {string|number} amount - Amount to format
 * @param {number} decimals - Number of decimal places
 * @returns {string} Formatted amount
 */
function formatAmount(amount, decimals = 2) {
  if (!amount) return '0';
  return parseFloat(amount).toFixed(decimals);
}

/**
 * Convert Wei to Ether or other specified unit
 * @param {string|number} wei - Amount in wei
 * @param {string} unit - Unit to convert to
 * @returns {string} Converted amount
 */
function fromWei(wei, unit = 'ether') {
  if (!wei) return '0';
  const web3 = new Web3();
  return web3.utils.fromWei(wei.toString(), unit);
}

/**
 * Convert Ether to Wei or other specified unit
 * @param {string|number} eth - Amount in ether
 * @param {string} unit - Unit to convert from
 * @returns {string} Converted amount in wei
 */
function toWei(eth, unit = 'ether') {
  if (!eth) return '0';
  const web3 = new Web3();
  return web3.utils.toWei(eth.toString(), unit);
}

/**
 * Format Ethereum address to shorter form
 * @param {string} address - Ethereum address
 * @param {number} startChars - Number of characters at start
 * @param {number} endChars - Number of characters at end
 * @returns {string} Formatted address
 */
function formatAddress(address, startChars = 6, endChars = 4) {
  if (!address) return '';
  if (address.length <= startChars + endChars) return address;
  return `${address.substring(0, startChars)}...${address.substring(address.length - endChars)}`;
}

/**
 * Get blockchain explorer URL for address or transaction
 * @param {string} hash - Transaction hash or address
 * @param {string} type - Type of hash ('tx' or 'address')
 * @param {string} networkId - Network ID
 * @returns {string} Explorer URL
 */
function getExplorerUrl(hash, type = 'tx', networkId = contractConfig.networkId) {
  if (!hash) return '';

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

  const baseUrl = explorers[networkId] || explorers['1'];
  
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
 * Check if address is valid Ethereum address
 * @param {string} address - Address to check
 * @returns {boolean} Is valid address
 */
function isValidAddress(address) {
  if (!address) return false;
  const web3 = new Web3();
  return web3.utils.isAddress(address);
}

/**
 * Format timestamp to human-readable date and time
 * @param {number} timestamp - Unix timestamp (seconds)
 * @returns {string} Formatted date and time
 */
function formatTimestamp(timestamp) {
  if (!timestamp) return '';
  const date = new Date(timestamp * 1000);
  return date.toLocaleString('th-TH');
}

/**
 * Get network name from network ID
 * @param {string} networkId - Network ID
 * @returns {string} Network name
 */
function getNetworkName(networkId = contractConfig.networkId) {
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

  return networks[networkId] || `Unknown Network (${networkId})`;
}

/**
 * Estimate gas limit for a transaction with buffer
 * @param {Object} tx - Transaction object
 * @param {string} from - Sender address
 * @param {Object} web3 - Web3 instance
 * @param {number} buffer - Buffer percentage (default: 20%)
 * @returns {number} Estimated gas limit with buffer
 */
async function estimateGasWithBuffer(tx, from, web3, buffer = 20) {
  try {
    const gasEstimate = await web3.eth.estimateGas({
      ...tx,
      from
    });
    
    // Add buffer to the gas estimate
    const gasWithBuffer = Math.ceil(gasEstimate * (1 + buffer / 100));
    
    // Ensure gas limit does not exceed block gas limit
    const block = await web3.eth.getBlock('latest');
    const maxGasLimit = block.gasLimit;
    
    return Math.min(gasWithBuffer, maxGasLimit);
  } catch (error) {
    console.error('Error estimating gas:', error);
    return contractConfig.gasLimit; // Fallback to default gas limit
  }
}

module.exports = {
  formatAmount,
  fromWei,
  toWei,
  formatAddress,
  getExplorerUrl,
  isValidAddress,
  formatTimestamp,
  getNetworkName,
  estimateGasWithBuffer
};