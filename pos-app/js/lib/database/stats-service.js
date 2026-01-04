/**
 * Stats Service
 * Pure business logic for calculating statistics
 * No database dependency - works with any data source
 *
 * @version 1.0.0
 */

/**
 * Calculate stats from an array of transactions
 * @param {Array} transactions - Array of transaction objects
 * @returns {Object} Calculated statistics
 */
export function calculateStats(transactions) {
    if (!transactions || transactions.length === 0) {
        return {
            sales: 0,
            profit: 0,
            salesCount: 0,
            itemsSold: 0,
            profitMargin: 0
        };
    }

    const sales = transactions.reduce((sum, t) => sum + (t.total || 0), 0);
    const profit = transactions.reduce((sum, t) => sum + (t.profit || 0), 0);
    const salesCount = transactions.length;
    const itemsSold = transactions.reduce((sum, t) => sum + (t.itemCount || 0), 0);
    const profitMargin = sales > 0 ? Math.round((profit / sales) * 100) : 0;

    return {
        sales,
        profit,
        salesCount,
        itemsSold,
        profitMargin
    };
}

/**
 * Creates a Stats Service using a transaction repository
 * @param {Object} transactionRepo - Transaction repository
 * @returns {Object} Stats service methods
 */
export function createStatsService(transactionRepo) {
    return {
        async getStats(period = 'today') {
            const transactions = await transactionRepo.getByPeriod(period);
            return {
                ...calculateStats(transactions),
                transactions
            };
        },

        async getTodayStats() {
            const transactions = await transactionRepo.getToday();
            return calculateStats(transactions);
        }
    };
}
