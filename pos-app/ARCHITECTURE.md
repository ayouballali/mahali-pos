# Mahali POS - Architecture Documentation

> **Production-Ready Architecture for Moroccan Grocery Point of Sale System**

Version: 1.0.0
Last Updated: 2024

---

## Table of Contents

1. [Overview](#overview)
2. [Technology Stack](#technology-stack)
3. [Project Structure](#project-structure)
4. [Core Concepts](#core-concepts)
5. [State Management](#state-management)
6. [Data Flow](#data-flow)
7. [Component Architecture](#component-architecture)
8. [Configuration System](#configuration-system)
9. [Utilities & Helpers](#utilities--helpers)
10. [Best Practices](#best-practices)
11. [Scalability](#scalability)
12. [Future Enhancements](#future-enhancements)

---

## Overview

Mahali POS is a Progressive Web App (PWA) designed for Moroccan grocery stores. The architecture is built with **maintainability**, **scalability**, and **production-readiness** as primary goals.

### Design Principles

- **Separation of Concerns**: Clear boundaries between UI, state, data, and configuration
- **Single Source of Truth**: Centralized state management using Preact Signals
- **No Build Tools**: Direct ES6 modules for faster development iteration
- **Progressive Enhancement**: Works offline, installable as native app
- **Internationalization**: RTL support, Arabic-first with English fallbacks

---

## Technology Stack

| Layer | Technology | Version | Purpose |
|-------|-----------|---------|---------|
| **UI Framework** | Preact | 10.19.3 | Lightweight React alternative (3KB) |
| **State Management** | Preact Signals | 1.2.2 | Reactive state without hooks complexity |
| **Templating** | HTM | 3.1.1 | JSX-like syntax without transpilation |
| **Styling** | CSS3 | - | Custom CSS with CSS variables |
| **Storage** | localStorage | - | Client-side data persistence |
| **PWA** | Service Worker | - | Offline functionality |

**Why No Build Tools?**
- Faster development cycle (no compilation)
- Easier debugging (direct source code)
- Lower complexity for maintenance
- Suitable for MVP and small teams

---

## Project Structure

```
pos-app/
├── index.html                 # Entry point
├── manifest.json             # PWA configuration
├── sw.js                     # Service Worker (future)
│
├── css/
│   └── style.css            # All styles (organized with comments)
│
├── js/
│   ├── app.js               # Main application entry
│   │
│   ├── lib/
│   │   └── preact.js        # Centralized Preact imports
│   │
│   ├── config/
│   │   └── app.config.js    # Application configuration
│   │
│   ├── store/
│   │   └── appStore.js      # State management (Signals)
│   │
│   ├── data/
│   │   └── mockData.js      # Mock data (replace with API later)
│   │
│   ├── utils/
│   │   └── helpers.js       # Utility functions
│   │
│   └── components/
│       ├── HomeTab.js       # Dashboard/Home screen
│       ├── SellTab.js       # Point of sale screen
│       ├── ProductsTab.js   # Product management
│       ├── ReportsTab.js    # Reports & analytics
│       ├── BottomNav.js     # Navigation component
│       └── Icons.js         # SVG icon library
│
└── assets/
    └── icons/               # PWA icons
```

### File Responsibilities

| File | Purpose | Can Modify? |
|------|---------|-------------|
| `app.config.js` | All app settings, feature flags, business rules | ✅ Yes - frequently |
| `appStore.js` | State + actions | ✅ Yes - as features grow |
| `mockData.js` | Development data | ⚠️ Replace with API calls |
| `helpers.js` | Pure utility functions | ✅ Yes - add as needed |
| Components | UI presentation | ✅ Yes - per feature |

---

## Core Concepts

### 1. Configuration-Driven Development

All settings are centralized in `js/config/app.config.js`:

```javascript
export const APP_CONFIG = {
    locale: {
        currency: {
            code: 'MAD',
            symbol: 'DH',
            position: 'after',  // Easy to change!
        }
    },
    features: {
        offlineMode: false,  // Toggle features easily
        barcodeScanner: false,
    }
};
```

**Benefits:**
- Change currency format app-wide in one place
- Enable/disable features without touching code
- Easy A/B testing and gradual rollouts

### 2. Reactive State with Signals

```javascript
// Define signal
export const stats = signal({ sales: 0, profit: 0 });

// Update anywhere
stats.value = { ...stats.value, sales: 1000 };

// Use in components (auto-updates UI)
const { sales } = stats.value;
```

**Why Signals?**
- Simpler than Redux/Context
- Better performance than useState for shared state
- Less boilerplate code

### 3. Mock Data Separation

All hardcoded data lives in `js/data/mockData.js`:

```javascript
export const todayStats = {
    sales: 1240.00,
    profit: 186.00,
};
```

**Migration Path:**
1. MVP: Use mock data
2. Backend Ready: Replace `mockData.js` with API calls
3. Offline: Use IndexedDB with API sync

---

## State Management

### Store Structure

```javascript
// js/store/appStore.js

// Signals (reactive state)
export const activeTab = signal('home-tab');
export const products = signal([]);
export const cartItems = signal([]);

// Computed values (derived state)
export const cartTotal = computed(() =>
    cartItems.value.reduce((sum, item) => sum + item.total, 0)
);

// Actions (state mutations)
export function addToCart(product, quantity) {
    cartItems.value = [...cartItems.value, { ...product, quantity }];
}
```

### State Flow

```
User Action → Component → Store Action → Signal Update → UI Re-render
```

Example:
```javascript
// User clicks "Add to Cart"
onClick={() => addToCart(product, 1)}

// Store updates signal
cartItems.value = [...cartItems.value, newItem]

// Component automatically sees update
const count = cartItemsCount.value; // ← Reactive!
```

---

## Data Flow

### Current (MVP)
```
Component → mockData.js → Component
```

### Future (Production)
```
Component → API Service → Backend → IndexedDB Cache → Component
                ↓
          appStore (signals)
```

### Persistence Strategy

```javascript
// Current: Auto-save to localStorage
products.subscribe(() => {
    storage.set('products', products.value);
});

// Future: Sync with backend
products.subscribe(async () => {
    await api.syncProducts(products.value);
});
```

---

## Component Architecture

### Component Pattern

All components follow this structure:

```javascript
/**
 * Component Name
 * Brief description
 * @param {Object} props - Component props
 * @param {boolean} props.isActive - Description
 * @returns {import('preact').VNode}
 */
export function ComponentName({ isActive }) {
    // 1. Local state (if needed)
    const [localState, setLocalState] = useState(null);

    // 2. Global state from store
    const globalData = someSignal.value;

    // 3. Side effects
    useEffect(() => {
        // Setup/cleanup
    }, []);

    // 4. Event handlers
    const handleClick = () => {
        // Logic
    };

    // 5. Render
    return html`
        <div>...</div>
    `;
}
```

### Component Guidelines

✅ **DO:**
- Keep components focused (single responsibility)
- Use JSDoc for prop types
- Import only what you need
- Use semantic HTML

❌ **DON'T:**
- Mix data fetching with presentation
- Hardcode values (use config/mockData)
- Create deeply nested components
- Duplicate logic (extract to helpers)

---

## Configuration System

### Config Structure

```javascript
APP_CONFIG = {
    app: { name, version, environment },
    locale: { language, direction, currency, dateFormat },
    ui: { theme, animations, vibration },
    api: { baseUrl, timeout, retries },
    storage: { prefix, version, dbName },
    business: { taxRate, lowStockThreshold },
    features: { offlineMode, barcodeScanner, ... },
}
```

### Usage Examples

```javascript
// Get config value
import { getConfig } from './config/app.config.js';
const currencySymbol = getConfig('locale.currency.symbol');

// Check feature flag
import { isFeatureEnabled } from './config/app.config.js';
if (isFeatureEnabled('barcodeScanner')) {
    // Show barcode scanner UI
}
```

---

## Utilities & Helpers

### Core Utilities

| Function | Purpose | Example |
|----------|---------|---------|
| `formatCurrency(1240.50)` | Format money | "DH 1,240.50" |
| `formatDate(new Date())` | Format dates | "27/12/2024" |
| `calculateProfitMargin(100, 150)` | Business math | 50.00 |
| `vibrate(10)` | Haptic feedback | - |
| `storage.get('key')` | Safe localStorage | {...} |
| `generateId('tx')` | Unique IDs | "tx_abc123" |

### Storage Wrapper

```javascript
// Safe localStorage with error handling
import { storage } from './utils/helpers.js';

// Get
const products = storage.get('products', []);

// Set
storage.set('products', productArray);

// Remove
storage.remove('products');

// Clear all app data
storage.clear();
```

---

## Best Practices

### 1. Currency Formatting

❌ **Wrong:**
```javascript
`${amount} DH`  // Hardcoded
```

✅ **Right:**
```javascript
formatCurrency(amount)  // Uses config, handles decimals, i18n-ready
```

### 2. State Updates

❌ **Wrong:**
```javascript
products.value.push(newProduct);  // Mutates directly
```

✅ **Right:**
```javascript
products.value = [...products.value, newProduct];  // Immutable update
```

### 3. Error Handling

✅ **Always wrap:**
```javascript
try {
    const data = await api.fetchProducts();
    products.value = data;
} catch (error) {
    setError('فشل تحميل المنتجات');
    console.error(error);
}
```

### 4. Loading States

```javascript
setLoading(true);
try {
    await asyncOperation();
} finally {
    setLoading(false);  // Always reset
}
```

---

## Scalability

### Adding New Features

#### 1. Add Feature Flag
```javascript
// config/app.config.js
features: {
    customerManagement: false,  // ← New feature
}
```

#### 2. Add Mock Data
```javascript
// data/mockData.js
export const mockCustomers = [...];
```

#### 3. Add State
```javascript
// store/appStore.js
export const customers = signal([]);
export function addCustomer(customer) { ... }
```

#### 4. Create Component
```javascript
// components/CustomersTab.js
export function CustomersTab({ isActive }) { ... }
```

#### 5. Enable Feature
```javascript
// config/app.config.js
features: {
    customerManagement: true,  // ← Enable
}
```

### Backend Integration

Replace mock data with API calls:

```javascript
// Before (mockData.js)
export const products = [...];

// After (services/api.js)
export async function getProducts() {
    const response = await fetch(`${APP_CONFIG.api.baseUrl}/products`);
    return response.json();
}

// In component
useEffect(() => {
    setLoading(true);
    getProducts()
        .then(data => products.value = data)
        .catch(setError)
        .finally(() => setLoading(false));
}, []);
```

---

## Future Enhancements

### Phase 1: Backend Integration
- Replace `mockData.js` with REST API calls
- Add authentication (JWT)
- Real-time sync with WebSockets

### Phase 2: Offline Mode
- Implement IndexedDB for local storage
- Service Worker for offline functionality
- Background sync when online

### Phase 3: Advanced Features
- Barcode scanning (getUserMedia API)
- Receipt printing (WebUSB API)
- Analytics dashboard
- Multi-store management
- Employee management

### Phase 4: Performance
- Code splitting (dynamic imports)
- Image optimization
- CDN for assets
- Performance monitoring

### Phase 5: DevOps
- CI/CD pipeline
- Automated testing
- Error tracking (Sentry)
- Analytics (Plausible)

---

## Migration Checklist

When moving from MVP to production:

- [ ] Replace all `mockData.js` imports with API calls
- [ ] Add proper authentication
- [ ] Implement IndexedDB for offline
- [ ] Add error boundaries
- [ ] Set up monitoring/analytics
- [ ] Add loading states everywhere
- [ ] Implement proper error messages (Arabic + English)
- [ ] Add data validation
- [ ] Security audit
- [ ] Performance optimization
- [ ] Accessibility audit
- [ ] Browser compatibility testing
- [ ] PWA audit (Lighthouse)

---

## Questions & Support

For architecture questions:
1. Check this document first
2. Review `js/README.md` for component details
3. Check inline JSDoc comments in code

**Key Files to Understand:**
- `js/config/app.config.js` - All settings
- `js/store/appStore.js` - State management
- `js/utils/helpers.js` - Utility functions

---

**Built with ❤️ for Moroccan small businesses**
