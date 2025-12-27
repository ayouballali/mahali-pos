# Moroccan Grocery POS - Project Context

## Project Overview

A simple PWA (Progressive Web App) for small Moroccan grocery shops to track sales and profit. Built for shop owners like my father who currently use paper and memory.

## Why This Exists

- Small Moroccan groceries can't track profit, inventory, or customer credit
- Existing solutions (Loyverse, Square) are too complex, no Arabic, no credit tracking
- Target: 200,000+ small shops in Morocco

## Tech Stack

- **Type:** PWA (Progressive Web App)
- **Framework:** Vanilla JavaScript (keep it light for cheap phones)
- **Storage:** IndexedDB via Dexie.js (offline-first)
- **Barcode:** html5-qrcode library
- **Styling:** Plain CSS with RTL support
- **No build tools:** Keep it simple, just HTML/CSS/JS

## Core Constraints

- Must work offline
- Must work on cheap Android phones
- Must be RTL (Arabic right-to-left)
- Must be fast (1-2 taps per sale maximum)
- Minimal text input (use barcode scanning instead)

## MVP Features (9 Days)

- Day 1: Home screen with daily summary
- Day 2: Add product (barcode, name, cost, price)
- Day 3: Barcode scanning (instant camera)
- Day 4: Quick sale flow (scan → confirm)
- Day 5: Sales history (today's sales)
- Day 6: Profit view (daily/weekly)
- Day 7: Arabic RTL UI
- Day 8: Offline storage (IndexedDB)
- Day 9: Test on cheap phone + polish

## Data Models

### Product
```javascript
{
  id: "prod_001",
  barcode: "6111245123456",
  name: "تايد 2 كيلو",
  costPrice: 45,      // what shop owner pays
  sellPrice: 52,      // what customer pays
  createdAt: "2024-01-15T10:00:00Z"
}
```

### Sale
```javascript
{
  id: "sale_001",
  items: [
    {
      productId: "prod_001",
      barcode: "6111245123456",
      name: "تايد 2 كيلو",
      quantity: 1,
      costPrice: 45,
      sellPrice: 52
    }
  ],
  totalCost: 45,
  totalSale: 52,
  profit: 7,
  createdAt: "2024-01-15T10:23:00Z"
}
```

## Screen Specifications

### Screen 1: Home (الرئيسية)

The main screen showing today's summary and quick actions.

```
┌─────────────────────────────────────────┐
│                                         │
│            صباح الخير 👋                │
│                                         │
│  ┌─────────────────────────────────┐   │
│  │        اليوم (Today)            │   │
│  │                                 │   │
│  │    1,240 DH    │    186 DH     │   │
│  │    المبيعات    │    الربح       │   │
│  │    (Sales)     │   (Profit)    │   │
│  └─────────────────────────────────┘   │
│                                         │
│  ╔═════════════════════════════════╗   │
│  ║         📷 بيـــع               ║   │
│  ║           (SELL)                ║   │
│  ╚═════════════════════════════════╝   │
│                                         │
│  ┌───────────┐       ┌───────────┐     │
│  │    📦     │       │    📊     │     │
│  │ المنتجات  │       │ التقارير  │     │
│  │(Products) │       │ (Reports) │     │
│  └───────────┘       └───────────┘     │
│                                         │
└─────────────────────────────────────────┘
```

**Requirements:**
- Greeting changes by time (صباح الخير / مساء الخير)
- Today's sales and profit calculated from IndexedDB
- Big green SELL button (primary action)
- Products and Reports as secondary actions

### Screen 2: Camera Scan

Opens instantly when tapping "بيع" button.

```
┌─────────────────────────────────────────┐
│ ✕                                       │
│                                         │
│         ┌─────────────────────┐         │
│         │                     │         │
│         │    📷 CAMERA        │         │
│         │    LIVE FEED        │         │
│         │                     │         │
│         └─────────────────────┘         │
│                                         │
│         وجه الكاميرا للباركود           │
│       (Point camera at barcode)         │
│                                         │
│  ┌─────────────────────────────────┐   │
│  │      ⌨️ إدخال يدوي              │   │
│  │      (Manual entry)             │   │
│  └─────────────────────────────────┘   │
│                                         │
└─────────────────────────────────────────┘
```

**Requirements:**
- Camera starts automatically (no start button)
- Use back camera by default: `facingMode: { exact: "environment" }`
- X button to cancel (returns to home)
- Manual entry option for products without barcode

### Screen 3a: Product Found - Confirm Sale

When scanned barcode matches existing product.

```
┌─────────────────────────────────────────┐
│                                         │
│                  ✓                      │
│                                         │
│  ┌─────────────────────────────────┐   │
│  │         تايد 2 كيلو             │   │
│  │            52 DH                │   │
│  └─────────────────────────────────┘   │
│                                         │
│           الكمية (Quantity)             │
│                                         │
│      ┌─────┐   ┌─────┐   ┌─────┐       │
│      │  -  │   │  1  │   │  +  │       │
│      └─────┘   └─────┘   └─────┘       │
│                                         │
│  ┌──────────────────────────────────┐  │
│  │         ➕ زيد منتج آخر           │  │
│  │        (Add another item)        │  │
│  └──────────────────────────────────┘  │
│                                         │
│  ╔══════════════════════════════════╗  │
│  ║     ✓ تأكيد البيع   52 DH        ║  │
│  ║       (Confirm Sale)             ║  │
│  ╚══════════════════════════════════╝  │
│                                         │
└─────────────────────────────────────────┘
```

**Requirements:**
- Big +/- buttons for quantity (no typing)
- Total updates live as quantity changes
- "Add another" reopens camera for multi-item sales
- Confirm saves sale and returns to home

### Screen 3b: New Product - Quick Add

When scanned barcode is not in database.

```
┌─────────────────────────────────────────┐
│ →                                       │
│              منتج جديد                  │
│            (New Product)                │
│                                         │
│  ┌─────────────────────────────────┐   │
│  │ 6111245123456                   │   │
│  └─────────────────────────────────┘   │
│                                         │
│  الاسم (Name)                           │
│  ┌─────────────────────────────────┐   │
│  │                                 │   │
│  └─────────────────────────────────┘   │
│                                         │
│  ┌────────────────┐ ┌────────────────┐ │
│  │ سعر الشراء     │ │ سعر البيع      │ │
│  │ (Cost)         │ │ (Price)        │ │
│  │ ┌────────────┐ │ │ ┌────────────┐ │ │
│  │ │         DH │ │ │ │         DH │ │ │
│  │ └────────────┘ │ │ └────────────┘ │ │
│  └────────────────┘ └────────────────┘ │
│                                         │
│  ╔══════════════════════════════════╗  │
│  ║          💾 حفظ وبيع             ║  │
│  ║        (Save & Sell)             ║  │
│  ╚══════════════════════════════════╝  │
│                                         │
└─────────────────────────────────────────┘
```

**Requirements:**
- Barcode pre-filled from scan
- Only 3 fields: name, cost price, sell price
- Numeric keyboard for price fields
- "Save & Sell" creates product AND records sale

### Screen 4: Sale Success

Brief confirmation after sale.

```
┌─────────────────────────────────────────┐
│                                         │
│                 ✓                       │
│              تم البيع                   │
│           (Sale Complete)               │
│              52 DH                      │
│                                         │
│     (Auto-returns to home in 1.5s)      │
│                                         │
└─────────────────────────────────────────┘
```

**Requirements:**
- Auto-redirect to home after 1.5 seconds
- Optional: vibration/sound feedback
- Large checkmark animation

### Screen 5: Products List

```
┌─────────────────────────────────────────┐
│ →                        🔍             │
│              المنتجات                   │
│             (Products)                  │
│─────────────────────────────────────────│
│                                         │
│  ┌─────────────────────────────────┐   │
│  │ تايد 2 كيلو                     │   │
│  │ 52 DH ← 45 DH                   │   │
│  └─────────────────────────────────┘   │
│                                         │
│  ┌─────────────────────────────────┐   │
│  │ حليب سنطرال                     │   │
│  │ 8 DH ← 6.5 DH                   │   │
│  └─────────────────────────────────┘   │
│                                         │
│  ╔══════════════════════════════════╗  │
│  ║       ➕ إضافة منتج               ║  │
│  ║       (Add Product)              ║  │
│  ╚══════════════════════════════════╝  │
│                                         │
└─────────────────────────────────────────┘
```

**Requirements:**
- Shows sell price ← cost price
- Tap product to edit
- Search functionality
- Add product opens camera to scan barcode

### Screen 6: Reports

```
┌─────────────────────────────────────────┐
│ →                                       │
│              التقارير                   │
│              (Reports)                  │
│─────────────────────────────────────────│
│                                         │
│   [اليوم]  [الأسبوع]  [الشهر]           │
│   (Today)  (Week)    (Month)            │
│                                         │
│  ┌─────────────────────────────────┐   │
│  │     📈 المبيعات (Sales)         │   │
│  │        1,240 DH                 │   │
│  └─────────────────────────────────┘   │
│                                         │
│  ┌─────────────────────────────────┐   │
│  │     💰 الربح (Profit)           │   │
│  │        186 DH (15%)             │   │
│  └─────────────────────────────────┘   │
│                                         │
│  ┌─────────────────────────────────┐   │
│  │     🧾 عدد المبيعات: 23          │   │
│  │     (Number of sales)           │   │
│  └─────────────────────────────────┘   │
│                                         │
└─────────────────────────────────────────┘
```

**Requirements:**
- Toggle between today/week/month
- Show sales total, profit, and profit percentage
- Number of transactions

## File Structure

```
pos-app/
├── index.html          # Main HTML (single page app)
├── manifest.json       # PWA manifest
├── sw.js              # Service worker for offline
├── css/
│   └── style.css      # All styles (RTL support)
├── js/
│   ├── app.js         # Main app logic & routing
│   ├── db.js          # Dexie.js database setup
│   ├── scanner.js     # Barcode scanning logic
│   ├── screens/
│   │   ├── home.js
│   │   ├── scan.js
│   │   ├── confirm-sale.js
│   │   ├── add-product.js
│   │   ├── products.js
│   │   └── reports.js
│   └── utils/
│       ├── date.js    # Date formatting helpers
│       └── format.js  # Currency formatting
└── assets/
    └── icons/         # PWA icons
```

## UI/UX Guidelines

### Colors
- Primary (Green): #22c55e (sell button, success)
- Background: #f8fafc
- Card background: #ffffff
- Text primary: #1e293b
- Text secondary: #64748b
- Danger: #ef4444 (delete, cancel)

### Typography
- Font: System font stack (no custom fonts for speed)
- Use Arabic numerals: ٠١٢٣٤٥٦٧٨٩ (optional, standard 0-9 is fine)

### Touch Targets
- Minimum 48px height for all buttons
- Primary actions: 56px+ height
- Comfortable spacing between tap targets

### RTL Support
- `dir="rtl"` on HTML
- Use CSS logical properties: `margin-inline-start` instead of `margin-left`
- Back arrows point right (→) not left

## Arabic Text Reference

| English | Arabic |
|---------|--------|
| Sell | بيع |
| Products | المنتجات |
| Reports | التقارير |
| Today | اليوم |
| This Week | هذا الأسبوع |
| This Month | هذا الشهر |
| Sales | المبيعات |
| Profit | الربح |
| Product Name | اسم المنتج |
| Cost Price | سعر الشراء |
| Sell Price | سعر البيع |
| Quantity | الكمية |
| Confirm Sale | تأكيد البيع |
| Save | حفظ |
| Save & Sell | حفظ وبيع |
| Cancel | إلغاء |
| Add Product | إضافة منتج |
| New Product | منتج جديد |
| Sale Complete | تم البيع |
| Good Morning | صباح الخير |
| Good Evening | مساء الخير |
| Add Another | زيد منتج آخر |
| Manual Entry | إدخال يدوي |
| Point camera at barcode | وجه الكاميرا للباركود |
| Search | بحث |

## Day 1 Task

Build the home screen with:
1. Basic HTML structure with RTL support
2. Greeting that changes by time of day
3. Today's summary card (hardcoded values for now)
4. Big "بيع" button
5. Products and Reports navigation buttons
6. Basic CSS styling
7. PWA manifest.json

Start with static HTML/CSS, we'll add JavaScript and real data later.

## Commands to Start

```bash
# Create project folder
mkdir pos-app
cd pos-app

# Create file structure
mkdir -p css js/screens js/utils assets/icons

# Create main files
touch index.html manifest.json sw.js
touch css/style.css
touch js/app.js js/db.js js/scanner.js
```
