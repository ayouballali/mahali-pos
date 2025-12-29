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
     * Update product
     * @param {number} id - Product ID
     * @param {Object} updates - Fields to update
     * @returns {Promise<number>} Number of updated records
     */
    async update(id, updates) {
        return await db.products.update(id, updates);
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
    }
};

export default db;
