/**
 * Utility Helper Functions
 * Production-ready helper utilities for Mahali POS
 *
 * @version 1.0.0
 */

/**
 * Get time-based greeting based on current hour
 * @returns {string} Greeting message in Arabic
 */
export function getGreeting() {
    const hour = new Date().getHours();

    if (hour >= 5 && hour < 12) {
        return 'صباح الخير';
    }
    return 'مساء الخير';
}

/**
 * Trigger haptic feedback if supported and enabled
 * @param {number} [duration=10] - Vibration duration in ms
 */
export function vibrate(duration = 10) {
    if ('vibrate' in navigator) {
        navigator.vibrate(duration);
    }
}

/**
 * Format number as currency (Moroccan Dirham)
 * @param {number} amount - Amount to format
 * @param {Object} [options] - Optional formatting overrides
 * @param {boolean} [options.showSymbol=true] - Whether to show currency symbol
 * @param {number} [options.decimals=2] - Number of decimal places
 * @returns {string} Formatted currency string
 *
 * @example
 * formatCurrency(1240.50) // "DH 1,240.50"
 * formatCurrency(1240.50, { decimals: 0 }) // "DH 1,241"
 */
export function formatCurrency(amount, options = {}) {
    const {
        showSymbol = true,
        decimals = 2,
    } = options;

    // Format number with thousands separator
    const formatted = amount.toFixed(decimals).replace(
        /\B(?=(\d{3})+(?!\d))/g,
        ','
    );

    // Return with or without currency symbol
    if (!showSymbol) return formatted;

    return `DH ${formatted}`;
}

/**
 * Calculate profit margin percentage
 * @param {number} cost - Cost price
 * @param {number} sale - Sale price
 * @returns {number} Profit margin percentage (rounded to 2 decimals)
 */
export function calculateProfitMargin(cost, sale) {
    if (cost === 0 || !cost) return 0;
    return parseFloat((((sale - cost) / cost) * 100).toFixed(2));
}
