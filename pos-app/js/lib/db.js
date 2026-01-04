/**
 * Database Module
 * Re-exports from the new modular database architecture
 *
 * This file exists for backwards compatibility.
 * All database logic is now in ./database/
 *
 * @version 2.0.0
 */

export { productDB, transactionDB } from './database/index.js';

// Default export for compatibility
import { productDB, transactionDB } from './database/index.js';
export default { productDB, transactionDB };
