# JavaScript Architecture

Clean, modular code structure following separation of concerns principles.

## 📁 Directory Structure

```
js/
├── app.js                  # Main application entry point
├── lib/
│   └── preact.js          # Preact library exports (CDN imports)
├── components/
│   ├── Icons.js           # SVG icon components
│   ├── HomeTab.js         # Home dashboard component
│   ├── SellTab.js         # Sell screen component
│   ├── ProductsTab.js     # Products list component
│   ├── ReportsTab.js      # Reports screen component
│   └── BottomNav.js       # Bottom navigation component
└── utils/
    └── helpers.js         # Utility functions (greeting, vibrate, etc.)
```

## 🎯 Separation of Concerns

### **app.js** - Application Entry
- Main App component
- Tab state management
- Rendering logic

### **lib/preact.js** - Library Abstraction
- Single source for Preact imports
- Centralized CDN dependencies
- Easy to update library versions

### **components/** - UI Components
Each component is:
- Self-contained
- Single responsibility
- Reusable
- Well-documented

### **utils/helpers.js** - Business Logic
- Pure functions
- No side effects
- Easily testable
- Reusable across components

## 🔄 Import Pattern

```javascript
// Good: Import from centralized lib
import { html, useState } from './lib/preact.js';

// Good: Import specific components
import { HomeTab } from './components/HomeTab.js';

// Good: Import utility functions
import { getGreeting, vibrate } from './utils/helpers.js';
```

## ✅ Benefits

1. **Maintainability** - Easy to find and update code
2. **Scalability** - Simple to add new features
3. **Testability** - Pure functions are easy to test
4. **Readability** - Clear structure and responsibilities
5. **Reusability** - Components can be reused
6. **Team-Friendly** - Multiple developers can work simultaneously

## 🚀 Next Steps (Day 2-9)

When adding new features:

1. **New Tab?** → Create new component in `components/`
2. **New Utility?** → Add to `utils/helpers.js`
3. **New Icon?** → Add to `components/Icons.js`
4. **Database?** → Create `js/db.js` or `js/services/database.js`
5. **Scanner?** → Create `js/services/scanner.js`

## 📝 Example: Adding a New Feature

To add a "Settings" tab:

1. Create `components/SettingsTab.js`
2. Import in `app.js`
3. Add to App component render
4. Update BottomNav click handler

```javascript
// app.js
import { SettingsTab } from './components/SettingsTab.js';

// In App component
<${SettingsTab} isActive=${activeTab === 'settings-tab'} />
```

## 🎨 Code Style

- Use arrow functions for exports
- JSDoc comments for functions
- Clear variable names
- Consistent formatting
- ES6+ features
