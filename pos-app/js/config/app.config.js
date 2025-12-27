/**
 * Application Configuration
 * Central configuration for the Mahali POS system
 *
 * @version 1.0.0
 */

export const APP_CONFIG = {
    // Application Info
    app: {
        name: 'محلي - Mahali POS',
        version: '1.0.0',
        environment: 'development', // 'development' | 'production'
    },

    // Localization
    locale: {
        language: 'ar',
        direction: 'rtl',
        currency: {
            code: 'MAD',
            symbol: 'DH',
            position: 'after', // 'before' | 'after' - position relative to number
            decimals: 2,
            thousandsSeparator: ',',
            decimalSeparator: '.',
        },
        dateFormat: 'DD/MM/YYYY',
        timeFormat: '24h', // '12h' | '24h'
    },

    // Greetings based on time
    greetings: {
        morning: 'صباح الخير',    // 5:00 - 11:59
        afternoon: 'مساء الخير',   // 12:00 - 16:59
        evening: 'مساء الخير',     // 17:00 - 20:59
        night: 'مساء الخير',       // 21:00 - 4:59
    },

    // Time boundaries for greetings (in hours, 24h format)
    greetingTimes: {
        morning: { start: 5, end: 12 },
        afternoon: { start: 12, end: 17 },
        evening: { start: 17, end: 21 },
        night: { start: 21, end: 5 }, // wraps around midnight
    },

    // UI Settings
    ui: {
        theme: {
            primary: '#22c55e',
            primaryDark: '#16a34a',
            background: '#f8fafc',
            surface: '#ffffff',
            text: '#1e293b',
            textSecondary: '#64748b',
            border: '#e2e8f0',
        },
        animations: {
            enabled: true,
            duration: {
                fast: 150,
                normal: 200,
                slow: 300,
            },
        },
        vibration: {
            enabled: true,
            duration: 10, // milliseconds
        },
    },

    // API Configuration (for future backend integration)
    api: {
        baseUrl: process.env.API_URL || 'http://localhost:3000/api',
        timeout: 10000, // 10 seconds
        retries: 3,
    },

    // Storage Configuration
    storage: {
        prefix: 'mahali_', // prefix for all storage keys
        version: 1,
        dbName: 'mahali_pos_db',
    },

    // Business Rules
    business: {
        taxRate: 0.20, // 20% VAT (Morocco standard rate)
        lowStockThreshold: 10,
        profitMarginDefault: 0.15, // 15% default profit margin
    },

    // Feature Flags (for gradual rollout)
    features: {
        offlineMode: false, // Enable offline functionality
        barcodeScanner: false, // Enable barcode scanning
        printReceipt: false, // Enable receipt printing
        multiCurrency: false, // Enable multiple currencies
        analytics: false, // Enable analytics tracking
    },
};

/**
 * Get configuration value by path
 * @param {string} path - Dot notation path (e.g., 'locale.currency.symbol')
 * @returns {any} Configuration value
 */
export function getConfig(path) {
    return path.split('.').reduce((obj, key) => obj?.[key], APP_CONFIG);
}

/**
 * Check if a feature is enabled
 * @param {string} featureName - Name of the feature
 * @returns {boolean}
 */
export function isFeatureEnabled(featureName) {
    return APP_CONFIG.features[featureName] === true;
}
