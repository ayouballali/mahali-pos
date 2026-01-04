/**
 * Database Module Entry Point
 *
 * SWITCHING DATABASES:
 * To change from Dexie to another database:
 * 1. Create a new adapter (e.g., firebase-adapter.js)
 * 2. Change the import below
 * 3. That's it! The rest of the app uses repositories.
 *
 * Architecture:
 * ┌─────────────────────────────────────────────────┐
 * │                   Components                     │
 * │         (HomeTab, SellTab, ReportsTab)          │
 * └─────────────────────┬───────────────────────────┘
 *                       │ uses
 * ┌─────────────────────▼───────────────────────────┐
 * │              Repositories + Services            │
 * │    (productDB, transactionDB, statsService)     │
 * └─────────────────────┬───────────────────────────┘
 *                       │ uses
 * ┌─────────────────────▼───────────────────────────┐
 * │               Database Adapter                   │
 * │     (DexieAdapter / FirebaseAdapter / etc)      │
 * └─────────────────────────────────────────────────┘
 *
 * @version 1.0.0
 */

// ============================================
// CHANGE THIS IMPORT TO SWITCH DATABASES
// ============================================
import { DexieAdapter } from './dexie-adapter.js';
const adapter = DexieAdapter;

// ============================================
// Repository and Service Creation
// ============================================
import { createProductRepository, createTransactionRepository } from './repositories.js';
import { createStatsService } from './stats-service.js';

// Create repositories with the chosen adapter
const productRepo = createProductRepository(adapter);
const transactionRepo = createTransactionRepository(adapter);
const statsService = createStatsService(transactionRepo);

// ============================================
// Exports (same API as before for compatibility)
// ============================================

/**
 * Product Database Operations
 */
export const productDB = {
    add: (product) => productRepo.add(product),
    getAll: () => productRepo.getAll(),
    getById: (id) => productRepo.getById(id),
    getByBarcode: (barcode) => productRepo.getByBarcode(barcode),
    update: (id, updates) => productRepo.update(id, updates),
    delete: (id) => productRepo.delete(id),
    search: (query) => productRepo.search(query)
};

/**
 * Transaction Database Operations
 */
export const transactionDB = {
    add: (transaction) => transactionRepo.add(transaction),
    getAll: () => transactionRepo.getAll(),
    getById: (id) => transactionRepo.getById(id),
    getByDateRange: (start, end) => transactionRepo.getByDateRange(start, end),
    getToday: () => transactionRepo.getToday(),
    getStats: (period) => statsService.getStats(period)
};

// For advanced usage - direct access to internals
export { adapter, productRepo, transactionRepo, statsService };
