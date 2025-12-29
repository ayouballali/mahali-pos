/**
 * Mock Data for Development
 * This file contains mock data for development and testing
 *
 * @version 1.0.0
 */

/**
 * Mock sales statistics for today
 * @type {Object}
 */
export const todayStats = {
    sales: 1240.00,
    profit: 186.00,
    salesCount: 23,
    itemsSold: 45,
    lastUpdated: new Date().toISOString(),
};

/**
 * Mock sales statistics for different periods
 * @type {Object}
 */
export const periodStats = {
    اليوم: {
        sales: 1240.00,
        profit: 186.00,
        salesCount: 23,
        profitMargin: 15,
    },
    الأسبوع: {
        sales: 8680.00,
        profit: 1302.00,
        salesCount: 164,
        profitMargin: 15,
    },
    الشهر: {
        sales: 37200.00,
        profit: 5580.00,
        salesCount: 698,
        profitMargin: 15,
    },
};

/**
 * Get mock data by period
 * @param {string} period - Period key (اليوم, الأسبوع, الشهر)
 * @returns {Object} Period statistics
 */
export function getStatsByPeriod(period) {
    return periodStats[period] || periodStats['اليوم'];
}
