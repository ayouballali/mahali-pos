/**
 * IndexedDB Database using Dexie.js
 * Local storage for products, transactions, and settings
 *
 * @version 1.0.0
 */

import Dexie from 'https://esm.sh/dexie@3.2.4';

// Initialize Dexie database
export const db = new Dexie('mahali_pos_db');

// Define schema
db.version(1).stores({
    products: '++id, barcode, name, saleType, costPrice, salePrice, image, stock, createdAt',
    transactions: '++id, date, total, status',
    settings: 'key, value'
});

/**
 * Product operations
 */
export const productDB = {
    /**
     * Add a new product
     * @param {Object} product - Product data
     * @returns {Promise<number>} Product ID
     */
    async add(product) {
        return await db.products.add({
            ...product,
            createdAt: product.createdAt || new Date().toISOString()
        });
    },

    /**
     * Get all products
     * @returns {Promise<Array>} All products
     */
    async getAll() {
        return await db.products.toArray();
    },

    /**
     * Get product by ID
     * @param {number} id - Product ID
     * @returns {Promise<Object>} Product
     */
    async get(id) {
        return await db.products.get(id);
    },

    /**
     * Update product
     * @param {number} id - Product ID
     * @param {Object} updates - Fields to update
     * @returns {Promise<number>} Number of updated records
     */
    async update(id, updates) {
        return await db.products.update(id, updates);
    },

    /**
     * Delete product
     * @param {number} id - Product ID
     * @returns {Promise<void>}
     */
    async delete(id) {
        return await db.products.delete(id);
    },

    /**
     * Search products by name or barcode
     * @param {string} query - Search query
     * @returns {Promise<Array>} Matching products
     */
    async search(query) {
        const lowerQuery = query.toLowerCase();
        return await db.products
            .filter(p =>
                p.name.toLowerCase().includes(lowerQuery) ||
                (p.barcode && p.barcode.includes(query))
            )
            .toArray();
    },

    /**
     * Get low stock products
     * @param {number} threshold - Stock threshold
     * @returns {Promise<Array>} Low stock products
     */
    async getLowStock(threshold = 10) {
        return await db.products
            .filter(p => p.stock <= threshold)
            .toArray();
    }
};

/**
 * Transaction operations
 */
export const transactionDB = {
    /**
     * Add a new transaction
     * @param {Object} transaction - Transaction data
     * @returns {Promise<number>} Transaction ID
     */
    async add(transaction) {
        return await db.transactions.add({
            ...transaction,
            date: transaction.date || new Date().toISOString()
        });
    },

    /**
     * Get all transactions
     * @param {number} limit - Maximum number of transactions
     * @returns {Promise<Array>} Transactions
     */
    async getAll(limit = 100) {
        return await db.transactions
            .orderBy('date')
            .reverse()
            .limit(limit)
            .toArray();
    },

    /**
     * Get transactions for a date range
     * @param {Date} startDate - Start date
     * @param {Date} endDate - End date
     * @returns {Promise<Array>} Transactions in range
     */
    async getByDateRange(startDate, endDate) {
        return await db.transactions
            .where('date')
            .between(startDate.toISOString(), endDate.toISOString())
            .toArray();
    }
};

/**
 * Settings operations
 */
export const settingsDB = {
    /**
     * Get setting value
     * @param {string} key - Setting key
     * @param {any} defaultValue - Default value if not found
     * @returns {Promise<any>} Setting value
     */
    async get(key, defaultValue = null) {
        const setting = await db.settings.get(key);
        return setting ? setting.value : defaultValue;
    },

    /**
     * Set setting value
     * @param {string} key - Setting key
     * @param {any} value - Setting value
     * @returns {Promise<string>} Setting key
     */
    async set(key, value) {
        return await db.settings.put({ key, value });
    }
};

/**
 * Clear all data (for testing/reset)
 */
export async function clearAllData() {
    await db.products.clear();
    await db.transactions.clear();
    await db.settings.clear();
}

export default db;
