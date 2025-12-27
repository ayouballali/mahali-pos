/**
 * Application State Store using Preact Signals
 * Centralized state management for Mahali POS
 *
 * @version 1.0.0
 */

import { signal, computed } from 'https://esm.sh/@preact/signals@1.2.2';
import { todayStats, mockProducts, mockTransactions } from '../data/mockData.js';
import { storage } from '../utils/helpers.js';

/**
 * Active tab signal
 * @type {import('@preact/signals').Signal<string>}
 */
export const activeTab = signal('home-tab');

/**
 * Products signal
 * @type {import('@preact/signals').Signal<Array>}
 */
export const products = signal(storage.get('products', mockProducts));

/**
 * Transactions signal
 * @type {import('@preact/signals').Signal<Array>}
 */
export const transactions = signal(storage.get('transactions', mockTransactions));

/**
 * Sales statistics signal
 * @type {import('@preact/signals').Signal<Object>}
 */
export const stats = signal(storage.get('stats', todayStats));

/**
 * Loading state signal
 * @type {import('@preact/signals').Signal<boolean>}
 */
export const isLoading = signal(false);

/**
 * Error state signal
 * @type {import('@preact/signals').Signal<string|null>}
 */
export const error = signal(null);

/**
 * Cart items for current sale
 * @type {import('@preact/signals').Signal<Array>}
 */
export const cartItems = signal([]);

/**
 * Computed: Cart total
 * @type {import('@preact/signals').Signal<number>}
 */
export const cartTotal = computed(() => {
    return cartItems.value.reduce((sum, item) => sum + (item.price * item.quantity), 0);
});

/**
 * Computed: Cart items count
 * @type {import('@preact/signals').Signal<number>}
 */
export const cartItemsCount = computed(() => {
    return cartItems.value.reduce((sum, item) => sum + item.quantity, 0);
});

/**
 * Computed: Low stock products
 * @type {import('@preact/signals').Signal<Array>}
 */
export const lowStockProducts = computed(() => {
    return products.value.filter(p => p.stock <= p.minStock);
});

/**
 * Computed: Total products count
 * @type {import('@preact/signals').Signal<number>}
 */
export const totalProducts = computed(() => products.value.length);

// ============================================
// Actions
// ============================================

/**
 * Change active tab
 * @param {string} tabId - Tab ID to activate
 */
export function setActiveTab(tabId) {
    activeTab.value = tabId;
}

/**
 * Add item to cart
 * @param {Object} product - Product to add
 * @param {number} [quantity=1] - Quantity to add
 */
export function addToCart(product, quantity = 1) {
    const existingItem = cartItems.value.find(item => item.id === product.id);

    if (existingItem) {
        cartItems.value = cartItems.value.map(item =>
            item.id === product.id
                ? { ...item, quantity: item.quantity + quantity }
                : item
        );
    } else {
        cartItems.value = [...cartItems.value, {
            id: product.id,
            name: product.name,
            price: product.salePrice,
            quantity,
        }];
    }
}

/**
 * Remove item from cart
 * @param {string} productId - Product ID to remove
 */
export function removeFromCart(productId) {
    cartItems.value = cartItems.value.filter(item => item.id !== productId);
}

/**
 * Update cart item quantity
 * @param {string} productId - Product ID
 * @param {number} quantity - New quantity
 */
export function updateCartQuantity(productId, quantity) {
    if (quantity <= 0) {
        removeFromCart(productId);
        return;
    }

    cartItems.value = cartItems.value.map(item =>
        item.id === productId
            ? { ...item, quantity }
            : item
    );
}

/**
 * Clear cart
 */
export function clearCart() {
    cartItems.value = [];
}

/**
 * Complete sale and create transaction
 * @returns {Object} Transaction object
 */
export function completeSale() {
    if (cartItems.value.length === 0) {
        throw new Error('السلة فارغة');
    }

    const transaction = {
        id: `tx_${Date.now()}`,
        date: new Date().toISOString(),
        items: cartItems.value.map(item => ({
            productId: item.id,
            quantity: item.quantity,
            unitPrice: item.price,
            total: item.price * item.quantity,
        })),
        subtotal: cartTotal.value,
        tax: 0,
        total: cartTotal.value,
        paymentMethod: 'نقدي',
        status: 'completed',
    };

    // Add to transactions
    transactions.value = [transaction, ...transactions.value];

    // Update products stock
    cartItems.value.forEach(cartItem => {
        products.value = products.value.map(product =>
            product.id === cartItem.id
                ? { ...product, stock: product.stock - cartItem.quantity }
                : product
        );
    });

    // Update stats
    const profitMargin = 0.15; // 15% default
    const profit = cartTotal.value * profitMargin;

    stats.value = {
        ...stats.value,
        sales: stats.value.sales + cartTotal.value,
        profit: stats.value.profit + profit,
        salesCount: stats.value.salesCount + 1,
        itemsSold: stats.value.itemsSold + cartItemsCount.value,
        lastUpdated: new Date().toISOString(),
    };

    // Persist to storage
    persistData();

    // Clear cart
    clearCart();

    return transaction;
}

/**
 * Add new product
 * @param {Object} product - Product data
 */
export function addProduct(product) {
    products.value = [...products.value, product];
    persistData();
}

/**
 * Update existing product
 * @param {string} productId - Product ID
 * @param {Object} updates - Product updates
 */
export function updateProduct(productId, updates) {
    products.value = products.value.map(p =>
        p.id === productId
            ? { ...p, ...updates, updatedAt: new Date().toISOString() }
            : p
    );
    persistData();
}

/**
 * Delete product
 * @param {string} productId - Product ID
 */
export function deleteProduct(productId) {
    products.value = products.value.filter(p => p.id !== productId);
    persistData();
}

/**
 * Search products
 * @param {string} query - Search query
 * @returns {Array} Matching products
 */
export function searchProducts(query) {
    const lowerQuery = query.toLowerCase();
    return products.value.filter(p =>
        p.name.toLowerCase().includes(lowerQuery) ||
        p.nameEn?.toLowerCase().includes(lowerQuery) ||
        p.barcode?.includes(query)
    );
}

/**
 * Set error message
 * @param {string|null} message - Error message
 */
export function setError(message) {
    error.value = message;
}

/**
 * Clear error message
 */
export function clearError() {
    error.value = null;
}

/**
 * Set loading state
 * @param {boolean} loading - Loading state
 */
export function setLoading(loading) {
    isLoading.value = loading;
}

/**
 * Persist data to localStorage
 */
function persistData() {
    storage.set('products', products.value);
    storage.set('transactions', transactions.value);
    storage.set('stats', stats.value);
}

/**
 * Reset all data (for testing/demo purposes)
 */
export function resetData() {
    products.value = mockProducts;
    transactions.value = mockTransactions;
    stats.value = todayStats;
    cartItems.value = [];
    error.value = null;
    isLoading.value = false;
    storage.clear();
}

// Auto-persist data when it changes (debounced)
let persistTimer;
function autoPersist() {
    clearTimeout(persistTimer);
    persistTimer = setTimeout(persistData, 1000);
}

// Subscribe to changes
products.subscribe(autoPersist);
transactions.subscribe(autoPersist);
stats.subscribe(autoPersist);
