/**
 * Dexie (IndexedDB) Database Adapter
 * Implements the DatabaseAdapter interface using Dexie.js
 *
 * To switch to a different database:
 * 1. Create a new adapter file (e.g., firebase-adapter.js)
 * 2. Implement the same interface
 * 3. Change the import in index.js
 *
 * @version 1.0.0
 */

import Dexie from 'https://esm.sh/dexie@3.2.4';

// Initialize Dexie database
const db = new Dexie('mahali_pos_db');

// Define schema
db.version(1).stores({
    products: '++id, barcode, name, saleType, costPrice, salePrice, image, stock, createdAt',
    transactions: '++id, date, total, status',
    settings: 'key, value'
});

/**
 * Dexie Database Adapter
 * Implements DatabaseAdapterInterface
 */
export const DexieAdapter = {
    products: {
        async add(product) {
            return await db.products.add({
                ...product,
                createdAt: product.createdAt || new Date().toISOString()
            });
        },

        async getAll() {
            return await db.products.toArray();
        },

        async getById(id) {
            return await db.products.get(id);
        },

        async getByBarcode(barcode) {
            return await db.products.where('barcode').equals(barcode).first();
        },

        async update(id, updates) {
            return await db.products.update(id, updates);
        },

        async delete(id) {
            return await db.products.delete(id);
        }
    },

    transactions: {
        async add(transaction) {
            return await db.transactions.add({
                ...transaction,
                date: transaction.date || new Date().toISOString()
            });
        },

        async getAll() {
            return await db.transactions.toArray();
        },

        async getById(id) {
            return await db.transactions.get(id);
        },

        async getByDateRange(startDate, endDate) {
            const all = await db.transactions.toArray();
            return all.filter(t => {
                const txDate = new Date(t.date);
                return txDate >= startDate && txDate <= endDate;
            });
        }
    }
};

export default DexieAdapter;
