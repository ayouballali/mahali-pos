/**
 * Mock Data for Development
 * This file contains mock data for development and testing
 * In production, this data will come from the backend API or IndexedDB
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
 * Mock products data
 * @type {Array<Object>}
 */
export const mockProducts = [
    {
        id: 'prod_001',
        name: 'سكر',
        nameEn: 'Sugar',
        barcode: '6111000000001',
        category: 'البقالة',
        categoryEn: 'Grocery',
        costPrice: 8.50,
        salePrice: 10.00,
        stock: 45,
        unit: 'كغ',
        supplier: 'كوسومار',
        minStock: 10,
        image: null,
        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: '2024-01-15T10:30:00Z',
    },
    {
        id: 'prod_002',
        name: 'دقيق',
        nameEn: 'Flour',
        barcode: '6111000000002',
        category: 'البقالة',
        categoryEn: 'Grocery',
        costPrice: 15.00,
        salePrice: 18.00,
        stock: 32,
        unit: 'كغ',
        supplier: 'النخالة الذهبية',
        minStock: 15,
        image: null,
        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: '2024-01-15T10:30:00Z',
    },
    {
        id: 'prod_003',
        name: 'زيت',
        nameEn: 'Oil',
        barcode: '6111000000003',
        category: 'البقالة',
        categoryEn: 'Grocery',
        costPrice: 45.00,
        salePrice: 52.00,
        stock: 8,
        unit: 'لتر',
        supplier: 'ليسيور',
        minStock: 10,
        image: null,
        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: '2024-01-15T10:30:00Z',
    },
];

/**
 * Mock sales transactions
 * @type {Array<Object>}
 */
export const mockTransactions = [
    {
        id: 'tx_001',
        date: new Date().toISOString(),
        items: [
            { productId: 'prod_001', quantity: 2, unitPrice: 10.00, total: 20.00 },
            { productId: 'prod_002', quantity: 1, unitPrice: 18.00, total: 18.00 },
        ],
        subtotal: 38.00,
        tax: 0,
        total: 38.00,
        paymentMethod: 'نقدي',
        status: 'completed',
    },
    {
        id: 'tx_002',
        date: new Date(Date.now() - 3600000).toISOString(),
        items: [
            { productId: 'prod_003', quantity: 1, unitPrice: 52.00, total: 52.00 },
        ],
        subtotal: 52.00,
        tax: 0,
        total: 52.00,
        paymentMethod: 'نقدي',
        status: 'completed',
    },
];

/**
 * Mock product categories
 * @type {Array<Object>}
 */
export const mockCategories = [
    { id: 'cat_001', name: 'البقالة', nameEn: 'Grocery', icon: 'Package' },
    { id: 'cat_002', name: 'المشروبات', nameEn: 'Beverages', icon: 'Coffee' },
    { id: 'cat_003', name: 'الألبان', nameEn: 'Dairy', icon: 'Milk' },
    { id: 'cat_004', name: 'التوابل', nameEn: 'Spices', icon: 'Flame' },
    { id: 'cat_005', name: 'الحلويات', nameEn: 'Sweets', icon: 'Candy' },
];

/**
 * Mock user/shop settings
 * @type {Object}
 */
export const mockShopSettings = {
    shopName: 'حانوت محمد',
    shopNameEn: 'Mohamed\'s Shop',
    ownerName: 'محمد الإدريسي',
    phone: '0612345678',
    address: 'شارع الحسن الثاني، الدار البيضاء',
    taxNumber: 'MAT123456',
    currency: 'MAD',
    language: 'ar',
    printReceipt: true,
    lowStockAlert: true,
    lowStockThreshold: 10,
};

/**
 * Get mock data by period
 * @param {string} period - Period key (اليوم, الأسبوع, الشهر)
 * @returns {Object} Period statistics
 */
export function getStatsByPeriod(period) {
    return periodStats[period] || periodStats['اليوم'];
}

/**
 * Get product by ID
 * @param {string} productId - Product ID
 * @returns {Object|null} Product object or null
 */
export function getProductById(productId) {
    return mockProducts.find(p => p.id === productId) || null;
}

/**
 * Get products by category
 * @param {string} categoryId - Category ID
 * @returns {Array<Object>} Products in category
 */
export function getProductsByCategory(categoryId) {
    const category = mockCategories.find(c => c.id === categoryId);
    if (!category) return [];
    return mockProducts.filter(p => p.category === category.name);
}

/**
 * Get low stock products
 * @returns {Array<Object>} Products with stock below minimum
 */
export function getLowStockProducts() {
    return mockProducts.filter(p => p.stock <= p.minStock);
}
