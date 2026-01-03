/**
 * Database Adapter Interface
 * Any database implementation must follow this contract
 *
 * To switch databases:
 * 1. Create a new adapter (e.g., SqliteAdapter, FirebaseAdapter)
 * 2. Implement all methods below
 * 3. Change the import in index.js
 *
 * @version 1.0.0
 */

/**
 * @typedef {Object} DatabaseAdapter
 * @property {Object} products - Product table operations
 * @property {Object} transactions - Transaction table operations
 */

/**
 * Database Adapter Interface Definition
 * This is the contract that all database adapters must follow
 */
export const DatabaseAdapterInterface = {
    products: {
        /** @param {Object} product @returns {Promise<number>} */
        add: async (product) => { throw new Error('Not implemented'); },
        /** @returns {Promise<Array>} */
        getAll: async () => { throw new Error('Not implemented'); },
        /** @param {number} id @returns {Promise<Object|null>} */
        getById: async (id) => { throw new Error('Not implemented'); },
        /** @param {string} barcode @returns {Promise<Object|null>} */
        getByBarcode: async (barcode) => { throw new Error('Not implemented'); },
        /** @param {number} id @param {Object} updates @returns {Promise<number>} */
        update: async (id, updates) => { throw new Error('Not implemented'); },
        /** @param {number} id @returns {Promise<void>} */
        delete: async (id) => { throw new Error('Not implemented'); },
    },
    transactions: {
        /** @param {Object} transaction @returns {Promise<number>} */
        add: async (transaction) => { throw new Error('Not implemented'); },
        /** @returns {Promise<Array>} */
        getAll: async () => { throw new Error('Not implemented'); },
        /** @param {number} id @returns {Promise<Object|null>} */
        getById: async (id) => { throw new Error('Not implemented'); },
        /** @param {Date} startDate @param {Date} endDate @returns {Promise<Array>} */
        getByDateRange: async (startDate, endDate) => { throw new Error('Not implemented'); },
    }
};
