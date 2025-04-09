/**
 * Common formatting utility functions
 */

/**
 * Format currency amount for display
 * @param {number|string} amount - Amount to format
 * @param {string} currency - Currency code
 * @param {string} locale - Locale for formatting
 * @returns {string} Formatted currency amount
 */
function formatCurrency(amount, currency = 'USD', locale = 'th-TH') {
    try {
      return new Intl.NumberFormat(locale, {
        style: 'currency',
        currency: currency,
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
      }).format(parseFloat(amount) || 0);
    } catch (error) {
      console.error('Error formatting currency:', error);
      return `${currency} ${parseFloat(amount || 0).toFixed(2)}`;
    }
  }
  
  /**
   * Format number with thousands separators
   * @param {number|string} number - Number to format
   * @param {number} decimals - Number of decimal places
   * @param {string} locale - Locale for formatting
   * @returns {string} Formatted number
   */
  function formatNumber(number, decimals = 2, locale = 'th-TH') {
    try {
      return new Intl.NumberFormat(locale, {
        minimumFractionDigits: decimals,
        maximumFractionDigits: decimals
      }).format(parseFloat(number) || 0);
    } catch (error) {
      console.error('Error formatting number:', error);
      return parseFloat(number || 0).toFixed(decimals);
    }
  }
  
  /**
   * Format date for display
   * @param {Date|string|number} date - Date to format
   * @param {Object} options - Intl.DateTimeFormat options
   * @param {string} locale - Locale for formatting
   * @returns {string} Formatted date
   */
  function formatDate(date, options = {}, locale = 'th-TH') {
    try {
      const dateObj = date instanceof Date ? date : new Date(date);
      
      const defaultOptions = {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      };
      
      return new Intl.DateTimeFormat(locale, { ...defaultOptions, ...options }).format(dateObj);
    } catch (error) {
      console.error('Error formatting date:', error);
      return String(date);
    }
  }
  
  /**
   * Format date and time for display
   * @param {Date|string|number} date - Date to format
   * @param {string} locale - Locale for formatting
   * @returns {string} Formatted date and time
   */
  function formatDateTime(date, locale = 'th-TH') {
    return formatDate(date, {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    }, locale);
  }
  
  /**
   * Format Unix timestamp for display
   * @param {number} timestamp - Unix timestamp (seconds)
   * @param {boolean} includeTime - Whether to include time
   * @param {string} locale - Locale for formatting
   * @returns {string} Formatted date and time
   */
  function formatTimestamp(timestamp, includeTime = true, locale = 'th-TH') {
    if (!timestamp) return '';
    
    // Convert to milliseconds if in seconds
    const milliseconds = timestamp.toString().length <= 10 
      ? timestamp * 1000
      : timestamp;
    
    return includeTime 
      ? formatDateTime(milliseconds, locale)
      : formatDate(milliseconds, {}, locale);
  }
  
  /**
   * Format file size for display
   * @param {number} bytes - Size in bytes
   * @param {number} decimals - Number of decimal places
   * @returns {string} Formatted file size
   */
  function formatFileSize(bytes, decimals = 2) {
    if (!bytes || bytes === 0) return '0 Bytes';
    
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(decimals)) + ' ' + sizes[i];
  }
  
  /**
   * Format percentage for display
   * @param {number} value - Percentage value (0-100)
   * @param {number} decimals - Number of decimal places
   * @param {string} locale - Locale for formatting
   * @returns {string} Formatted percentage
   */
  function formatPercentage(value, decimals = 2, locale = 'th-TH') {
    try {
      return new Intl.NumberFormat(locale, {
        style: 'percent',
        minimumFractionDigits: decimals,
        maximumFractionDigits: decimals
      }).format(parseFloat(value) / 100);
    } catch (error) {
      console.error('Error formatting percentage:', error);
      return `${parseFloat(value || 0).toFixed(decimals)}%`;
    }
  }
  
  /**
   * Format duration in seconds to human-readable string
   * @param {number} seconds - Duration in seconds
   * @returns {string} Formatted duration
   */
  function formatDuration(seconds) {
    if (!seconds || seconds < 0) return '0 วินาที';
    
    const units = [
      { value: 60 * 60 * 24 * 365, label: 'ปี' },
      { value: 60 * 60 * 24 * 30, label: 'เดือน' },
      { value: 60 * 60 * 24, label: 'วัน' },
      { value: 60 * 60, label: 'ชั่วโมง' },
      { value: 60, label: 'นาที' },
      { value: 1, label: 'วินาที' }
    ];
    
    for (const unit of units) {
      if (seconds >= unit.value) {
        const count = Math.floor(seconds / unit.value);
        return `${count} ${unit.label}${count > 1 ? '' : ''}`;
      }
    }
    
    return '0 วินาที';
  }
  
  /**
   * Format text to be suitable for display (prevent XSS, etc.)
   * @param {string} text - Text to format
   * @returns {string} Formatted text
   */
  function formatText(text) {
    if (!text) return '';
    
    // Convert HTML entities
    const entities = {
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#39;'
    };
    
    return String(text).replace(/[&<>"']/g, char => entities[char]);
  }
  
  module.exports = {
    formatCurrency,
    formatNumber,
    formatDate,
    formatDateTime,
    formatTimestamp,
    formatFileSize,
    formatPercentage,
    formatDuration,
    formatText
  };