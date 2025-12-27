/**
 * Products Tab Component
 * Displays product list or empty state
 *
 * @version 1.0.0
 */

import { html, useState, useEffect } from '../lib/preact.js';
import { Icons } from './Icons.js';
import { AddProductTab } from './AddProductTab.js';
import { productDB } from '../lib/db.js';
import { formatCurrency, vibrate } from '../utils/helpers.js';

/**
 * Products Tab Component
 * @param {Object} props
 * @param {boolean} props.isActive - Whether this tab is active
 * @returns {import('preact').VNode}
 */
export function ProductsTab({ isActive }) {
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(false);
    const [showAddProduct, setShowAddProduct] = useState(false);

    // Load products from IndexedDB
    useEffect(() => {
        if (isActive) {
            loadProducts();
        }
    }, [isActive]);

    /**
     * Load all products from database
     */
    const loadProducts = async () => {
        try {
            setLoading(true);
            const allProducts = await productDB.getAll();
            setProducts(allProducts);
        } catch (error) {
            console.error('Error loading products:', error);
            // Fail gracefully - show empty state
            setProducts([]);
        } finally {
            setLoading(false);
        }
    };

    /**
     * Handle add product button
     */
    const handleAddClick = () => {
        vibrate();
        setShowAddProduct(true);
    };

    /**
     * Handle back from add product
     */
    const handleBack = () => {
        vibrate();
        setShowAddProduct(false);
    };

    /**
     * Handle save product
     */
    const handleSaveProduct = async (product) => {
        try {
            await productDB.add(product);
            await loadProducts();
            setShowAddProduct(false);
            vibrate();
        } catch (error) {
            console.error('Error saving product:', error);
            alert('حدث خطأ أثناء حفظ المنتج');
        }
    };

    // Show Add Product screen
    if (showAddProduct) {
        return html`
            <${AddProductTab}
                onBack=${handleBack}
                onSave=${handleSaveProduct}
            />
        `;
    }

    // Show products list or empty state
    return html`
        <div class="tab-content ${isActive ? 'active' : ''}" id="products-tab">
            <div class="tab-header">
                <h2 class="tab-title">المنتجات</h2>
                <button class="btn-icon-only">
                    <${Icons.Search} />
                </button>
            </div>

            ${loading ? html`
                <div class="empty-state">
                    <p>جاري التحميل...</p>
                </div>
            ` : products.length === 0 ? html`
                <!-- Empty State -->
                <div class="empty-state">
                    <div class="empty-icon">
                        <${Icons.Package} />
                    </div>
                    <h3 class="empty-title">لا توجد منتجات بعد</h3>
                    <p class="empty-text">ابدأ بإضافة منتجك الأول</p>
                    <button class="btn-primary-outline" onClick=${handleAddClick}>
                        <span class="btn-icon-inline">
                            <${Icons.Plus} />
                        </span>
                        إضافة منتج
                    </button>
                </div>
            ` : html`
                <!-- Products List -->
                <div class="products-list">
                    ${products.map(product => html`
                        <div class="product-card" key=${product.id}>
                            ${product.image && html`
                                <div class="product-image">
                                    <img src=${product.image} alt=${product.name} />
                                </div>
                            `}
                            <div class="product-info">
                                <h3 class="product-name">${product.name}</h3>
                                <span class="product-type">${product.saleType}</span>
                            </div>
                            <div class="product-prices">
                                <div class="product-price-row">
                                    <span class="price-label">سعر البيع:</span>
                                    <span class="price-value">${formatCurrency(product.salePrice)}</span>
                                </div>
                                <div class="product-price-row">
                                    <span class="price-label">سعر الشراء:</span>
                                    <span class="price-value secondary">${formatCurrency(product.costPrice)}</span>
                                </div>
                            </div>
                        </div>
                    `)}
                </div>

                <!-- Floating Add Button -->
                <button class="fab" onClick=${handleAddClick}>
                    <${Icons.Plus} />
                </button>
            `}
        </div>
    `;
}
