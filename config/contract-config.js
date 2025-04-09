/**
 * Smart Contract Configuration
 */
const config = {
    // Contract addresses
    contractAddress: process.env.CONTRACT_ADDRESS || '0x123456789...',
    usdtAddress: process.env.USDT_ADDRESS || '0x987654321...',
    
    // Network configuration
    networkId: process.env.NETWORK_ID || '1', // 1: Mainnet, 4: Rinkeby, etc.
    rpcUrl: process.env.RPC_URL || 'https://mainnet.infura.io/v3/YOUR_INFURA_KEY',
    
    // Gas settings
    gasPrice: process.env.GAS_PRICE || '5000000000', // 5 Gwei
    gasLimit: process.env.GAS_LIMIT || '3000000',
    
    // Transaction confirmation settings
    confirmationBlocks: process.env.CONFIRMATION_BLOCKS || 2,
    
    // Timeout settings (in milliseconds)
    txTimeout: process.env.TX_TIMEOUT || 120000, // 2 minutes
    
    // Plan IDs map to readable names
    planNames: {
      '1': 'Starter',
      '2': 'Explorer',
      '3': 'Trader',
      '4': 'Investor',
      '5': 'Elite',
      '6': 'Whale',
      '7': 'Titan',
      '8': 'Mogul',
      '9': 'Tycoon',
      '10': 'Legend',
      '11': 'Empire',
      '12': 'Visionary',
      '13': 'Mastermind',
      '14': 'Titanium',
      '15': 'Crypto Royalty',
      '16': 'Legacy'
    },
    
    // Contract ABI
    contractABI: [/* Paste your contract ABI here */],
    
    // USDT token ABI (ERC20 standard)
    usdtABI: [
      // Standard ERC20 functions
      {
        "constant": true,
        "inputs": [],
        "name": "name",
        "outputs": [{"name": "", "type": "string"}],
        "payable": false,
        "stateMutability": "view",
        "type": "function"
      },
      {
        "constant": true,
        "inputs": [],
        "name": "symbol",
        "outputs": [{"name": "", "type": "string"}],
        "payable": false,
        "stateMutability": "view",
        "type": "function"
      },
      {
        "constant": true,
        "inputs": [],
        "name": "decimals",
        "outputs": [{"name": "", "type": "uint8"}],
        "payable": false,
        "stateMutability": "view",
        "type": "function"
      },
      {
        "constant": true,
        "inputs": [{"name": "_owner", "type": "address"}],
        "name": "balanceOf",
        "outputs": [{"name": "balance", "type": "uint256"}],
        "payable": false,
        "stateMutability": "view",
        "type": "function"
      },
      {
        "constant": false,
        "inputs": [
          {"name": "_to", "type": "address"},
          {"name": "_value", "type": "uint256"}
        ],
        "name": "transfer",
        "outputs": [{"name": "", "type": "bool"}],
        "payable": false,
        "stateMutability": "nonpayable",
        "type": "function"
      },
      {
        "constant": false,
        "inputs": [
          {"name": "_spender", "type": "address"},
          {"name": "_value", "type": "uint256"}
        ],
        "name": "approve",
        "outputs": [{"name": "", "type": "bool"}],
        "payable": false,
        "stateMutability": "nonpayable",
        "type": "function"
      },
      {
        "constant": true,
        "inputs": [
          {"name": "_owner", "type": "address"},
          {"name": "_spender", "type": "address"}
        ],
        "name": "allowance",
        "outputs": [{"name": "", "type": "uint256"}],
        "payable": false,
        "stateMutability": "view",
        "type": "function"
      }
    ]
  };
  
  module.exports = config;