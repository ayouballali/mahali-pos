/**
 * Repository Layer
 * Business logic layer that uses a database adapter
 * Decoupled from specific database implementation
 *
 * @version 1.0.0
 */

/**
 * Creates a Product Repository
 * @param {Object} adapter - Database adapter with products interface
 * @returns {Object} Product repository methods
 */
export function createProductRepository(adapter) {
    return {
        async add(product) {
            return await adapter.products.add(product);
        },

        async getAll() {
            return await adapter.products.getAll();
        },

        async getById(id) {
            return await adapter.products.getById(id);
        },

        async getByBarcode(barcode) {
            return await adapter.products.getByBarcode(barcode);
        },

        async update(id, updates) {
            return await adapter.products.update(id, updates);
        },

        async delete(id) {
            return await adapter.products.delete(id);
        },

        async search(query) {
            const all = await adapter.products.getAll();
            const lowerQuery = query.toLowerCase();
            return all.filter(p =>
                p.name.toLowerCase().includes(lowerQuery) ||
                (p.barcode && p.barcode.includes(query))
            );
        }
    };
}

/**
 * Creates a Transaction Repository
 * @param {Object} adapter - Database adapter with transactions interface
 * @returns {Object} Transaction repository methods
 */
export function createTransactionRepository(adapter) {
    return {
        async add(transaction) {
            return await adapter.transactions.add(transaction);
        },

        async getAll() {
            return await adapter.transactions.getAll();
        },

        async getById(id) {
            return await adapter.transactions.getById(id);
        },

        async getByDateRange(startDate, endDate) {
            return await adapter.transactions.getByDateRange(startDate, endDate);
        },

        async getToday() {
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            const tomorrow = new Date(today);
            tomorrow.setDate(tomorrow.getDate() + 1);
            return await adapter.transactions.getByDateRange(today, tomorrow);
        },

        async getByPeriod(period) {
            const now = new Date();
            let startDate = new Date();

            switch (period) {
                case 'today':
                    startDate.setHours(0, 0, 0, 0);
                    break;
                case 'week':
                    startDate.setDate(now.getDate() - 7);
                    startDate.setHours(0, 0, 0, 0);
                    break;
                case 'month':
                    startDate.setMonth(now.getMonth() - 1);
                    startDate.setHours(0, 0, 0, 0);
                    break;
                default:
                    startDate.setHours(0, 0, 0, 0);
            }

            return await adapter.transactions.getByDateRange(startDate, now);
        }
    };
}
